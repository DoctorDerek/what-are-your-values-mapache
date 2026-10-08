import { avatarMachine } from "@game/machines/src/AvatarMachine"
import { initializeBattleProfileStore } from "@game/machines/src/BattleProfileStore"
import { createInMemoryDurableStore } from "@game/machines/src/InMemoryDurableStore"
import { createInitialPlayerData } from "@game/machines/src/PlayerData"
import { rootMachine } from "@game/machines/src/RootMachine"
import type { RootActor } from "@game/machines/src/RuntimeRecovery"
import { RUNTIME_RECOVERY_COPY as copy } from "@game/machines/src/RuntimeRecoveryCopy"
import { decodeWayvmExport } from "@game/machines/src/WayvmExport"
import useRecoverableActorSnapshot from "@game/utils/src/useRecoverableActorSnapshot"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ActorRefFrom } from "xstate"
import GameSession from "@/components/GameSession"
import RuntimeRecovery from "@/components/RuntimeRecovery"
import * as PlayerDataFiles from "@/lib/PlayerDataFiles"

const fault = { render: false }

function GameView({ actor }: { readonly actor: RootActor }) {
  const snapshot = useRecoverableActorSnapshot(actor)
  if (fault.render) throw new Error("Render failure containing private data")
  return (
    <>
      <p>
        {snapshot.matches("Hub")
          ? "Working hub"
          : snapshot.matches("DressingRoom")
            ? "Working editor"
            : "Working game"}
      </p>
      {snapshot.children.avatar && (
        <EditorView actor={snapshot.children.avatar} />
      )}
    </>
  )
}

function EditorView({
  actor,
}: {
  readonly actor: ActorRefFrom<typeof avatarMachine>
}) {
  const snapshot = useRecoverableActorSnapshot(actor)
  return <p>Skin {snapshot.context.draft.skinPalette}</p>
}

async function mountSession() {
  const store = createInMemoryDurableStore()
  const createdAt = "2026-10-07T12:00:00.000Z"
  await initializeBattleProfileStore({
    store,
    playerData: createInitialPlayerData({
      schedulerSeed: "recovery",
      createdAt,
    }),
    createdAt,
    appVersion: "test",
  })
  const onReopen = vi.fn()
  let capturedActor: RootActor | undefined
  const content = (actor: RootActor) => {
    capturedActor = actor
    return <GameView actor={actor} />
  }
  const view = render(
    <GameSession durableStore={store} onReopen={onReopen}>
      {content}
    </GameSession>,
  )
  await screen.findByText("Working hub")
  if (!capturedActor) throw new Error("Session did not create an actor")
  return {
    ...view,
    store,
    actor: capturedActor,
    onReopen,
    redraw: () =>
      view.rerender(
        <GameSession durableStore={store} onReopen={onReopen}>
          {content}
        </GameSession>,
      ),
  }
}

afterEach(() => {
  fault.render = false
  vi.restoreAllMocks()
})

