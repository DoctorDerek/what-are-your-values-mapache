import { describe, expect, it } from "vitest"
import { createActor } from "xstate"
import {
  INITIAL_SEETHING_SWARM_ROLE_ORDINALS,
  projectSeethingSwarmBattleOrdinals,
  seethingSwarmBattleVariationMachine,
  type SeethingSwarmVariedRole,
} from "./SeethingSwarmBattleVariation"

const presentation = {
  type: "PERFORMANCE.PRESENTED",
  identity: "battle-a",
  scope: "mounted-stage-a",
  animalIds: ["raccoonpack", "wolfpack"],
} as const

function enter(role: SeethingSwarmVariedRole) {
  return {
    type: "PERFORMANCE.ROLE_ENTERED",
    identity: presentation.identity,
    scope: presentation.scope,
    animalId: "raccoonpack",
    role,
  } as const
}

function start() {
  return createActor(seethingSwarmBattleVariationMachine).start()
}

describe("mounted battle variation", () => {
  it("projects future preparation repeatedly without consuming any role", () => {
    const actor = start()
    const context = actor.getSnapshot().context
    expect(projectSeethingSwarmBattleOrdinals(undefined, "battle")).toBeUndefined()
    for (let index = 0; index < 10; index += 1)
      expect(projectSeethingSwarmBattleOrdinals(context, "pending")).toBe(context.nextOrdinals)
    expect(context.nextOrdinals.size).toBe(0)
    actor.stop()
  })

  it("holds the current recipe while advancing only genuinely entered roles", () => {
    const actor = start()
    actor.send(presentation)
    const selected = actor.getSnapshot().context.performance!.ordinals
    actor.send(enter("entry"))
    actor.send(enter("entry"))
    actor.send(enter("attack"))
    const context = actor.getSnapshot().context
    expect(projectSeethingSwarmBattleOrdinals(context, presentation.identity)).toBe(selected)
    expect(selected.get("raccoonpack")).toEqual(INITIAL_SEETHING_SWARM_ROLE_ORDINALS)
    expect(projectSeethingSwarmBattleOrdinals(context, "next")!.get("raccoonpack")).toEqual({
      entry: 1, rest: 0, attack: 1, reaction: 0, flourish: 0,
    })
    expect(context.nextOrdinals.has("wolfpack")).toBe(false)
    actor.stop()
  })

  it("reopens StrictMode scopes without counting a second performance", () => {
    const actor = start()
    actor.send(presentation)
    actor.send(enter("entry"))
    const selected = actor.getSnapshot().context.performance!.ordinals
    actor.send({ ...presentation, type: "PERFORMANCE.CLOSED" })
    expect(projectSeethingSwarmBattleOrdinals(actor.getSnapshot().context, presentation.identity)).not.toBe(selected)
    expect(projectSeethingSwarmBattleOrdinals(actor.getSnapshot().context, presentation.identity, presentation.scope)).toBe(selected)
    actor.send(presentation)
    actor.send(presentation)
    actor.send(enter("entry"))
    expect(actor.getSnapshot().context.performance!.ordinals).toBe(selected)
    expect(actor.getSnapshot().context.nextOrdinals.get("raccoonpack")!.entry).toBe(1)
    actor.stop()
  })

  it("retains app-session counters across a real stage remount and resets on app reload", () => {
    const actor = start()
    actor.send(presentation)
    actor.send(enter("rest"))
    actor.send({ ...presentation, type: "PERFORMANCE.CLOSED" })
    actor.send({ ...presentation, scope: "mounted-stage-b" })
    expect(actor.getSnapshot().context.performance!.ordinals.get("raccoonpack")!.rest).toBe(1)
    expect(actor.getSnapshot().context.performance!.entered.size).toBe(0)
    actor.stop()
    const reloaded = start()
    reloaded.send(presentation)
    expect(reloaded.getSnapshot().context.performance!.ordinals.get("raccoonpack")!.rest).toBe(0)
    reloaded.stop()
  })

  it("ignores closed, stale, and unpresented-animal callbacks", () => {
    const actor = start()
    actor.send(enter("attack"))
    actor.send(presentation)
    actor.send({ ...enter("attack"), identity: "old" })
    actor.send({ ...enter("attack"), scope: "old" })
    actor.send({ ...enter("attack"), animalId: "bat" })
    actor.send({ ...presentation, type: "PERFORMANCE.CLOSED", identity: "old" })
    expect(actor.getSnapshot().context.performance!.isOpen).toBe(true)
    actor.send({ ...presentation, type: "PERFORMANCE.CLOSED" })
    actor.send(enter("attack"))
    expect(actor.getSnapshot().context.nextOrdinals.size).toBe(0)
    actor.stop()
  })

  it("counts shared-animal custom-value presentations only once per animal role", () => {
    const actor = start()
    actor.send({ ...presentation, animalIds: ["raccoonpack", "raccoonpack"] })
    actor.send(enter("reaction"))
    actor.send(enter("reaction"))
    expect(actor.getSnapshot().context.performance!.ordinals.size).toBe(1)
    expect(actor.getSnapshot().context.nextOrdinals.get("raccoonpack")!.reaction).toBe(1)
    actor.send({ ...presentation, identity: "battle-b" })
    expect(actor.getSnapshot().context.performance!.ordinals.get("raccoonpack")!.reaction).toBe(1)
    expect(actor.getSnapshot().context.performance!.entered.size).toBe(0)
    actor.stop()
  })
})
