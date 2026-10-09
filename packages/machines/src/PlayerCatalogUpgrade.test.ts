import { CANONICAL_CATALOG_VERSION, SOURCE_CATALOG_VERSION, createCanonicalValueId, createCustomValueId } from "@game/data/src/Value"
import { describe, expect, it, vi } from "vitest"
import { createActor, toPromise, waitFor } from "xstate"
import { applyBattleChoice, applyDeckRevision } from "./BattleProfile"
import { createBattleChoiceEvent, createDeckRevisionEvent } from "./BattleProfileEvent"
import { hydrateBattleProfileStore } from "./BattleProfileHydration"
import { applyBattleProfileEventToPlayerData } from "./BattleProfileJournal"
import { hydrateBattleProfileActor } from "./BattleProfilePersistenceActors"
import { replaceUnrecoverablePlayerDataActor } from "./BattleProfileRecoveryActors"
import { BATTLE_PROFILE_PRE_IMPORT_BACKUP_KEY, commitBattleProfileStoreEvent, initializeBattleProfileStore } from "./BattleProfileStore"
import { projectBattlePair } from "./BattleScheduler"
import { createInMemoryDurableStore } from "./InMemoryDurableStore"
import { getPlayerCatalogUpgradeEvent, upgradePlayerDataCatalog } from "./PlayerCatalogUpgrade"
import { createInitialPlayerData } from "./PlayerData"
import { prepareWayvmDownload, replacePlayerDataActor } from "./PlayerDataPortabilityActors"
import { rootMachine } from "./RootMachine"
import { createWayvmExportV1TestVector } from "./WayvmExportV1TestVector"

const UPGRADED_AT = "2026-10-09T20:00:00.000Z"
const appVersion = "9.1.0"

async function createLegacyPlayerData() {
  return (await createWayvmExportV1TestVector()).wayvmExport.playerData
}

async function initializeLegacyStore() {
  const playerData = await createLegacyPlayerData()
  const store = createInMemoryDurableStore()
  const state = await initializeBattleProfileStore({ store, playerData, createdAt: playerData.progressGenerationStartedAt, appVersion })
  return { playerData, store, state }
}

