import { fromPromise } from "xstate"
import type { BattleProfileEvent } from "./BattleProfileEvent"
import { hydrateBattleProfileStore } from "./BattleProfileHydration"
import {
  checkpointBattleProfileStoreHead,
  commitBattleProfileStoreEvent,
  initializeBattleProfileStore,
  type BattleProfileStoreState,
} from "./BattleProfileStore"
import type { DurableStoreAdapter } from "./DurableStoreAdapter"
import { getPlayerCatalogUpgradeEvent } from "./PlayerCatalogUpgrade"
import type { PlayerData } from "./PlayerData"

type HydrateBattleProfileInput = {
  readonly store: DurableStoreAdapter
  readonly appVersion: string
}

type InitializeBattleProfileInput = HydrateBattleProfileInput & {
  readonly playerData: PlayerData
  readonly createdAt: string
}

type CommitBattleProfileEventInput = {
  readonly store: DurableStoreAdapter
  readonly state: BattleProfileStoreState
  readonly event: BattleProfileEvent
  readonly committedAt: string
}

type CheckpointBattleProfileInput = {
  readonly store: DurableStoreAdapter
  readonly state: BattleProfileStoreState
  readonly checkpointedAt: string
}

export const hydrateBattleProfileActor = fromPromise(
  async ({
    input,
  }: {
    input: HydrateBattleProfileInput & { readonly now: () => string }
  }) => {
    const result = await hydrateBattleProfileStore(input)
    if (result.status !== "ready") return result
    const event = getPlayerCatalogUpgradeEvent(result.state.head.playerData)
    if (!event) return result

    const state = await commitBattleProfileStoreEvent({
      store: input.store,
      state: result.state,
      event,
      committedAt: input.now(),
    })
    return Object.freeze({ ...result, state })
  },
)

export const initializeBattleProfileActor = fromPromise(
  async ({ input }: { input: InitializeBattleProfileInput }) =>
    initializeBattleProfileStore({
      store: input.store,
      playerData: input.playerData,
      createdAt: input.createdAt,
      appVersion: input.appVersion,
    }),
)

export const commitBattleProfileEventActor = fromPromise(
  async ({ input }: { input: CommitBattleProfileEventInput }) =>
    commitBattleProfileStoreEvent(input),
)

export const checkpointBattleProfileActor = fromPromise(
  async ({ input }: { input: CheckpointBattleProfileInput }) =>
    checkpointBattleProfileStoreHead(input),
)
