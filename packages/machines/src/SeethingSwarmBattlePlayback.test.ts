import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { createSeethingSwarmAnimalPresentationGeometry } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmLicensedRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createCanonicalValueId } from "@game/data/src/Value"
import { describe, expect, it } from "vitest"
import { createSchedulerRestorePoint } from "./PairScheduler"
import { createSeethingSwarmBattleChoreography } from "./SeethingSwarmBattleChoreography"
import { resolveSeethingSwarmTravelDuration } from "./SeethingSwarmBattleExchange"
import {
  createSeethingSwarmAttentionPlayback,
  createSeethingSwarmBattlePlayback,
  getSeethingSwarmBattleClips,
} from "./SeethingSwarmBattlePlayback"

const pair = [
  createCanonicalValueId("pvcs-2011:mastery"),
  createCanonicalValueId("pvcs-2011:courage"),
] as const
const animals = (["raccoonpack", "wolfpack"] as const).map((animalId) => ({
  animalId,
  characterClips: [
    "run",
    "idle",
    "crouch",
    "attack",
    "hurt",
    animalId === "raccoonpack" ? "bark" : "howl",
  ].map((animationId) => ({
    kind: "character" as const,
    animalId,
    animationId,
    relativePath: `${animalId}/${animationId}.png`,
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    visibleBounds: { left: 0, top: 0, width: 32, height: 32 },
    asset: animationId,
  })),
  auxiliaryEffectClips: [],
  referencePose: Object.freeze({
    animationId: "idle",
    frameIndex: 0,
    bounds: Object.freeze({ left: 0, top: 0, width: 32, height: 32 }),
    anchor: Object.freeze({ x: 16, y: 32 }),
  }),
}))
const catalog = {
  mode: "licensed",
  evidenceSnapshotId: "playback-test",
  animals,
  characterClipCount: 12,
  auxiliaryEffectClipCount: 0,
} satisfies SeethingSwarmLicensedRuntimeClipCatalog<string>
const battle = {
  pair,
  scheduler: createSchedulerRestorePoint({
    activeDeck: createActiveDeck([]),
    progressGeneration: 0,
    deckRevision: 0,
    seed: "playback-test",
    cycleIndex: 0,
    cursor: 0,
  }),
}
const choreography = createSeethingSwarmBattleChoreography({ battle, catalog })
if (choreography.mode !== "licensed")
  throw new Error("Expected licensed test choreography")
const combatant = choreography.combatants[0]

