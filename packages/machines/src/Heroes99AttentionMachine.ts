import { assign, setup } from "xstate"

type HeroAttentionContext = {
  canAnimate: boolean
  nextFlourish: 0 | 1 | 2
  flourish: 0 | 1 | 2
  generation: number
}
type HeroAttentionEvent =
  | { type: "HERO_ATTENTION.AVAILABILITY"; canAnimate: boolean }
  | { type: "HERO_ATTENTION.ACTIVATE" }
  | { type: "HERO_ATTENTION.COMPLETE"; generation: number }

export const heroes99AttentionMachine = setup({
  types: {
    context: {} as HeroAttentionContext,
    events: {} as HeroAttentionEvent,
  },
  actions: {
    recordAvailability: assign(({ event }) =>
      event.type === "HERO_ATTENTION.AVAILABILITY"
        ? { canAnimate: event.canAnimate }
        : {},
    ),
    beginFlourish: assign(({ context }) => ({
      flourish: context.nextFlourish,
      nextFlourish: context.nextFlourish === 0 ? 1 : context.nextFlourish === 1 ? 2 : 0,
      generation: context.generation + 1,
    })),
  },
}).createMachine({
  id: "heroes99Attention",
  initial: "Idle",
  context: { canAnimate: false, nextFlourish: 0, flourish: 0, generation: 0 },
  on: {
    "HERO_ATTENTION.AVAILABILITY": [
      {
        guard: ({ event }) => !event.canAnimate,
        target: ".Idle",
        actions: "recordAvailability",
      },
      { actions: "recordAvailability" },
    ],
  },
  states: {
    Idle: {
      on: {
        "HERO_ATTENTION.ACTIVATE": {
          guard: ({ context }) => context.canAnimate,
          target: "Flourishing",
          actions: "beginFlourish",
        },
      },
    },
    Flourishing: {
      on: {
        "HERO_ATTENTION.COMPLETE": {
          guard: ({ context, event }) => context.generation === event.generation,
          target: "Idle",
        },
      },
    },
  },
})
