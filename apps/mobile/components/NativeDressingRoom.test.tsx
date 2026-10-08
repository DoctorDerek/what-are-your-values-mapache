import {
  DRESSING_ROOM_COPY,
  HEROES99_CHOICES,
} from "@game/data/src/Heroes99DressingRoom"
import { avatarMachine } from "@game/machines/src/AvatarMachine"
import { initializeBattleProfileStore } from "@game/machines/src/BattleProfileStore"
import { createInMemoryDurableStore } from "@game/machines/src/InMemoryDurableStore"
import { createInitialPlayerData } from "@game/machines/src/PlayerData"
import { describe, expect, it, jest } from "@jest/globals"
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import { createActor } from "xstate"
import NativeDressingRoom from "@/components/NativeDressingRoom"

jest.mock("@/components/NativeHeroes99Hero", () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock("@/generated/heroes99/Heroes99Assets", () => {
  const { HEROES99_CHOICES } = jest.requireActual<
    typeof import("@game/data/src/Heroes99DressingRoom")
  >("@game/data/src/Heroes99DressingRoom")
  return {
    HEROES99_ASSETS: {
      layers: {},
      palettes: {},
      thumbnailAtlas: 1,
      thumbnailIndexByChoiceId: Object.fromEntries(
        Object.values(HEROES99_CHOICES)
          .flat()
          .map((choice, index) => [choice.id, index]),
      ),
    },
  }
})

async function mountEditor(reduceMotion = false) {
  const backing = createInMemoryDurableStore()
  const commit = jest.fn(backing.compareAndSwapVerified)
  const store = { ...backing, compareAndSwapVerified: commit }
  const state = await initializeBattleProfileStore({
    store,
    playerData: createInitialPlayerData({
      schedulerSeed: "native-dressing",
      createdAt: "2026-10-06T12:00:00.000Z",
    }),
    createdAt: "2026-10-06T12:00:00.000Z",
    appVersion: "test",
  })
  const actor = createActor(avatarMachine, {
    input: {
      store,
      state,
      now: () => "2026-10-06T12:01:00.000Z",
      random: () => 0.5,
    },
  }).start()
  const onShare = jest.fn()
  const view = await render(
    <NativeDressingRoom actor={actor} shouldReduceMotion={reduceMotion} onShare={onShare} />,
  )
  return { actor, store, commit, onShare, ...view }
}

describe("native Dressing Room", () => {
  it("shares the current appearance draft without saving or closing the editor", async () => {
    const { actor, store, onShare } = await mountEditor()
    const before = await store.readAll()
    await fireEvent.press(screen.getByRole("button", { name: "Skin 6" }))
    await fireEvent.press(screen.getByRole("button", { name: "Share my values card" }))
    expect(onShare).toHaveBeenCalledWith(actor.getSnapshot().context.draft)
    expect(actor.getSnapshot().status).toBe("active")
    expect(actor.getSnapshot().context.draft.skinPalette).toBe(6)
    expect(await store.readAll()).toEqual(before)
    actor.stop()
  })

  it("retains a valid draft after a rejected choice and clears feedback on a valid choice", async () => {
    const { actor } = await mountEditor()
    await fireEvent.press(screen.getByRole("button", { name: "Skin 6" }))
    await act(async () =>
      actor.send({ type: "AVATAR.CHANGE", change: { skinPalette: 999 } }),
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      DRESSING_ROOM_COPY.editError,
    )
    expect(actor.getSnapshot().context.draft.skinPalette).toBe(6)
    await fireEvent.press(screen.getByRole("button", { name: "Skin 4" }))
    expect(screen.queryByText(DRESSING_ROOM_COPY.editError)).toBeNull()
    expect(actor.getSnapshot().context.draft.skinPalette).toBe(4)
    actor.stop()
  })

  it("renders every category and applies choices and palettes through the shared editor", async () => {
    const { actor } = await mountEditor()
    for (const category of [
      "Skin",
      "Face",
      "Hair",
      "Clothing",
      "Weapon",
    ] as const) {
      await fireEvent.press(screen.getByRole("button", { name: category }))
      for (const choice of HEROES99_CHOICES[category])
        expect(
          screen.getByRole("button", { name: choice.label }),
        ).toBeOnTheScreen()
    }
    await fireEvent.press(screen.getByRole("button", { name: "Dagger" }))
    await fireEvent.press(screen.getByRole("button", { name: "Palette 4" }))
    expect(screen.getByRole("button", { name: "Palette 4" })).toBeSelected()
    await fireEvent.press(screen.getByRole("button", { name: "Hair" }))
    await fireEvent.press(screen.getByRole("button", { name: "None" }))
    expect(screen.queryByLabelText("Hair palette")).toBeNull()
    await fireEvent.press(screen.getByRole("button", { name: "Clothing" }))
    await fireEvent.press(screen.getByRole("button", { name: "Outfit 17" }))
    await fireEvent.press(screen.getByRole("button", { name: "Palette 8" }))
    await fireEvent.press(
      screen.getByRole("button", { name: "Save appearance" }),
    )
    await waitFor(() => expect(actor.getSnapshot().status).toBe("done"))
    expect(
      actor.getSnapshot().output?.head.playerData.appearance,
    ).toMatchObject({
      hairStyle: null,
      clothingStyle: 17,
      clothingPalette: 8,
      weaponStyle: "dagger",
      weaponPalette: 4,
    })
    actor.stop()
  })

  it("keeps or discards edits through the native Back confirmation", async () => {
    const { actor, store } = await mountEditor(true)
    const before = await store.readAll()
    await fireEvent.press(screen.getByRole("button", { name: "Randomize" }))
    await fireEvent.press(screen.getByRole("button", { name: "Back" }))
    expect(
      screen.getByRole("header", { name: "Keep your changes?" }),
    ).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole("button", { name: "Keep editing" }))
    await fireEvent.press(screen.getByRole("button", { name: "Back" }))
    await fireEvent.press(
      screen.getByRole("button", { name: "Discard changes" }),
    )
    expect(actor.getSnapshot().status).toBe("done")
    expect(await store.readAll()).toEqual(before)
    actor.stop()
  })

  it("can cancel directly or save from the confirmation", async () => {
    const first = await mountEditor()
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }))
    expect(first.actor.getSnapshot().status).toBe("done")
    await first.unmount()
    first.actor.stop()
    const second = await mountEditor()
    await fireEvent.press(screen.getByRole("button", { name: "Skin 6" }))
    await fireEvent.press(screen.getByRole("button", { name: "Back" }))
    await fireEvent.press(
      screen.getByRole("button", { name: "Save and return" }),
    )
    await waitFor(() => expect(second.actor.getSnapshot().status).toBe("done"))
    second.actor.stop()
  })

  it("keeps an actionable error and blocks edits while retrying", async () => {
    const { actor, commit } = await mountEditor()
    const backingCommit = commit.getMockImplementation()!
    await fireEvent.press(screen.getByRole("button", { name: "Skin 6" }))
    commit.mockRejectedValueOnce(new Error("Disk full"))
    await fireEvent.press(
      screen.getByRole("button", { name: "Save appearance" }),
    )
    await screen.findByText("✕ Local save error")
    let finish: (() => void) | undefined
    commit.mockImplementationOnce(async (transaction) => {
      await new Promise<void>((resolve) => {
        finish = resolve
      })
      await backingCommit(transaction)
    })
    await fireEvent.press(screen.getByRole("button", { name: "Retry save" }))
    expect(
      screen.getByRole("button", { name: "Saving appearance…" }),
    ).toBeDisabled()
    expect(screen.getByRole("button", { name: "Randomize" })).toBeDisabled()
    await waitFor(() => expect(finish).toBeDefined())
    await act(async () => {
      finish?.()
    })
    await waitFor(() => expect(actor.getSnapshot().status).toBe("done"))
    actor.stop()
  })
})