describe("SeethingSwarm battle playback", () => {
  it("uses one complete retained locomotion cycle each way at the battle rate", () => {
    const outward = createSeethingSwarmBattlePlayback({
      combatant,
      winnerId: pair[0],
      cue: "approach",
    })[0]
    const returning = createSeethingSwarmBattlePlayback({
      combatant,
      winnerId: pair[0],
      cue: "recovery",
    })[0]
    expect(outward.clip).toBe(returning.clip)
    expect(outward).toMatchObject({
      startFrame: 0,
      endFrame: 4,
      frameDurationMs: 100,
      facesAway: false,
    })
    expect(returning).toMatchObject({
      startFrame: 0,
      endFrame: 4,
      frameDurationMs: 100,
      facesAway: true,
    })
    expect(resolveSeethingSwarmTravelDuration(choreography, pair[0])).toBe(400)
  })

  it("splits the inspected attack at contact without skipping or replaying a frame", () => {
    const attack = { ...combatant.clips.attack.clip, frameCount: 7 }
    const inspected = {
      ...combatant,
      clips: {
        ...combatant.clips,
        attack: { ...combatant.clips.attack, clip: attack, sequence: [attack] },
      },
    }
    const strike = createSeethingSwarmBattlePlayback({
      combatant: inspected,
      winnerId: pair[0],
      cue: "strike",
    })
    const impact = createSeethingSwarmBattlePlayback({
      combatant: inspected,
      winnerId: pair[0],
      cue: "impact",
    })
    expect(strike[0]).toMatchObject({
      startFrame: 0,
      endFrame: 3,
      blocksResult: true,
    })
    expect(impact[0]).toMatchObject({
      startFrame: 3,
      endFrame: 7,
      blocksResult: true,
    })
    expect(
      [...strike, ...impact].flatMap((step) =>
        Array.from(
          { length: step.endFrame - step.startFrame },
          (_, index) => step.startFrame + index,
        ),
      ),
    ).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(
      createSeethingSwarmBattlePlayback({
        combatant: inspected,
        winnerId: pair[0],
        cue: "settled",
      }).every((step) => !step.blocksResult),
    ).toBe(true)
  })
  it("shares attention steps without requiring a battle result", () => {
    expect(createSeethingSwarmAttentionPlayback(combatant.clips)).toEqual(
      createSeethingSwarmBattlePlayback({
        combatant,
        winnerId: null,
        cue: "attention",
      }),
    )
  })
  it("coalesces an identical attention and expression clip without blocking a choice", () => {
    const steps = createSeethingSwarmBattlePlayback({
      combatant,
      winnerId: null,
      cue: "attention",
    })
    expect(steps.map(({ role, playbackMode }) => [role, playbackMode])).toEqual(
      [
        ["anticipation", "one-shot"],
        ["rest", "loop"],
      ],
    )
    expect(steps[0].clip).toBe(combatant.clips.anticipation.clip)
    expect(steps.every((step) => !step.blocksResult)).toBe(true)
    expect(steps.map((step) => step.frameDurationMs)).toEqual([100, 160])
  })
  it("plays every introductory role before resting without mutating its source", () => {
    const steps = createSeethingSwarmBattlePlayback({
      combatant,
      winnerId: null,
      cue: "introduction",
    })
    expect(steps.map(({ role, playbackMode }) => [role, playbackMode])).toEqual(
      [
        ["entry", "one-shot"],
        ["anticipation", "one-shot"],
        ["rest", "loop"],
      ],
    )
    expect(steps[0].clip).toBe(combatant.clips.entry.clip)
    expect(Object.isFrozen(steps)).toBe(true)
    expect(steps.every(Object.isFrozen)).toBe(true)
    expect(steps.map((step) => step.frameDurationMs)).toEqual([160, 100, 160])
  })

  it.each([
    { cue: "approach", winnerId: pair[0], expected: ["attack"] },
    { cue: "approach", winnerId: pair[1], expected: ["rest"] },
    { cue: "strike", winnerId: pair[0], expected: ["attack"] },
    { cue: "strike", winnerId: pair[1], expected: ["rest"] },
    { cue: "impact", winnerId: pair[0], expected: ["rest"] },
    { cue: "impact", winnerId: pair[1], expected: ["reaction"] },
  ] as const)(
    "plays $expected for $cue without reacting before the strike",
    ({ cue, winnerId, expected }) => {
      const steps = createSeethingSwarmBattlePlayback({
        combatant,
        winnerId,
        cue,
      })
      expect(steps.map(({ role }) => role)).toEqual(expected)
      expect(steps.map(({ playbackMode }) => playbackMode)).toEqual([
        expected[0] === "rest" ? "loop" : "one-shot",
      ])
    },
  )

  it("preserves readable battle frames without charging optional expression to the result", () => {
    const winnerSteps = (["strike", "impact"] as const).flatMap((cue) =>
      createSeethingSwarmBattlePlayback({ combatant, winnerId: pair[0], cue }),
    )
    const loserSteps = createSeethingSwarmBattlePlayback({
      combatant,
      winnerId: pair[1],
      cue: "impact",
    })
    for (const steps of [winnerSteps, loserSteps]) {
      const required = steps.filter((step) => step.blocksResult)
      expect(required).toHaveLength(1)
      expect(required[0].frameDurationMs).toBe(100)
      expect(required[0].clip.frameCount * required[0].frameDurationMs).toBe(
        400,
      )
    }
    expect(winnerSteps.at(-1)).toMatchObject({
      role: "rest",
      blocksResult: false,
      frameDurationMs: 160,
    })
  })

  it("plays complete aerial preparation before contact and requires landing after impact", () => {
    const source = combatant.clips.attack.clip
    const takeoff = { ...source, animationId: "takeoff", frameCount: 8 }
    const attack = { ...source, animationId: "attack_air", frameCount: 12 }
    const land = { ...source, animationId: "land", frameCount: 6 }
    const airborne = {
      ...combatant,
      clips: {
        ...combatant.clips,
        attack: {
          ...combatant.clips.attack,
          clip: attack,
          sequence: [takeoff, attack, land],
        },
      },
    }
    const strike = createSeethingSwarmBattlePlayback({
      combatant: airborne,
      winnerId: pair[0],
      cue: "strike",
    })
    const impact = createSeethingSwarmBattlePlayback({
      combatant: airborne,
      winnerId: pair[0],
      cue: "impact",
    })
    expect(strike.map((step) => step.clip.animationId)).toEqual([
      "takeoff",
      "attack_air",
    ])
    expect(impact.map((step) => step.clip.animationId)).toEqual(["land"])
    expect(
      [...strike, impact[0]].every(
        (step) => step.blocksResult && step.frameDurationMs === 100,
      ),
    ).toBe(true)
    expect(
      [...strike, ...impact].map(
        (step) => step.clip.frameCount * step.frameDurationMs,
      ),
    ).toEqual([800, 1200, 600])
    const resources = getSeethingSwarmBattleClips(airborne)
    expect(resources.map((clip) => clip.animationId)).toEqual(
      expect.arrayContaining(["takeoff", "attack_air", "land"]),
    )
    expect(new Set(resources.map((clip) => clip.animationId)).size).toBe(
      resources.length,
    )
    expect(Object.isFrozen(resources)).toBe(true)
  })

  it("keeps a single 3x geometry across the complete combatant repertoire", () => {
    const animal = animals[0]
    const geometry = createSeethingSwarmAnimalPresentationGeometry(
      animal.referencePose,
      animal.characterClips,
    )
    expect(geometry).toMatchObject({
      integerScale: 3,
      width: 96,
      height: 96,
      frameOffsetX: -0,
      frameOffsetY: -0,
    })
    expect(
      createSeethingSwarmAnimalPresentationGeometry(
        animal.referencePose,
        [...animal.characterClips].reverse(),
      ),
    ).toEqual(geometry)
  })
})
