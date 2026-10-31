import { describe, expect, it } from "vitest"
import { createActor } from "xstate"
import { heroes99AttentionMachine } from "./Heroes99AttentionMachine"

describe("Home hero attention", () => {
  it("cycles accepted flourishes, ignores overlapping input and stale completions, and never queues", () => {
    const actor = createActor(heroes99AttentionMachine).start()
    actor.send({ type: "HERO_ATTENTION.ACTIVATE" })
    expect(actor.getSnapshot().matches("Idle")).toBe(true)
    actor.send({ type: "HERO_ATTENTION.AVAILABILITY", canAnimate: true })
    for (const flourish of [0, 1, 2, 0]) {
      actor.send({ type: "HERO_ATTENTION.ACTIVATE" })
      const { generation } = actor.getSnapshot().context
      expect(actor.getSnapshot().matches("Flourishing")).toBe(true)
      expect(actor.getSnapshot().context.flourish).toBe(flourish)
      actor.send({ type: "HERO_ATTENTION.ACTIVATE" })
      actor.send({ type: "HERO_ATTENTION.COMPLETE", generation: generation - 1 })
      expect(actor.getSnapshot().matches("Flourishing")).toBe(true)
      actor.send({ type: "HERO_ATTENTION.COMPLETE", generation })
      expect(actor.getSnapshot().matches("Idle")).toBe(true)
      expect(actor.getSnapshot().context.generation).toBe(generation)
    }
    actor.stop()
  })

  it("settles on reduced motion, lost artwork or backgrounding without replaying on resume", () => {
    const actor = createActor(heroes99AttentionMachine).start()
    actor.send({ type: "HERO_ATTENTION.AVAILABILITY", canAnimate: true })
    actor.send({ type: "HERO_ATTENTION.ACTIVATE" })
    actor.send({ type: "HERO_ATTENTION.AVAILABILITY", canAnimate: false })
    expect(actor.getSnapshot().matches("Idle")).toBe(true)
    actor.send({ type: "HERO_ATTENTION.ACTIVATE" })
    actor.send({ type: "HERO_ATTENTION.AVAILABILITY", canAnimate: true })
    expect(actor.getSnapshot().matches("Idle")).toBe(true)
    actor.send({ type: "HERO_ATTENTION.ACTIVATE" })
    expect(actor.getSnapshot().context.flourish).toBe(1)
    actor.stop()
  })
})
