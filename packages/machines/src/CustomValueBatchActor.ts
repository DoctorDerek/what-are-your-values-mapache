import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
import { fromPromise } from "xstate"
import {
  commitBattleProfileStoreEvent,
  type BattleProfileStoreState,
} from "./BattleProfileStore"
import { createCustomValueBatchAddCommit } from "./CustomValueCommands"
import type { DurableStoreAdapter } from "./DurableStoreAdapter"

export const commitCustomValueBatchActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      readonly drafts: readonly CustomValueDraft[]
      readonly state: BattleProfileStoreState
      readonly store: DurableStoreAdapter
      readonly now: () => string
      readonly randomUuid: () => string
    }
  }) => {
    const commit = createCustomValueBatchAddCommit({
      profile: input.state.head.playerData.profile,
      drafts: input.drafts,
      now: input.now,
      randomUuid: input.randomUuid,
    })
    return commitBattleProfileStoreEvent({
      store: input.store,
      state: input.state,
      event: commit.event,
      committedAt: input.now(),
    })
  },
)
