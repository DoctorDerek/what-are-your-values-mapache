import {
  randomizeHeroes99Appearance,
  type Heroes99Appearance,
} from "@game/data/src/Heroes99Appearance"
import { applyHeroes99Choice } from "@game/data/src/Heroes99DressingRoom"
import { assign, fromPromise, setup } from "xstate"
import { getErrorMessage } from "@game/utils/src/Errors"
import { inspectBattleProfileStore } from "./BattleProfileHydration"
import {
  replaceBattleProfileStorePlayerDataForLocalMutation,
  type BattleProfileStoreState,
} from "./BattleProfileStore"
import type { DurableStoreAdapter } from "./DurableStoreAdapter"
import { createPlayerData } from "./PlayerData"

type AvatarInput = Readonly<{
  store: DurableStoreAdapter
  state: BattleProfileStoreState
  now: () => string
  random: () => number
}>
type AvatarContext = AvatarInput & {
  draft: Heroes99Appearance
  hasEditFailure: boolean
  errorMessage: string | null
}
type AvatarEvent =
  | { type: "AVATAR.CHANGE"; change: Partial<Heroes99Appearance> }
  | { type: "AVATAR.RANDOMIZE" }
  | { type: "AVATAR.SAVE" }
  | { type: "AVATAR.CANCEL" }
  | { type: "AVATAR.BACK_REQUESTED" }
  | { type: "AVATAR.KEEP_EDITING" }

const saveAppearance = fromPromise(
  async ({ input }: { input: AvatarContext }) => {
    const current = await inspectBattleProfileStore({
      store: input.store,
      appVersion: input.state.appVersion,
    })
    if (current.status !== "ready")
      throw new Error(
        "The saved profile is unavailable. Your appearance draft is retained.",
      )
    if (
      JSON.stringify(current.state.head.playerData.appearance) ===
      JSON.stringify(input.draft)
    )
      return current.state
    return replaceBattleProfileStorePlayerDataForLocalMutation({
      store: input.store,
      state: current.state,
      playerData: createPlayerData({
        ...current.state.head.playerData,
        appearance: input.draft,
      }),
      replacedAt: input.now(),
    })
  },
)

export const avatarMachine = setup({
  types: {
    context: {} as AvatarContext,
    input: {} as AvatarInput,
    events: {} as AvatarEvent,
    output: {} as BattleProfileStoreState,
  },
  actors: { saveAppearance },
  guards: {
    hasChanges: ({ context }) =>
      JSON.stringify(context.draft) !==
      JSON.stringify(context.state.head.playerData.appearance),
  },
  actions: {
    changeAppearance: assign(({ context, event }) => {
      try {
        const draft =
          event.type === "AVATAR.CHANGE"
            ? applyHeroes99Choice(context.draft, event.change)
            : event.type === "AVATAR.RANDOMIZE"
              ? randomizeHeroes99Appearance(context.random)
              : context.draft
        return { draft, hasEditFailure: false, errorMessage: null }
      } catch (error) {
        return { hasEditFailure: true, errorMessage: getErrorMessage(error) }
      }
    }),
  },
}).createMachine({
  id: "avatar",
  context: ({ input }) => ({
    ...input,
    draft: input.state.head.playerData.appearance,
    hasEditFailure: false,
    errorMessage: null,
  }),
  initial: "Editing",
  output: ({ context }) => context.state,
  states: {
    Editing: {
      on: {
        "AVATAR.CHANGE": { actions: "changeAppearance" },
        "AVATAR.RANDOMIZE": { actions: "changeAppearance" },
        "AVATAR.SAVE": "Saving",
        "AVATAR.CANCEL": "Done",
        "AVATAR.BACK_REQUESTED": [
          { guard: "hasChanges", target: "ConfirmingLeave" },
          { target: "Done" },
        ],
      },
    },
    ConfirmingLeave: {
      on: {
        "AVATAR.SAVE": "Saving",
        "AVATAR.CANCEL": "Done",
        "AVATAR.KEEP_EDITING": "Editing",
        "AVATAR.BACK_REQUESTED": "Editing",
      },
    },
    Saving: {
      entry: assign({ errorMessage: null }),
      invoke: {
        src: "saveAppearance",
        input: ({ context }) => context,
        onDone: {
          target: "Done",
          actions: assign({ state: ({ event }) => event.output }),
        },
        onError: { target: "SaveFailed", actions: assign({ errorMessage: ({ event }) => getErrorMessage(event.error) }) },
      },
    },
    SaveFailed: {
      on: {
        "AVATAR.SAVE": "Saving",
        "AVATAR.CHANGE": { actions: "changeAppearance" },
        "AVATAR.RANDOMIZE": { actions: "changeAppearance" },
        "AVATAR.CANCEL": "Done",
        "AVATAR.BACK_REQUESTED": "ConfirmingLeave",
      },
    },
    Done: { type: "final" },
  },
})
