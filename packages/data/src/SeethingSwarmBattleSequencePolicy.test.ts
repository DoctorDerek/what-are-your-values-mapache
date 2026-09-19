import { describe, expect, it } from "vitest"
import { resolveSeethingSwarmBattleSequence } from "./SeethingSwarmBattleSequencePolicy"
import type { SeethingSwarmRuntimeCharacterClip } from "./SeethingSwarmRuntimeClipCatalog"

function createClips(
  ...animationIds: string[]
): SeethingSwarmRuntimeCharacterClip<string>[] {
  return animationIds.map((animationId) =>
    Object.freeze({
      kind: "character",
      animalId: "raccoonpack",
      animationId,
      relativePath: `${animationId}.png`,
      frameWidth: 32,
      frameHeight: 32,
      frameCount: 4,
      visibleBounds: { left: 0, top: 0, width: 32, height: 32 },
      asset: animationId,
    } satisfies SeethingSwarmRuntimeCharacterClip<string>),
  )
}

describe("SeethingSwarm complete source sequences", () => {
  it("resolves the bat's whole attack with or without an explicit calm continuation", () => {
    const clips = createClips(
      "fly_forward",
      "attack",
      "land_upright",
      "idle_upright",
    ).map((clip) => ({ ...clip, animalId: "bat" as const }))
    expect(resolveSeethingSwarmBattleSequence(clips[1], clips)).toEqual(
      clips.slice(0, 3),
    )
    expect(
      resolveSeethingSwarmBattleSequence(clips[1], clips, clips[3]),
    ).toEqual(clips)
    expect(
      resolveSeethingSwarmBattleSequence(clips[1], clips.slice(0, 2)),
    ).toBeNull()
  })
  it.each([
    ["hide", ["hide", "unhide"]],
    ["unhide", ["hide", "unhide"]],
    ["fall", ["jump", "fall", "land"]],
    ["jump", ["jump", "fall", "land"]],
    ["fly", ["takeoff", "fly", "fall", "land"]],
    ["attack_air", ["takeoff", "attack_air", "fall", "land"]],
    ["land_upright", ["fly_forward", "land_upright"]],
    ["liedown_idle", ["liedown_godown", "liedown_idle", "liedown_getup"]],
  ] as const)(
    "resolves %s only with all authored partners",
    (animationId, expected) => {
      const clips = createClips(...expected)
      const selected = clips.find((clip) => clip.animationId === animationId)!
      const sequence = resolveSeethingSwarmBattleSequence(selected, clips)
      expect(sequence?.map((clip) => clip.animationId)).toEqual(expected)
      expect(Object.isFrozen(sequence)).toBe(true)
      expect(sequence?.every((clip) => clips.includes(clip))).toBe(true)
      const incomplete = clips.filter((clip) => clip !== clips.at(-1))
      expect(
        resolveSeethingSwarmBattleSequence(selected, incomplete),
      ).toBeNull()
    },
  )

  it("does not invent a jump substitute for the approved flight takeoff", () => {
    const clips = createClips("jump", "fly", "land")
    expect(resolveSeethingSwarmBattleSequence(clips[1], clips)).toBeNull()
  })

  it("settles a complete resting transition into idle rather than looping its exit", () => {
    const clips = createClips("hide", "unhide", "idle")
    expect(
      resolveSeethingSwarmBattleSequence(clips[0], clips, clips[2])?.map(
        (clip) => clip.animationId,
      ),
    ).toEqual(["hide", "unhide", "idle"])
    expect(
      resolveSeethingSwarmBattleSequence(
        clips[0],
        [clips[0], clips[2]],
        clips[2],
      ),
    ).toBeNull()
  })

  it("preserves self-contained moves without manufacturing a compound", () => {
    const clips = createClips("dance")
    expect(resolveSeethingSwarmBattleSequence(clips[0], clips)).toEqual(clips)
  })
})
