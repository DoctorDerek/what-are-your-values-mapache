import type { ZooAnimalId } from "@game/data/src/ZooAnimals"
import { assign, setup } from "xstate"

export type SeethingSwarmVariedRole =
  "entry" | "rest" | "attack" | "reaction" | "flourish"
export type SeethingSwarmRoleOrdinals = Readonly<
  Record<SeethingSwarmVariedRole, number>
>
export type SeethingSwarmAnimalOrdinals = ReadonlyMap<
  ZooAnimalId,
  SeethingSwarmRoleOrdinals
>

export const INITIAL_SEETHING_SWARM_ROLE_ORDINALS: SeethingSwarmRoleOrdinals =
  Object.freeze({
    entry: 0,
    rest: 0,
    attack: 0,
    reaction: 0,
    flourish: 0,
  })

type Performance = Readonly<{
  identity: string
  scope: string
  isOpen: boolean
  ordinals: SeethingSwarmAnimalOrdinals
  entered: ReadonlySet<string>
}>

export type SeethingSwarmBattleVariationContext = Readonly<{
  nextOrdinals: SeethingSwarmAnimalOrdinals
  performance: Performance | null
}>

export const seethingSwarmBattleVariationMachine = setup({
  types: {
    context: {} as SeethingSwarmBattleVariationContext,
    events: {} as
      | {
          type: "PERFORMANCE.PRESENTED"
          identity: string
          scope: string
          animalIds: readonly ZooAnimalId[]
        }
      | { type: "PERFORMANCE.CLOSED"; identity: string; scope: string }
      | {
          type: "PERFORMANCE.ROLE_ENTERED"
          identity: string
          scope: string
          animalId: ZooAnimalId
          role: SeethingSwarmVariedRole
        },
  },
}).createMachine({
  context: () => ({ nextOrdinals: new Map(), performance: null }),
  on: {
    "PERFORMANCE.PRESENTED": {
      actions: assign(({ context, event }) => {
        const previous = context.performance
        if (
          previous?.identity === event.identity &&
          previous.scope === event.scope
        )
          return previous.isOpen
            ? {}
            : { performance: { ...previous, isOpen: true } }
        return {
          performance: {
            identity: event.identity,
            scope: event.scope,
            isOpen: true,
            ordinals: new Map(
              event.animalIds.map((animalId) => [
                animalId,
                context.nextOrdinals.get(animalId) ??
                  INITIAL_SEETHING_SWARM_ROLE_ORDINALS,
              ]),
            ),
            entered: new Set<string>(),
          },
        }
      }),
    },
    "PERFORMANCE.CLOSED": {
      actions: assign(({ context, event }) => {
        const performance = context.performance
        return performance?.identity === event.identity &&
          performance.scope === event.scope
          ? { performance: { ...performance, isOpen: false } }
          : {}
      }),
    },
    "PERFORMANCE.ROLE_ENTERED": {
      actions: assign(({ context, event }) => {
        const performance = context.performance
        const key = `${event.animalId}:${event.role}`
        if (
          !performance?.isOpen ||
          performance.identity !== event.identity ||
          performance.scope !== event.scope ||
          performance.entered.has(key)
        )
          return {}
        const selected = performance.ordinals.get(event.animalId)
        if (!selected) return {}
        const next =
          context.nextOrdinals.get(event.animalId) ??
          INITIAL_SEETHING_SWARM_ROLE_ORDINALS
        return {
          nextOrdinals: new Map(context.nextOrdinals).set(event.animalId, {
            ...next,
            [event.role]: selected[event.role] + 1,
          }),
          performance: {
            ...performance,
            entered: new Set([...performance.entered, key]),
          },
        }
      }),
    },
  },
})

export function projectSeethingSwarmBattleOrdinals(
  context: SeethingSwarmBattleVariationContext | undefined,
  identity: string,
  scope?: string,
): SeethingSwarmAnimalOrdinals | undefined {
  const performance = context?.performance
  return performance?.identity === identity &&
    (scope === undefined ? performance.isOpen : performance.scope === scope)
    ? performance.ordinals
    : context?.nextOrdinals
}