describe("Player catalog upgrade", () => {
  it("retains earned progress, identity, preferences and presented achievements", async () => {
    const playerData = await createLegacyPlayerData()
    const upgraded = upgradePlayerDataCatalog({ playerData, upgradedAt: UPGRADED_AT })

    expect(playerData.profile.activeDeck.catalogVersion).toBe(SOURCE_CATALOG_VERSION)
    expect(upgraded.profile.activeDeck.catalogVersion).toBe(CANONICAL_CATALOG_VERSION)
    expect(upgraded.profile.activeDeck.values).toHaveLength(104)
    expect(upgraded.profile.activeDeck.customValues).toEqual(playerData.profile.activeDeck.customValues)
    for (const [valueId, progress] of playerData.profile.progressById) {
      expect(upgraded.profile.progressById.get(valueId)).toEqual({ ...progress, currentCycleWins: 0 })
    }
    for (const name of ["ingenuity", "destiny", "pets"]) {
      expect(upgraded.profile.progressById.get(createCanonicalValueId(`wayvm:${name}`))).toEqual({ totalXp: 0, profileWins: 0, profileComparisons: 0, currentCycleWins: 0 })
    }
    expect(upgraded.settings).toEqual(playerData.settings)
    expect(upgraded.appearance).toEqual(playerData.appearance)
    expect(upgraded.progressGenerationStartedAt).toBe(playerData.progressGenerationStartedAt)
    expect(upgraded.achievements.unlocks).toEqual(playerData.achievements.unlocks)
    expect(upgraded.achievements.presentedAchievementIds).toEqual(playerData.achievements.presentedAchievementIds)
    expect(upgraded.achievements.progress.lifetimeBattleCount).toBe(playerData.achievements.progress.lifetimeBattleCount)
    expect(upgraded.profile.history).toEqual([])
    expect(upgraded.profile.redo).toEqual([])
    expect(getPlayerCatalogUpgradeEvent(upgraded)).toBeNull()
    expect(upgradePlayerDataCatalog({ playerData: upgraded, upgradedAt: UPGRADED_AT })).toBe(upgraded)
  })

  it("keeps all three same-name custom records separate from their new built-ins", async () => {
    let playerData = await createLegacyPlayerData()
    const customValues = ["Ingenuity", "Destiny", "Pets"].map((name, index) => ({
      kind: "custom" as const,
      id: createCustomValueId(`custom:00000000-0000-4000-8000-00000000000${index + 1}`),
      name,
      definition: `My personal meaning of ${name}.`,
      creationOrdinal: index + 2,
      createdAt: UPGRADED_AT,
      updatedAt: UPGRADED_AT,
    }))
    playerData = applyBattleProfileEventToPlayerData({ playerData, event: createDeckRevisionEvent(applyDeckRevision({ profile: playerData.profile, revisedCustomValues: [...playerData.profile.activeDeck.customValues, ...customValues] })), occurredAt: UPGRADED_AT })
    const pair = projectBattlePair(playerData.profile.activeDeck, playerData.profile.scheduler)
    const winnerId = pair.find((id) => customValues.some((value) => value.id === id))
    if (!winnerId) throw new Error("The legacy join pass must include an added custom value")
    playerData = applyBattleProfileEventToPlayerData({ playerData, event: createBattleChoiceEvent(applyBattleChoice({ profile: playerData.profile, winnerId, expectedScheduler: playerData.profile.scheduler })), occurredAt: UPGRADED_AT })
    const upgraded = upgradePlayerDataCatalog({ playerData, upgradedAt: UPGRADED_AT })

    expect(upgraded.profile.activeDeck.customValues).toEqual(playerData.profile.activeDeck.customValues)
    expect(upgraded.profile.activeDeck.values).toHaveLength(107)
    expect(upgraded.profile.progressById.get(winnerId)?.totalXp).toBeGreaterThan(0)
    expect(upgraded.profile.progressById.get(winnerId)?.totalXp).toBe(playerData.profile.progressById.get(winnerId)?.totalXp)
  })

  it("replays legacy deck journals before one durable upgrade and does not upgrade twice", async () => {
    const { store, state, playerData } = await initializeLegacyStore()
    const customValue = playerData.profile.activeDeck.customValues[0]
    const event = createDeckRevisionEvent(applyDeckRevision({ profile: playerData.profile, revisedCustomValues: [{ ...customValue, definition: "My revised legacy definition." }] }))
    const legacyState = await commitBattleProfileStoreEvent({ store, state, event, committedAt: UPGRADED_AT })
    const before = await hydrateBattleProfileStore({ store, appVersion })
    expect(before).toMatchObject({ status: "ready", state: legacyState })
    expect(legacyState.head.playerData.profile.activeDeck.catalogVersion).toBe(SOURCE_CATALOG_VERSION)
    const actor = createActor(hydrateBattleProfileActor, { input: { store, appVersion, now: () => UPGRADED_AT } })
    actor.start()
    const result = await toPromise(actor)
    if (result.status !== "ready") throw new Error("Expected upgraded durable profile")
    expect(result.state.head.generation).toBe(legacyState.head.generation + 1)
    expect(result.state.head.playerData.profile.activeDeck.catalogVersion).toBe(CANONICAL_CATALOG_VERSION)
    expect(result.state.head.playerData.profile.activeDeck.customValues[0].definition).toBe("My revised legacy definition.")
    const bytes = await store.readAll()
    const secondActor = createActor(hydrateBattleProfileActor, { input: { store, appVersion, now: () => UPGRADED_AT } })
    secondActor.start()
    expect(await toPromise(secondActor)).toEqual(result)
    expect(await store.readAll()).toEqual(bytes)
  })

  it("keeps failed upgrades in loading recovery without exposing unsaved playable data", async () => {
    const { store } = await initializeLegacyStore()
    const bytes = await store.readAll()
    const failingStore = { ...store, compareAndSwapVerified: vi.fn(store.compareAndSwapVerified).mockRejectedValueOnce(new Error("Storage full")) }
    const actor = createActor(rootMachine, { input: { durableStore: failingStore, appVersion, sourceBuild: "catalog-test", now: () => UPGRADED_AT, randomUuid: () => "00000000-0000-4000-8000-000000000000" } })
    actor.start()
    actor.send({ type: "APP.HYDRATED", schedulerSeed: "upgrade-retry" })
    await waitFor(actor, (snapshot) => snapshot.matches("PersistenceFailure"))
    expect(actor.getSnapshot().context.battleProfileStoreState).toBeNull()
    expect(actor.getSnapshot().matches("Hub")).toBe(false)
    expect(actor.getSnapshot().context.persistenceIssue).toBe("Storage full")
    expect(await store.readAll()).toEqual(bytes)
    actor.send({ type: "STORAGE_RECOVERY.RETRY_REQUESTED" })
    await waitFor(actor, (snapshot) => snapshot.matches("Hub"))
    expect(actor.getSnapshot().context.playerData?.profile.activeDeck.catalogVersion).toBe(CANONICAL_CATALOG_VERSION)
    expect(await hydrateBattleProfileStore({ store, appVersion })).toMatchObject({ status: "ready", state: { head: { playerData: actor.getSnapshot().context.playerData } } })
    actor.stop()
  })

  it("upgrades validated older imports inside atomic replacement and retains the pre-import backup", async () => {
    const playerData = await createLegacyPlayerData()
    const currentPlayerData = createInitialPlayerData({ schedulerSeed: "current", createdAt: UPGRADED_AT })
    const store = createInMemoryDurableStore()
    const state = await initializeBattleProfileStore({ store, playerData: currentPlayerData, createdAt: UPGRADED_AT, appVersion })
    const backup = await prepareWayvmDownload({ playerData: currentPlayerData, exportedAt: UPGRADED_AT, sourceAppVersion: appVersion, sourceBuild: "catalog-test" })
    const actor = createActor(replacePlayerDataActor, { input: { store, state, playerData, preImportBackupBytes: backup.serialized, replacedAt: UPGRADED_AT } })
    actor.start()
    const result = await toPromise(actor)
    expect(result.head.playerData).toEqual(upgradePlayerDataCatalog({ playerData, upgradedAt: UPGRADED_AT }))
    expect((await store.readAll()).get(BATTLE_PROFILE_PRE_IMPORT_BACKUP_KEY)).toBe(backup.serialized)
    expect(await hydrateBattleProfileStore({ store, appVersion })).toMatchObject({ status: "ready", state: { head: result.head } })
  })

  it("uses the same upgrade when a validated backup replaces an unrecoverable profile", async () => {
    const playerData = await createLegacyPlayerData()
    const store = createInMemoryDurableStore()
    const actor = createActor(replaceUnrecoverablePlayerDataActor, { input: { store, entries: await store.readAll(), playerData, replacedAt: UPGRADED_AT, appVersion } })
    actor.start()
    const result = await toPromise(actor)
    expect(result.head.playerData).toEqual(upgradePlayerDataCatalog({ playerData, upgradedAt: UPGRADED_AT }))
    expect(await hydrateBattleProfileStore({ store, appVersion })).toMatchObject({ status: "ready", state: { head: result.head } })
  })
})
