import type { ValueId, ValuePair } from "@game/data/src/Value"
import { assign, setup } from "xstate"
import {
  DEFAULT_BATTLE_ANIMATION_SPEED,
  type BattleAnimationSpeed,
} from "./BattleAnimationSpeed"
import type { BattleSchedulerRestorePoint } from "./BattleScheduler"
import { areSchedulerIdentitiesEqual } from "./SchedulerIdentity"

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
      requestedAnimationSpeed: BattleAnimationSpeed
      activeAnimationSpeed: BattleAnimationSpeed
      shouldSkipCurrentAnimation: boolean
      onWinnerSelected: (
        winnerId: ValueId,
        expectedScheduler: BattleSchedulerRestorePoint,
      ) => void
    },
    events: {} as
      | { type: "BATTLE.PROJECTED"; battle: PresentedBattle }
      | { type: "VALUE.FOCUS_REQUESTED"; valueId: ValueId }
      | { type: "VALUE.WINNER_SELECTED"; valueId: ValueId }
      | { type: "ANIMATION.RESULT_FINISHED" }
      | { type: "BATTLE.SPEED_CHANGED"; speed: BattleAnimationSpeed },
    input: {} as {
      initialBattle: PresentedBattle
      animationSpeed?: BattleAnimationSpeed
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
    isNextBattleProjection: ({ context, event }) =>
      event.type === "BATTLE.PROJECTED" &&
      !areSchedulerIdentitiesEqual(
        context.currentBattle.scheduler,
        event.battle.scheduler,
      ),
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
    requestedAnimationSpeed:
      input.animationSpeed ?? DEFAULT_BATTLE_ANIMATION_SPEED,
    activeAnimationSpeed:
      input.animationSpeed ?? DEFAULT_BATTLE_ANIMATION_SPEED,
    shouldSkipCurrentAnimation: false,
    onWinnerSelected: input.onWinnerSelected,
  }),
  on: {
    "BATTLE.SPEED_CHANGED": {
      actions: assign({
        requestedAnimationSpeed: ({ event }) => event.speed,
        shouldSkipCurrentAnimation: ({ context, event }) =>
          context.shouldSkipCurrentAnimation ||
          (context.winnerId !== null && event.speed === "skip"),
      }),
    },
  },
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
            shouldSkipCurrentAnimation: false,
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
              activeAnimationSpeed: ({ context }) =>
                context.requestedAnimationSpeed,
              shouldSkipCurrentAnimation: ({ context }) =>
                context.requestedAnimationSpeed === "skip",
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
          guard: "isNextBattleProjection",
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
              shouldSkipCurrentAnimation: false,
            }),
          },
          {
            target: "Preparing",
            actions: assign({
              winnerId: null,
              focusedId: null,
              shouldSkipCurrentAnimation: false,
            }),
          },
        ],
      },
    },
  },
})