describe("Game session recovery", () => {
  it("contains an unexpected child actor failure and exports its retained draft", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const download = vi
      .spyOn(PlayerDataFiles, "downloadPlayerDataFile")
      .mockImplementation(() => undefined)
    const session = await mountSession()
    act(() => session.actor.send({ type: "AVATAR.OPEN_REQUESTED" }))
    const editor = session.actor.getSnapshot().children.avatar
    act(() =>
      editor?.send({ type: "AVATAR.CHANGE", change: { skinPalette: 6 } }),
    )
    const originalGuard = avatarMachine.implementations.guards.hasChanges
    avatarMachine.implementations.guards.hasChanges = () => {
      throw new Error("Unexpected child failure")
    }
    try {
      act(() => editor?.send({ type: "AVATAR.BACK_REQUESTED" }))
    } finally {
      avatarMachine.implementations.guards.hasChanges = originalGuard
    }
    await screen.findByText(copy.actorDetail)
    fireEvent.click(screen.getByRole("button", { name: copy.exportPlayer }))
    await screen.findByText(copy.exportReady)
    const backup = download.mock.calls[0][0]
    expect(
      (await decodeWayvmExport(backup.serialized)).playerData.appearance
        .skinPalette,
    ).toBe(6)
    expect(session.onReopen).not.toHaveBeenCalled()
  })

  it("retries a failed screen with the same actor and unsaved appearance draft", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const session = await mountSession()
    act(() => session.actor.send({ type: "AVATAR.OPEN_REQUESTED" }))
    const editor = session.actor.getSnapshot().children.avatar
    act(() =>
      editor?.send({ type: "AVATAR.CHANGE", change: { skinPalette: 6 } }),
    )
    const stored = await session.store.readAll()
    fault.render = true
    session.redraw()
    expect(screen.getByRole("heading", { name: copy.title })).toHaveFocus()
    expect(screen.queryByText(/private data/)).not.toBeInTheDocument()
    expect(session.actor.getSnapshot().status).toBe("active")
    fault.render = false
    fireEvent.click(screen.getByRole("button", { name: copy.retry }))
    expect(await screen.findByText("Working editor")).toBeVisible()
    expect(session.actor.getSnapshot().children.avatar).toBe(editor)
    expect(editor?.getSnapshot().context.draft.skinPalette).toBe(6)
    expect(await session.store.readAll()).toEqual(stored)
    expect(session.onReopen).not.toHaveBeenCalled()
  })

  it("retains a stopped actor for backup and requires confirmation before reopening", async () => {
    const download = vi
      .spyOn(PlayerDataFiles, "downloadPlayerDataFile")
      .mockImplementation(() => undefined)
    const session = await mountSession()
    act(() => session.actor.send({ type: "BATTLE.START_REQUESTED" }))
    const originalGuard = rootMachine.implementations.guards.canUndoBattle
    rootMachine.implementations.guards.canUndoBattle = () => {
      throw new Error("Unexpected actor failure")
    }
    try {
      act(() => session.actor.send({ type: "BATTLE.UNDO_REQUESTED" }))
    } finally {
      rootMachine.implementations.guards.canUndoBattle = originalGuard
    }
    expect(await screen.findByText(copy.actorDetail)).toBeVisible()
    expect(session.actor.getSnapshot().status).toBe("error")
    expect(
      screen.queryByRole("button", { name: copy.retry }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: copy.exportPlayer }))
    await screen.findByText(copy.exportReady)
    expect(download).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole("button", { name: copy.reopen }))
    expect(session.onReopen).not.toHaveBeenCalled()
    expect(
      screen.getByRole("heading", { name: copy.confirmTitle }),
    ).toHaveFocus()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByText(copy.confirmDetail)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: copy.reopen }))
    fireEvent.click(screen.getByRole("button", { name: copy.cancel }))
    expect(session.onReopen).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: copy.reopen }))
    fireEvent.click(screen.getByRole("button", { name: copy.confirm }))
    expect(session.onReopen).toHaveBeenCalledTimes(1)
  })

  it("keeps failed backup feedback actionable until a successful retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const download = vi
      .spyOn(PlayerDataFiles, "downloadPlayerDataFile")
      .mockImplementationOnce(() => {
        throw new Error("Blocked")
      })
      .mockImplementation(() => undefined)
    const session = await mountSession()
    fault.render = true
    session.redraw()
    fireEvent.click(screen.getByRole("button", { name: copy.exportStored }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      copy.exportFailed,
    )
    fireEvent.click(screen.getByRole("button", { name: copy.exportStored }))
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(copy.exportReady),
    )
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(download).toHaveBeenCalledTimes(2)
  })

  it("offers non-destructive retry when startup failed before a session exists", () => {
    const retry = vi.fn()
    render(<RuntimeRecovery onRetry={retry} />)
    expect(screen.getByText(copy.startupDetail)).toBeVisible()
    expect(
      screen.queryByRole("button", { name: copy.exportPlayer }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: copy.retry }))
    expect(retry).toHaveBeenCalledTimes(1)
  })
})
