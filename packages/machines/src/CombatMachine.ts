import type { ValueId, ValuePair } from "@game/data/src/Value"
import { assign, setup } from "xstate"
import type { BattleSchedulerRestorePoint } from "./BattleScheduler"

export type PresentedBattle = {
  readonly pair: ValuePair
  readonly scheduler: BattleSchedulerRestorePoint
}

export const combatMachine = setup({
  types: {
    context: {} as {
      currentBattle: PresentedBattle
      pendingBattle: PresentedBattle | null
      winnerId: ValueId | null
      focusedId: ValueId | null
      onWinnerSelected: (
        winnerId: ValueId,
        expectedScheduler: BattleSchedulerRestorePoint,
      ) => void
    },
    events: {} as
      | { type: "BATTLE.PROJECTED"; battle: PresentedBattle }
      | { type: "VALUE.FOCUS_REQUESTED"; valueId: ValueId }
      | { type: "VALUE.WINNER_SELECTED"; valueId: ValueId }
      | { type: "ANIMATION.RESULT_FINISHED" },
    input: {} as {
      initialBattle: PresentedBattle
      onWinnerSelected: (
        winnerId: ValueId,
        expectedScheduler: BattleSchedulerRestorePoint,
      ) => void
    },
  },
  guards: {
    isPresentedValue: ({ context, event }) => {
      if (
        event.type !== "VALUE.FOCUS_REQUESTED" &&
        event.type !== "VALUE.WINNER_SELECTED"
      ) {
        return false
      }

      return context.currentBattle.pair.includes(event.valueId)
    },
    hasPendingBattle: ({ context }) => context.pendingBattle !== null,
  },
  actions: {
    notifyWinnerSelected: ({ context, event }) => {
      if (event.type !== "VALUE.WINNER_SELECTED") {
        throw new Error("Winner selection is missing its projected battle")
      }

      context.onWinnerSelected(event.valueId, context.currentBattle.scheduler)
    },
  },
}).createMachine({
  id: "combat",
  initial: "AwaitingInput",
  context: ({ input }) => ({
    currentBattle: input.initialBattle,
    pendingBattle: null,
    winnerId: null,
    focusedId: null,
    onWinnerSelected: input.onWinnerSelected,
  }),
  states: {
    Preparing: {
      on: {
        "BATTLE.PROJECTED": {
          target: "AwaitingInput",
          actions: assign({
            currentBattle: ({ event }) => event.battle,
            pendingBattle: null,
            winnerId: null,
            focusedId: null,
          }),
        },
      },
    },
    AwaitingInput: {
      on: {
        "BATTLE.PROJECTED": {
          actions: assign({
            currentBattle: ({ event }) => event.battle,
            focusedId: null,
          }),
        },
        "VALUE.FOCUS_REQUESTED": {
          guard: "isPresentedValue",
          actions: assign({
            focusedId: ({ event }) => event.valueId,
          }),
        },
        "VALUE.WINNER_SELECTED": {
          guard: "isPresentedValue",
          target: "AnimatingResult",
          actions: [
            assign({
              winnerId: ({ event }) => event.valueId,
              focusedId: null,
            }),
            "notifyWinnerSelected",
          ],
        },
      },
    },
    AnimatingResult: {
      on: {
        "BATTLE.PROJECTED": {
          actions: assign({
            pendingBattle: ({ event }) => event.battle,
          }),
        },
        "ANIMATION.RESULT_FINISHED": [
          {
            guard: "hasPendingBattle",
            target: "AwaitingInput",
            actions: assign({
              currentBattle: ({ context }) =>
                context.pendingBattle ?? context.currentBattle,
              pendingBattle: null,
              winnerId: null,
              focusedId: null,
            }),
          },
          {
            target: "Preparing",
            actions: assign({
              winnerId: null,
              focusedId: null,
            }),
          },
        ],
      },
    },
  },
})
