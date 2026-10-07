import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import { HEROES99_CHOICES } from "@game/data/src/Heroes99DressingRoom"
import { avatarMachine } from "@game/machines/src/AvatarMachine"
import { inspectBattleProfileStore } from "@game/machines/src/BattleProfileHydration"
import { initializeBattleProfileStore } from "@game/machines/src/BattleProfileStore"
import { createInMemoryDurableStore } from "@game/machines/src/InMemoryDurableStore"
import { createInitialPlayerData } from "@game/machines/src/PlayerData"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import DressingRoom from "@/components/DressingRoom"

vi.mock("@/components/Heroes99Hero", () => ({ default: () => <div>Hero preview</div> }))
vi.mock("@/generated/heroes99/Heroes99Assets", async () => {
  const { HEROES99_CHOICES } = await import("@game/data/src/Heroes99DressingRoom")
  return { HEROES99_ASSETS: { layers: {}, palettes: {}, thumbnailAtlas: { src: "/choices.png" }, thumbnailIndexByChoiceId: Object.fromEntries(Object.values(HEROES99_CHOICES).flat().map((choice, index) => [choice.id, index])) } }
})

async function mountEditor() {
  const backing = createInMemoryDurableStore()
  const commit = vi.fn(backing.compareAndSwapVerified)
  const store = { ...backing, compareAndSwapVerified: commit }
  const state = await initializeBattleProfileStore({ store, playerData: createInitialPlayerData({ schedulerSeed: "dressing-room", createdAt: "2026-10-06T12:00:00.000Z" }), createdAt: "2026-10-06T12:00:00.000Z", appVersion: "test" })
  const actor = createActor(avatarMachine, { input: { store, state, now: () => "2026-10-06T12:01:00.000Z", random: () => 0.5 } }).start()
  const view = render(<DressingRoom actor={actor} shouldReduceMotion={false} />)
  return { actor, store, commit, ...view }
}

describe("Dressing Room", () => {
  it("offers every source style and applicable palettes, then saves the chosen appearance", async () => {
    const { actor, store } = await mountEditor()
    for (const [category, choices] of Object.entries(HEROES99_CHOICES)) {
      fireEvent.click(screen.getByRole("button", { name: category }))
      expect(within(screen.getByRole("group", { name: `${category} choices` })).getAllByRole("button")).toHaveLength(choices.length)
    }
    fireEvent.click(screen.getByRole("button", { name: "Dagger" }))
    expect(within(screen.getByRole("group", { name: "Weapon palette" })).getAllByRole("button")).toHaveLength(4)
    fireEvent.click(screen.getByRole("button", { name: "Palette 4" }))
    expect(screen.getByRole("button", { name: "Palette 4" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(screen.getByRole("button", { name: "Hair" }))
    expect(within(screen.getByRole("group", { name: "Hair palette" })).getAllByRole("button")).toHaveLength(10)
    fireEvent.click(screen.getByRole("button", { name: "None" }))
    expect(screen.queryByRole("group", { name: "Hair palette" })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Clothing" }))
    fireEvent.click(screen.getByRole("button", { name: "Outfit 17" }))
    expect(within(screen.getByRole("group", { name: "Clothing palette" })).getAllByRole("button")).toHaveLength(8)
    fireEvent.click(screen.getByRole("button", { name: "Palette 8" }))
    fireEvent.click(screen.getByRole("button", { name: "Save appearance" }))
    await waitFor(() => expect(actor.getSnapshot().status).toBe("done"))
    const restored = await inspectBattleProfileStore({ store, appVersion: "test" })
    if (restored.status !== "ready") throw new Error("Expected saved appearance")
    expect(restored.state.head.playerData.appearance).toMatchObject({ hairStyle: null, clothingStyle: 17, clothingPalette: 8, weaponStyle: "dagger", weaponPalette: 4 })
    actor.stop()
  })

  it("retains the draft through Back and allows explicit discard without a save", async () => {
    const { actor, store } = await mountEditor()
    const before = await store.readAll()
    fireEvent.click(screen.getByRole("button", { name: "Randomize" }))
    const draft = actor.getSnapshot().context.draft
    expect(draft).not.toEqual(DEFAULT_HEROES99_APPEARANCE)
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByRole("dialog", { name: "Keep your changes?" })).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }))
    expect(actor.getSnapshot().context.draft).toEqual(draft)
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    fireEvent.click(screen.getByRole("button", { name: "Discard changes" }))
    expect(actor.getSnapshot().status).toBe("done")
    expect(await store.readAll()).toEqual(before)
    actor.stop()
  })

  it("shows an actionable save error and disables editing until a retry settles", async () => {
    const { actor, commit } = await mountEditor()
    const backingCommit = commit.getMockImplementation()!
    fireEvent.click(screen.getByRole("button", { name: "Skin 6" }))
    commit.mockRejectedValueOnce(new Error("Disk full"))
    fireEvent.click(screen.getByRole("button", { name: "Save appearance" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Local save error")
    expect(screen.getByRole("button", { name: "Skin 6" })).toHaveAttribute("aria-pressed", "true")
    let finish: (() => void) | undefined
    commit.mockImplementationOnce(async transaction => { await new Promise<void>(resolve => { finish = resolve }); await backingCommit(transaction) })
    fireEvent.click(screen.getByRole("button", { name: "Retry save" }))
    expect(screen.getByRole("button", { name: "Saving appearance…" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Randomize" })).toBeDisabled()
    await waitFor(() => expect(finish).toBeDefined())
    await act(async () => { finish?.() })
    await waitFor(() => expect(actor.getSnapshot().status).toBe("done"))
    actor.stop()
  })
})
