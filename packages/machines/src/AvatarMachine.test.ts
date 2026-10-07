import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import { describe, expect, it } from "vitest"
import { createActor, waitFor } from "xstate"
import { avatarMachine } from "./AvatarMachine"
import { inspectBattleProfileStore } from "./BattleProfileHydration"
import {
  initializeBattleProfileStore,
  replaceBattleProfileStorePlayerDataForLocalMutation,
} from "./BattleProfileStore"
import type { DurableStoreAdapter } from "./DurableStoreAdapter"
import { createInMemoryDurableStore } from "./InMemoryDurableStore"
import { createInitialPlayerData, createPlayerData } from "./PlayerData"

const timestamp = "2026-10-06T12:00:00.000Z"
async function editor() {
  const backing = createInMemoryDurableStore()
  let failWrites = false
  const store: DurableStoreAdapter = {
    readAll: backing.readAll,
    compareAndSwapVerified: async (transaction) => {
      if (failWrites) throw new Error("Storage unavailable")
      await backing.compareAndSwapVerified(transaction)
    },
  }
  const state = await initializeBattleProfileStore({
    store,
    playerData: createInitialPlayerData({
      schedulerSeed: "avatar-test",
      createdAt: timestamp,
    }),
    createdAt: timestamp,
    appVersion: "test",
  })
  const actor = createActor(avatarMachine, {
    input: { store, state, now: () => timestamp, random: () => 0.5 },
  }).start()
  return {
    actor,
    store,
    state,
    failWrites: (value: boolean) => {
      failWrites = value
    },
  }
}

describe("Appearance editor", () => {
  it("keeps changes as a draft, asks on Back, and discards without writing", async () => {
    const { actor, store } = await editor()
    const before = await store.readAll()
    actor.send({ type: "AVATAR.CHANGE", change: { skinPalette: 6 } })
    expect(actor.getSnapshot().context.draft.skinPalette).toBe(6)
    expect(await store.readAll()).toEqual(before)
    actor.send({ type: "AVATAR.BACK_REQUESTED" })
    expect(actor.getSnapshot().matches("ConfirmingLeave")).toBe(true)
    actor.send({ type: "AVATAR.KEEP_EDITING" })
    expect(actor.getSnapshot().context.draft.skinPalette).toBe(6)
    actor.send({ type: "AVATAR.BACK_REQUESTED" })
    actor.send({ type: "AVATAR.BACK_REQUESTED" })
    expect(actor.getSnapshot().matches("Editing")).toBe(true)
    actor.send({ type: "AVATAR.CANCEL" })
    expect(actor.getSnapshot().status).toBe("done")
    expect(await store.readAll()).toEqual(before)
    actor.stop()
  })

  it("saves into the latest profile and restores the appearance on reload", async () => {
    const { actor, store, state } = await editor()
    const latest = createPlayerData({
      ...state.head.playerData,
      settings: {
        ...state.head.playerData.settings,
        battleAnimationSpeed: "3x",
      },
    })
    await replaceBattleProfileStorePlayerDataForLocalMutation({
      store,
      state,
      playerData: latest,
      replacedAt: timestamp,
    })
    actor.send({
      type: "AVATAR.CHANGE",
      change: {
        hairStyle: null,
        clothingStyle: 17,
        weaponStyle: "dagger",
        weaponPalette: 4,
      },
    })
    actor.send({ type: "AVATAR.SAVE" })
    await waitFor(actor, (snapshot) => snapshot.status === "done")
    const restored = await inspectBattleProfileStore({
      store,
      appVersion: "test",
    })
    if (restored.status !== "ready") throw new Error("Expected saved profile")
    expect(restored.state.head.playerData.appearance).toMatchObject({
      hairStyle: null,
      clothingStyle: 17,
      weaponStyle: "dagger",
      weaponPalette: 4,
    })
    expect(restored.state.head.playerData.settings.battleAnimationSpeed).toBe(
      "3x",
    )
    expect(restored.state.head.playerData.profile).toEqual(latest.profile)
    expect(restored.state.head.playerData.achievements).toEqual(
      latest.achievements,
    )
    actor.stop()
  })

  it("retains a failed save, permits retry, and never claims acceptance early", async () => {
    const { actor, failWrites, store } = await editor()
    const before = await store.readAll()
    actor.send({ type: "AVATAR.RANDOMIZE" })
    const draft = actor.getSnapshot().context.draft
    failWrites(true)
    actor.send({ type: "AVATAR.SAVE" })
    await waitFor(actor, (snapshot) => snapshot.matches("SaveFailed"))
    expect(actor.getSnapshot().context.draft).toEqual(draft)
    expect(
      actor.getSnapshot().context.state.head.playerData.appearance,
    ).toEqual(DEFAULT_HEROES99_APPEARANCE)
    expect(await store.readAll()).toEqual(before)
    actor.send({ type: "AVATAR.BACK_REQUESTED" })
    expect(actor.getSnapshot().matches("ConfirmingLeave")).toBe(true)
    failWrites(false)
    actor.send({ type: "AVATAR.SAVE" })
    await waitFor(actor, (snapshot) => snapshot.status === "done")
    expect(actor.getSnapshot().output?.head.playerData.appearance).toEqual(
      draft,
    )
    actor.stop()
  })

  it.each(["AVATAR.SAVE", "AVATAR.BACK_REQUESTED"] as const)(
    "does not write an unchanged draft through %s",
    async (type) => {
      const { actor, store } = await editor()
      const before = await store.readAll()
      actor.send({ type })
      await waitFor(actor, (snapshot) => snapshot.status === "done")
      expect(await store.readAll()).toEqual(before)
      actor.stop()
    },
  )
})
