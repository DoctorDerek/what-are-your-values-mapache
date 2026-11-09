import { createActiveDeck } from "@game/data/src/ActiveDeck"
import type { SeethingSwarmLicensedRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createCanonicalValueId } from "@game/data/src/Value"
import { describe, expect, it } from "vitest"
import { createSchedulerRestorePoint } from "./PairScheduler"
import {
  createSeethingSwarmAttentionAlternatives,
  createSeethingSwarmBattleChoreography,
} from "./SeethingSwarmBattleChoreography"
import { createSeethingSwarmBattlePlayback } from "./SeethingSwarmBattlePlayback"
import { INITIAL_SEETHING_SWARM_ROLE_ORDINALS } from "./SeethingSwarmBattleVariation"

const bearValue = createCanonicalValueId("pvcs-2011:caring")
const definitions = [
  [
    "bearpack",
    [
      "idle",
      "idle_blink",
      "roar",
      "run",
      "bite",
      "hurt",
      "stand_idle",
      "stand_idle_blink",
      "stand_roar",
      "stand_go_up",
      "stand_go_down",
      "stand_attack01",
      "stand_attack02",
      "jump",
      "fall",
      "land",
    ],
  ],
  [
    "wolfpack",
    ["idle", "run", "howl", "crouch", "attack", "hurt", "jump", "fall", "land"],
  ],
  [
    "mousepack/mouse01_dark_gray",
    ["idle", "run", "crouch", "attack", "hurt", "jump", "fall", "land"],
  ],
  [
    "turtle",
    [
      "idle",
      "walk",
      "bite",
      "attack",
      "hurt",
      "hide",
      "unhide",
      "jump",
      "fall",
      "land",
    ],
  ],
] as const
const animals = definitions.map(([animalId, animations]) => ({
  animalId,
  referencePose: {
    animationId: "idle",
    frameIndex: 0,
    bounds: { left: 9, top: 19, width: 48, height: 34 },
    anchor: { x: 33, y: 53 },
  },
  auxiliaryEffectClips: [],
  characterClips: animations.map((animationId) => ({
    kind: "character" as const,
    animalId,
    animationId,
    relativePath: `${animalId}/${animationId}.png`,
    asset: `${animalId}/${animationId}.png`,
    frameWidth: 64,
    frameHeight: 64,
    frameCount: animationId === "bite" ? 8 : 7,
    visibleBounds: {
      left: 0,
      top: animationId.startsWith("stand_") ? 3 : 19,
      width: 60,
      height: animationId.startsWith("stand_") ? 50 : 34,
    },
  })),
}))
const catalog = {
  mode: "licensed",
  evidenceSnapshotId: "bear-behavior-fixture",
  animals,
  characterClipCount: animals.reduce(
    (count, animal) => count + animal.characterClips.length,
    0,
  ),
  auxiliaryEffectClipCount: 0,
} satisfies SeethingSwarmLicensedRuntimeClipCatalog<string>

function matchup(opponent: string, ordinal: number, source = catalog) {
  const result = createSeethingSwarmBattleChoreography({
    battle: {
      pair: [bearValue, createCanonicalValueId(`pvcs-2011:${opponent}`)],
      scheduler: createSchedulerRestorePoint({
        activeDeck: createActiveDeck([]),
        progressGeneration: 0,
        deckRevision: 0,
        seed: "bear-integration",
        cycleIndex: 0,
        cursor: 0,
      }),
    },
    catalog: source,
    ordinals: new Map([
      [
        "bearpack",
        { ...INITIAL_SEETHING_SWARM_ROLE_ORDINALS, attack: ordinal },
      ],
      [
        "turtle",
        { ...INITIAL_SEETHING_SWARM_ROLE_ORDINALS, reaction: ordinal },
      ],
    ]),
  })
  if (result.mode !== "licensed") throw new Error("Expected licensed fixture")
  return result.combatants
}

describe("Bear battle integration", () => {
  it.each(["bite", "stand_attack01", "stand_attack02"])(
    "coordinates %s through contact and grounded recovery",
    (attack) => {
      const ordinal = ["bite", "stand_attack01", "stand_attack02"].indexOf(
        attack,
      )
      const [bear, wolf] = matchup("justice", ordinal)
      const playback = (cue: "approach" | "strike" | "impact" | "recovery") =>
        createSeethingSwarmBattlePlayback({
          combatant: bear,
          winnerId: bearValue,
          cue,
        })
      expect(playback("approach").map((step) => step.clip.animationId)).toEqual(
        ["run"],
      )
      const strike = playback("strike")
      expect(strike.map((step) => step.clip.animationId)).toEqual(
        ordinal ? ["stand_go_up", attack] : [attack],
      )
      expect(strike.at(-1)?.endFrame).toBe(4)
      const impact = playback("impact")
      expect(impact.map((step) => step.clip.animationId)).toEqual(
        ordinal ? [attack, "stand_go_down"] : [attack],
      )
      expect(impact[0]?.startFrame).toBe(4)
      expect(impact.every((step) => step.blocksResult)).toBe(true)
      expect(playback("recovery")).toMatchObject([
        { clip: { animationId: "run" }, facesAway: true },
      ])
      expect(
        createSeethingSwarmBattlePlayback({
          combatant: wolf,
          winnerId: bearValue,
          cue: "impact",
        })[0]?.clip.animationId,
      ).toBe("hurt")
    },
  )

  it("uses a reachable bite for short targets without changing Bear clearance", () => {
    for (let ordinal = 0; ordinal < 6; ordinal++) {
      const [bear] = matchup("accuracy", ordinal)
      expect(bear.clips.attack.clip.animationId).toBe("bite")
      expect(bear.geometry).toEqual(matchup("justice", ordinal)[0].geometry)
    }
  })

  it("completes upright attention before returning to the selected calm pose", () => {
    const bear = catalog.animals[0]!
    const calm = bear.characterClips.find(
      (clip) => clip.animationId === "idle_blink",
    )!
    const alternatives = createSeethingSwarmAttentionAlternatives(calm, catalog)
    expect(
      alternatives.map((item) => item.sequence.map((clip) => clip.animationId)),
    ).toEqual([
      ["stand_go_up", "stand_idle_blink", "stand_go_down", "idle_blink"],
      ["roar"],
      ["stand_go_up", "stand_idle", "stand_go_down", "idle_blink"],
      ["stand_go_up", "stand_roar", "stand_go_down", "idle_blink"],
    ])
  })

  it("varies Turtle hurt and complete hide/unhide reactions without a terminal clip", () => {
    const turtleValue = "tradition"
    expect(
      matchup(turtleValue, 0)[1].clips.reaction.sequence.map(
        (clip) => clip.animationId,
      ),
    ).toEqual(["hurt"])
    expect(
      matchup(turtleValue, 1)[1].clips.reaction.sequence.map(
        (clip) => clip.animationId,
      ),
    ).toEqual(["hide", "unhide", "idle"])
    const incomplete = {
      ...catalog,
      animals: catalog.animals.map((animal) => ({
        ...animal,
        characterClips: animal.characterClips.filter(
          (clip) => clip.animationId !== "unhide",
        ),
      })),
    }
    expect(
      matchup(turtleValue, 1, incomplete)[1].clips.reaction.clip.animationId,
    ).toBe("hurt")
  })
})
