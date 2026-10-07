import { initializeBattleProfileStore } from "@game/machines/src/BattleProfileStore"
import { createInMemoryDurableStore } from "@game/machines/src/InMemoryDurableStore"
import { createInitialPlayerData } from "@game/machines/src/PlayerData"
import { rootMachine } from "@game/machines/src/RootMachine"
import type { RootActor } from "@game/machines/src/RuntimeRecovery"
import { RUNTIME_RECOVERY_COPY as copy } from "@game/machines/src/RuntimeRecoveryCopy"
import useRecoverableActorSnapshot from "@game/utils/src/useRecoverableActorSnapshot"
import { afterEach, describe, expect, it, jest } from "@jest/globals"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { BackHandler, Text } from "react-native"
import NativeGameSession from "@/components/NativeGameSession"
import NativeRuntimeRecovery from "@/components/NativeRuntimeRecovery"
import { expoDurableStore } from "@/lib/ExpoDurableStore"
import { expoPlayerDataFileAdapter } from "@/lib/ExpoPlayerDataFiles"

jest.mock("@/lib/ExpoDurableStore", () => ({
  expoDurableStore: { readAll: jest.fn(), compareAndSwapVerified: jest.fn() },
}))
jest.mock("@/lib/ExpoPlayerDataFiles", () => ({
  expoPlayerDataFileAdapter: { exportJson: jest.fn() },
}))
jest.mock("expo-crypto", () => ({ randomUUID: () => "native-recovery" }))

const fault = { render: false }
const exportJson = jest.mocked(expoPlayerDataFileAdapter.exportJson)

function GameView({ actor }: { readonly actor: RootActor }) {
  const snapshot = useRecoverableActorSnapshot(actor)
  if (fault.render) throw new Error("Private rendering failure")
  return <Text>{snapshot.matches("Hub") ? "Working hub" : "Working game"}</Text>
}

async function mountSession() {
  const store = createInMemoryDurableStore()
  const createdAt = "2026-10-07T12:00:00.000Z"
  await initializeBattleProfileStore({ store, playerData: createInitialPlayerData({ schedulerSeed: "recovery", createdAt }), createdAt, appVersion: "test" })
  jest.mocked(expoDurableStore.readAll).mockImplementation(store.readAll)
  jest.mocked(expoDurableStore.compareAndSwapVerified).mockImplementation(store.compareAndSwapVerified)
  const onReopen = jest.fn()
  let capturedActor: RootActor | undefined
  const content = (actor: RootActor) => { capturedActor = actor; return <GameView actor={actor} /> }
  const view = await render(<NativeGameSession onReopen={onReopen}>{content}</NativeGameSession>)
  await screen.findByText("Working hub")
  if (!capturedActor) throw new Error("Expected native game actor")
  return { ...view, actor: capturedActor, store, onReopen, redraw: () => view.rerender(<NativeGameSession onReopen={onReopen}>{content}</NativeGameSession>) }
}

afterEach(() => { fault.render = false; jest.restoreAllMocks() })

describe("Native session recovery", () => {
  it("retries rendering while retaining the actor and unsaved appearance", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined)
    const session = await mountSession()
    await act(async () => session.actor.send({ type: "AVATAR.OPEN_REQUESTED" }))
    const editor = session.actor.getSnapshot().children.avatar
    await act(async () => editor?.send({ type: "AVATAR.CHANGE", change: { skinPalette: 6 } }))
    const before = await session.store.readAll()
    fault.render = true
    await session.redraw()
    expect(screen.getByRole("header", { name: copy.title })).toBeOnTheScreen()
    expect(screen.queryByText("Private rendering failure")).toBeNull()
    fault.render = false
    await fireEvent.press(screen.getByRole("button", { name: copy.retry }))
    await screen.findByText("Working game")
    expect(session.actor.getSnapshot().children.avatar).toBe(editor)
    expect(editor?.getSnapshot().context.draft.skinPalette).toBe(6)
    expect(await session.store.readAll()).toEqual(before)
    expect(session.onReopen).not.toHaveBeenCalled()
  })

  it("retains an errored session for backup, recovery retry, and explicit reopening", async () => {
    let back: Parameters<typeof BackHandler.addEventListener>[1] | undefined
    const remove = jest.fn()
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, listener) => { back = listener; return { remove } })
    exportJson.mockRejectedValueOnce(new Error("Sharing unavailable")).mockResolvedValue(undefined)
    const session = await mountSession()
    await act(async () => session.actor.send({ type: "BATTLE.START_REQUESTED" }))
    const originalGuard = rootMachine.implementations.guards.canUndoBattle
    rootMachine.implementations.guards.canUndoBattle = () => { throw new Error("Actor failure") }
    try {
      await act(async () => session.actor.send({ type: "BATTLE.UNDO_REQUESTED" }))
    } finally {
      rootMachine.implementations.guards.canUndoBattle = originalGuard
    }
    await screen.findByText(copy.actorDetail)
    expect(session.actor.getSnapshot().status).toBe("error")
    await fireEvent.press(screen.getByRole("button", { name: copy.exportPlayer }))
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.exportFailed)
    let finish: (() => void) | undefined
    exportJson.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve }))
    await fireEvent.press(screen.getByRole("button", { name: copy.exportStored }))
    await screen.findByText(copy.exporting)
    expect(screen.getByRole("button", { name: copy.reopen })).toBeDisabled()
    await waitFor(() => expect(finish).toBeDefined())
    await act(async () => finish?.())
    await screen.findByText(copy.exportReady)
    expect(exportJson).toHaveBeenCalledTimes(2)
    await fireEvent.press(screen.getByRole("button", { name: copy.reopen }))
    expect(screen.getByText(copy.confirmDetail)).toBeOnTheScreen()
    await act(async () => { expect(back?.({ type: "hardwareBackPress", timeStamp: Date.now() })).toBe(true) })
    expect(screen.queryByText(copy.confirmDetail)).toBeNull()
    await fireEvent.press(screen.getByRole("button", { name: copy.reopen }))
    await fireEvent.press(screen.getByRole("button", { name: copy.cancel }))
    expect(session.onReopen).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByRole("button", { name: copy.reopen }))
    await fireEvent.press(screen.getByRole("button", { name: copy.confirm }))
    expect(session.onReopen).toHaveBeenCalledTimes(1)
    await session.unmount()
    expect(remove).toHaveBeenCalledTimes(1)
  })

  it("offers a startup retry without pretending a profile backup exists", async () => {
    const retry = jest.fn()
    await render(<NativeRuntimeRecovery onRetry={retry} />)
    expect(screen.getByText(copy.startupDetail)).toBeOnTheScreen()
    expect(screen.queryByRole("button", { name: copy.exportPlayer })).toBeNull()
    await fireEvent.press(screen.getByRole("button", { name: copy.retry }))
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
