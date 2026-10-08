import {
  type PreparedValuesCard,
  type PrepareValuesCard,
  type ValuesCardDelivery,
  type ValuesCardFormat,
} from "@game/data/src/ValuesCard"
import { getErrorMessage } from "@game/utils/src/Errors"
import { assign, fromPromise, setup } from "xstate"

export const VALUES_CARD_PREPARATION_TIMEOUT_MS = 30_000
type ShareContext = {
  prepare: PrepareValuesCard
  format: ValuesCardFormat
  includeHero: boolean
  artifact: PreparedValuesCard | null
  error: string | null
  outcome: ValuesCardDelivery | null
  delivery: "save" | "share"
}
type ShareEvent =
  | { type: "CARD_SHARE.FORMAT"; format: ValuesCardFormat }
  | { type: "CARD_SHARE.HERO"; includeHero: boolean }
  | { type: "CARD_SHARE.RETRY" }
  | { type: "CARD_SHARE.DELIVER"; delivery: "save" | "share" }
  | { type: "CARD_SHARE.CLOSE" }

const prepare = fromPromise<PreparedValuesCard, ShareContext>(async ({ input, signal }) => {
  const controller = new AbortController()
  const abort = () => controller.abort(signal.reason)
  signal.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(() => controller.abort(new Error("Card preparation took too long. Please retry.")), VALUES_CARD_PREPARATION_TIMEOUT_MS)
  let rejectAborted: () => void = () => undefined
  const aborted = new Promise<never>((_, reject) => {
    rejectAborted = () => reject(controller.signal.reason)
    controller.signal.addEventListener("abort", rejectAborted, { once: true })
  })
  try {
    signal.throwIfAborted()
    return await Promise.race([aborted, input.prepare({ format: input.format, includeHero: input.includeHero, signal: controller.signal }).then((artifact) => {
      if (controller.signal.aborted) {
        artifact.dispose()
        controller.signal.throwIfAborted()
      }
      return artifact
    })])
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener("abort", abort)
    controller.signal.removeEventListener("abort", rejectAborted)
  }
})

export const valuesCardShareMachine = setup({
  types: {
    context: {} as ShareContext,
    input: {} as { prepare: PrepareValuesCard },
    events: {} as ShareEvent,
  },
  actors: {
    prepare,
    deliver: fromPromise<ValuesCardDelivery, ShareContext>(({ input }) => {
      if (!input.artifact) throw new Error("The card is not ready")
      return input.artifact[input.delivery]()
    }),
  },
  actions: {
    releaseArtifact: assign(({ context }) => {
      context.artifact?.dispose()
      return { artifact: null, error: null, outcome: null }
    }),
  },
}).createMachine({
  id: "valuesCardShare",
  context: ({ input }) => ({ ...input, format: "gif", includeHero: true, artifact: null, error: null, outcome: null, delivery: "save" }),
  initial: "Preparing",
  on: {
    "CARD_SHARE.CLOSE": { target: ".Closed", actions: "releaseArtifact" },
    "CARD_SHARE.FORMAT": { target: ".Preparing", reenter: true, actions: ["releaseArtifact", assign({ format: ({ event }) => event.format })] },
    "CARD_SHARE.HERO": { target: ".Preparing", reenter: true, actions: ["releaseArtifact", assign({ includeHero: ({ event }) => event.includeHero })] },
  },
  states: {
    Preparing: {
      invoke: {
        src: "prepare", input: ({ context }) => context,
        onDone: { target: "Ready", actions: assign({ artifact: ({ event }) => event.output }) },
        onError: { target: "Failed", actions: assign({ error: ({ event }) => getErrorMessage(event.error) }) },
      },
    },
    Failed: { on: { "CARD_SHARE.RETRY": { target: "Preparing", actions: "releaseArtifact" } } },
    Ready: {
      on: { "CARD_SHARE.DELIVER": { target: "Delivering", actions: assign({ delivery: ({ event }) => event.delivery, error: null, outcome: null }) } },
    },
    Delivering: {
      on: { "CARD_SHARE.FORMAT": {}, "CARD_SHARE.HERO": {} },
      invoke: {
        src: "deliver", input: ({ context }) => context,
        onDone: { target: "Ready", actions: assign({ outcome: ({ event }) => event.output }) },
        onError: { target: "Ready", actions: assign({ error: ({ event }) => getErrorMessage(event.error) }) },
      },
    },
    Closed: { type: "final" },
  },
})
