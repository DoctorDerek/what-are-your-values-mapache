import { describe, expect, it, vi } from "vitest"
import { createActor, waitFor } from "xstate"
import { initializeBattleProfileStore } from "./BattleProfileStore"
import { projectBattlePair } from "./BattleScheduler"
import { createInMemoryDurableStore } from "./InMemoryDurableStore"
import { createInitialPlayerData } from "./PlayerData"
import { rootMachine } from "./RootMachine"
import {
  prepareRuntimePlayerBackup,
  prepareRuntimeStoredBackup,
  runtimeRecoveryMachine,
} from "./RuntimeRecovery"
import { decodeWayvmExport } from "./WayvmExport"

async function game() {
  const backing = createInMemoryDurableStore()
  const store = {
    readAll: vi.fn(backing.readAll),
    compareAndSwapVerified: vi.fn(backing.compareAndSwapVerified),
  }
  const now = () => "2026-10-07T12:00:00.000Z"
  await initializeBattleProfileStore({
    store,
    playerData: createInitialPlayerData({
      schedulerSeed: "recovery",
      createdAt: now(),
    }),
    createdAt: now(),
    appVersion: "test",
  })
  const actor = createActor(rootMachine, {
    input: {
      durableStore: store,
      appVersion: "test",
      sourceBuild: "test",
      now,
      randomUuid: () => "recovery",
    },
  }).start()
  actor.send({ type: "APP.HYDRATED", schedulerSeed: "recovery" })
  await waitFor(actor, (snapshot) => snapshot.matches("Hub"))
  return { actor, store, backing }
}

describe("Runtime recovery", () => {
  it("exports the retained appearance draft without writing or discarding it", async () => {
    const { actor, store } = await game()
    const before = await store.readAll()
    actor.send({ type: "AVATAR.OPEN_REQUESTED" })
    const editor = actor.getSnapshot().children.avatar
    expect(editor).toBeDefined()
    editor?.send({ type: "AVATAR.CHANGE", change: { skinPalette: 6 } })
    const backup = await prepareRuntimePlayerBackup(actor.getSnapshot())
    const decoded = await decodeWayvmExport(backup.serialized)
    expect(decoded.playerData.appearance.skinPalette).toBe(6)
    expect(await store.readAll()).toEqual(before)
    expect(actor.getSnapshot().matches("DressingRoom")).toBe(true)
    actor.stop()
  })

  it("includes a held battle result exactly once without accepting the failed save", async () => {
    const { actor, store } = await game()
    const before = await store.readAll()
    store.compareAndSwapVerified.mockRejectedValue(new Error("Disk full"))
    actor.send({ type: "BATTLE.START_REQUESTED" })
    const profile = actor.getSnapshot().context.playerData?.profile
    if (!profile) throw new Error("Expected a hydrated profile")
    actor.send({
      type: "BATTLE.WINNER_SELECTED",
      winnerId: projectBattlePair(profile.activeDeck, profile.scheduler)[0],
      expectedScheduler: profile.scheduler,
    })
    await waitFor(actor, (snapshot) => snapshot.matches("PersistenceFailure"))
    const backup = await prepareRuntimePlayerBackup(actor.getSnapshot())
    const decoded = await decodeWayvmExport(backup.serialized)
    expect(decoded.playerData.profile.history).toHaveLength(1)
    expect(
      actor.getSnapshot().context.playerData?.profile.history,
    ).toHaveLength(0)
    expect(await store.readAll()).toEqual(before)
    const snapshot = actor.getSnapshot()
    await expect(
      prepareRuntimePlayerBackup({
        ...snapshot,
        context: { ...snapshot.context, pendingBattleProfileCommittedAt: null },
      }),
    ).rejects.toThrow("cannot be exported safely")
    actor.stop()
  })

  it("contains export delivery failures and allows a successful retry without overlapping exports", async () => {
    const { actor, store } = await game()
    const before = await store.readAll()
    const deliverDownload = vi
      .fn()
      .mockRejectedValueOnce(new Error("Download blocked"))
      .mockResolvedValue(undefined)
    const recovery = createActor(runtimeRecoveryMachine, {
      input: { gameActor: actor, deliverDownload },
    }).start()
    recovery.send({ type: "RECOVERY.EXPORT", backupKind: "player" })
    recovery.send({ type: "RECOVERY.EXPORT", backupKind: "stored" })
    await waitFor(recovery, (snapshot) => snapshot.matches("Failed"))
    expect(recovery.getSnapshot().context.errorMessage).toBe("Download blocked")
    expect(deliverDownload).toHaveBeenCalledTimes(1)
    recovery.send({ type: "RECOVERY.EXPORT", backupKind: "stored" })
    await waitFor(recovery, (snapshot) => snapshot.matches("Exported"))
    expect(recovery.getSnapshot().context.errorMessage).toBeNull()
    expect(deliverDownload).toHaveBeenCalledTimes(2)
    expect(deliverDownload.mock.lastCall?.[0].serialized).toContain(
      "wayvm-recovery-bundle",
    )
    expect(await store.readAll()).toEqual(before)
    recovery.stop()
    actor.stop()
  })

  it("keeps raw recovery bytes available when player data cannot be serialized", async () => {
    const { actor, store } = await game()
    const snapshot = actor.getSnapshot()
    const entries = new Map([["original", "unreadable original bytes"]])
    const retained = {
      ...snapshot,
      context: {
        ...snapshot.context,
        playerData: null,
        recoveryEntries: entries,
      },
    }
    store.readAll.mockRejectedValue(new Error("Storage unavailable"))
    await expect(prepareRuntimePlayerBackup(retained)).rejects.toThrow(
      "No player profile",
    )
    const backup = await prepareRuntimeStoredBackup(retained)
    expect(backup.serialized).toContain("unreadable original bytes")
    await expect(prepareRuntimeStoredBackup(snapshot)).rejects.toThrow(
      "Storage unavailable",
    )
    actor.stop()
  })
})
