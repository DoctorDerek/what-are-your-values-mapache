import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { SEETHING_SWARM_BATTLE_ANIMATION_POLICIES } from "@game/data/src/SeethingSwarmBattleAnimationPolicy"
import { resolveSeethingSwarmFamilyPerformanceProfile } from "@game/data/src/SeethingSwarmFamilyPerformanceProfiles"
import {
  createSeethingSwarmTypographyOnlyRuntimeClipCatalog,
  type SeethingSwarmLicensedRuntimeClipCatalog,
  type SeethingSwarmRuntimeAnimalClips,
  type SeethingSwarmRuntimeCharacterClip,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  createCanonicalValueId,
  createCustomValueId,
  type CustomValueDefinition,
  type ValuePair,
} from "@game/data/src/Value"
import { VALUE_TO_ANIMAL_MAP } from "@game/data/src/ValueToAnimalMap"
import { ZOO_ANIMALS, type ZooAnimalId } from "@game/data/src/ZooAnimals"
import { describe, expect, it } from "vitest"
import { INITIAL_SEETHING_SWARM_ROLE_ORDINALS } from "./SeethingSwarmBattleVariation"
import type { PresentedBattle } from "./CombatMachine"
import { createSchedulerRestorePoint } from "./PairScheduler"
import {
  createSeethingSwarmAttentionAlternatives,
  createSeethingSwarmBattleChoreography,
  createSeethingSwarmSurfaceGeometry,
  resolveSeethingSwarmBattleResult,
  SEETHING_SWARM_BATTLE_CHOREOGRAPHY_VERSION,
  SEETHING_SWARM_BATTLE_CLIP_ROLE_POLICIES,
  SEETHING_SWARM_BATTLE_COMBATANT_SIDES,
} from "./SeethingSwarmBattleChoreography"

const RACCOON_VALUE_ID = createCanonicalValueId("pvcs-2011:mastery")

it("rotates complete authored alternatives without scheduler or catalog-order randomness", () => {
  const catalog = createTestLicensedCatalog([
    ["raccoonpack", ["idle_blink", "dash", "idle", "run", "crouch", "attack", "hurt", "bark"]],
    ["wolfpack", COMPLETE_ROLE_ANIMATION_IDS],
  ])
  const select = (rest: number, entry: number, cycleIndex = 0) => {
    const result = createSeethingSwarmBattleChoreography({
      battle: createTestBattle({ pair: [RACCOON_VALUE_ID, WOLF_VALUE_ID], cycleIndex }),
      catalog: reverseTestCatalogClips(catalog),
      ordinals: new Map([["raccoonpack", { ...INITIAL_SEETHING_SWARM_ROLE_ORDINALS, rest, entry }]]),
    })
    if (result.mode !== "licensed") throw new Error("Expected licensed catalog")
    return result.combatants[0].clips
  }
  expect(select(0, 0).rest.clip.animationId).toBe("idle")
  expect(select(1, 0).rest.clip.animationId).toBe("idle_blink")
  expect(select(2, 0).rest.clip.animationId).toBe("idle")
  expect(select(0, 0).entry.clip.animationId).toBe("run")
  expect(select(0, 1).entry.clip.animationId).toBe("dash")
  expect(select(0, 2).entry.clip.animationId).toBe("run")
  expect(select(1, 1, 100)).toEqual(select(1, 1))
})

it("applies each variant's approved role pools rather than unrelated catalog clips", () => {
  const allAnimationIds = SEETHING_SWARM_BATTLE_ANIMATION_POLICIES.map(
    ({ animationId }) => animationId,
  )
  const catalog = createTestLicensedCatalog(
    ZOO_ANIMALS.map(({ id }) => [id, allAnimationIds] as const),
  )
  for (const { id: animalId } of ZOO_ANIMALS) {
    const mapping = VALUE_TO_ANIMAL_MAP.find(
      (mapping) => mapping.animalId === animalId,
    )!
    const profile = resolveSeethingSwarmFamilyPerformanceProfile(animalId)
    for (let cycleIndex = 0; cycleIndex < 8; cycleIndex += 1) {
      const result = createSeethingSwarmBattleChoreography({
        catalog,
        ordinals: new Map([[animalId, { entry: cycleIndex, rest: cycleIndex, attack: cycleIndex, reaction: cycleIndex, flourish: cycleIndex }]]),
        battle: createTestBattle({
          pair: [
            mapping.valueId,
            animalId === "raccoonpack" ? WOLF_VALUE_ID : RACCOON_VALUE_ID,
          ],
          cycleIndex,
        }),
      })
      if (result.mode !== "licensed")
        throw new Error("Expected licensed test catalog")
      const { clips } = result.combatants[0]
      expect(profile.calm).toContain(clips.rest.clip.animationId)
      expect(profile.attention).toContain(clips.anticipation.clip.animationId)
      expect(profile.attack).toContain(clips.attack.clip.animationId)
      expect(clips.attack.clip.animationId).not.toBe("attack_air")
      expect(clips.reaction.clip.animationId).toBe("hurt")
      expect(profile.celebration).toContain(clips.flourish.clip.animationId)
      for (const selection of Object.values(clips)) {
        if (selection.sequence.length > 1)
          expect(selection.sequence.at(-1)).toBe(clips.rest.clip)
      }
    }
  }
})

it("keeps ordinary hurt independently available when a bat lacks required attack recovery", () => {
  const result = createSeethingSwarmBattleChoreography({
    catalog: createTestLicensedCatalog([
      ["bat", ["idle_upright", "attack", "fly_forward", "hurt", "fright"]],
    ]),
    battle: createTestBattle({
      pair: [FIRST_BAT_VALUE_ID, SECOND_BAT_VALUE_ID],
    }),
  })
  if (result.mode !== "licensed")
    throw new Error("Expected licensed test catalog")
  for (const { clips } of result.combatants) {
    expect(clips.attack.semanticFamily).toBe("rest")
    expect(clips.attack.sequence).toEqual([clips.rest.clip])
    expect(clips.reaction.clip.animationId).toBe("hurt")
  }
})

it("reserves unselected eligible motion while excluding terminal and environment-only poses", () => {
  const animal = createTestAnimalClips("raccoonpack", [
    "idle",
    "crouch",
    "attack",
    "die",
    "wallgrab",
  ])
  const expanded = {
    ...animal,
    characterClips: animal.characterClips.map((clip) => ({
      ...clip,
      visibleBounds:
        clip.animationId === "attack"
          ? { left: 0, top: 0, width: 30, height: 30 }
          : clip.animationId === "die" || clip.animationId === "wallgrab"
            ? { left: 0, top: 0, width: 32, height: 32 }
            : clip.visibleBounds,
    })),
  }
  expect(createSeethingSwarmSurfaceGeometry(expanded, "battle")).toMatchObject({
    integerScale: 3,
    width: 90,
    height: 90,
  })
  expect(
    createSeethingSwarmSurfaceGeometry(expanded, "portrait"),
  ).toMatchObject({ integerScale: 3, width: 72, height: 75 })
  expect(
    createSeethingSwarmSurfaceGeometry(
      { ...expanded, characterClips: expanded.characterClips.toReversed() },
      "battle",
    ),
  ).toEqual(createSeethingSwarmSurfaceGeometry(expanded, "battle"))
})

it("falls back to calm when the family has no available attention source", () => {
  const catalog = createTestLicensedCatalog([["raccoonpack", ["idle"]]])
  const calm = catalog.animals[0].characterClips[0]
  expect(createSeethingSwarmAttentionAlternatives(calm, catalog)).toEqual([
    {
      role: "anticipation",
      semanticFamily: "rest",
      clip: calm,
      sequence: [calm],
    },
  ])
  expect(() =>
    createSeethingSwarmAttentionAlternatives(
      calm,
      createSeethingSwarmTypographyOnlyRuntimeClipCatalog(),
    ),
  ).toThrow("requires licensed clips")
})

it("selects stable Hub attention without a scheduler or catalog-order dependence", () => {
  const catalog = createTestLicensedCatalog([
    ["raccoonpack", COMPLETE_ROLE_ANIMATION_IDS],
  ])
  const calm = catalog.animals[0].characterClips.find(
    (clip) => clip.animationId === "idle",
  )!
  const selections = createSeethingSwarmAttentionAlternatives(calm, catalog)
  expect(selections).toEqual(
    createSeethingSwarmAttentionAlternatives(
      calm,
      reverseTestCatalogClips(catalog),
    ),
  )
  expect(selections.map(({ clip }) => clip.animationId)).toEqual([
    "bark",
    "crouch",
  ])
  expect(
    selections.every(({ semanticFamily }) => semanticFamily === "anticipation"),
  ).toBe(true)
})
const WOLF_VALUE_ID = createCanonicalValueId("pvcs-2011:courage")
const FIRST_BAT_VALUE_ID = createCanonicalValueId("pvcs-2011:non-conformity")
const SECOND_BAT_VALUE_ID = createCanonicalValueId("pvcs-2011:solitude")
const UNPRESENTED_VALUE_ID = createCanonicalValueId("pvcs-2011:accuracy")
const CUSTOM_VALUE_ID = createCustomValueId(
  "custom:00000000-0000-4000-8000-000000000001",
)

const CUSTOM_VALUE = Object.freeze({
  kind: "custom",
  id: CUSTOM_VALUE_ID,
  name: "Private ingenuity",
  definition: "to solve unfamiliar problems inventively",
  creationOrdinal: 1,
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-03T00:00:00.000Z",
}) satisfies CustomValueDefinition

const COMPLETE_ROLE_ANIMATION_IDS = Object.freeze([
  "sleep",
  "bark",
  "howl",
  "croak",
  "hop",
  "attackforward",
  "hurt",
  "attack",
  "idle",
  "run",
  "crouch",
  "wallgrab",
  "die",
])

function createTestCharacterClip(animalId: ZooAnimalId, animationId: string) {
  const relativePath = `${animalId}/${animationId}.png`
  return Object.freeze({
    kind: "character",
    animalId,
    animationId,
    relativePath,
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 4,
    visibleBounds: Object.freeze({ left: 2, top: 3, width: 24, height: 25 }),
    asset: `asset:${relativePath}`,
  }) satisfies SeethingSwarmRuntimeCharacterClip<string>
}

function createTestAnimalClips(
  animalId: ZooAnimalId,
  animationIds: readonly string[],
) {
  return Object.freeze({
    animalId,
    characterClips: Object.freeze(
      animationIds.map((animationId) =>
        createTestCharacterClip(animalId, animationId),
      ),
    ),
    auxiliaryEffectClips: Object.freeze([]),
    referencePose: Object.freeze({
      animationId: "idle",
      frameIndex: 0,
      bounds: Object.freeze({ left: 2, top: 3, width: 24, height: 25 }),
      anchor: Object.freeze({ x: 14, y: 28 }),
    }),
  }) satisfies SeethingSwarmRuntimeAnimalClips<string>
}

function createTestLicensedCatalog(
  entries: readonly (readonly [ZooAnimalId, readonly string[]])[],
) {
  const animals = Object.freeze(
    entries.map(([animalId, animationIds]) =>
      createTestAnimalClips(animalId, animationIds),
    ),
  )
  return Object.freeze({
    mode: "licensed",
    evidenceSnapshotId: "seethingswarm-choreography-test",
    animals,
    characterClipCount: animals.reduce(
      (count, animal) => count + animal.characterClips.length,
      0,
    ),
    auxiliaryEffectClipCount: 0,
  }) satisfies SeethingSwarmLicensedRuntimeClipCatalog<string>
}

function reverseTestCatalogClips(
  catalog: SeethingSwarmLicensedRuntimeClipCatalog<string>,
) {
  return createTestLicensedCatalog(
    catalog.animals.map(({ animalId, characterClips }) =>
      Object.freeze([
        animalId,
        Object.freeze(
          characterClips.map(({ animationId }) => animationId).toReversed(),
        ),
      ] as const),
    ),
  )
}

function createTestBattle({
  pair,
  cycleIndex = 0,
  cursor = 0,
  customValues = [],
}: {
  readonly pair: ValuePair
  readonly cycleIndex?: number
  readonly cursor?: number
  readonly customValues?: readonly CustomValueDefinition[]
}) {
  const activeDeck = createActiveDeck(customValues)
  return Object.freeze({
    pair,
    scheduler: createSchedulerRestorePoint({
      activeDeck,
      progressGeneration: 0,
      deckRevision: 0,
      seed: "seethingswarm-choreography-test",
      cycleIndex,
      cursor,
    }),
  }) satisfies PresentedBattle
}

function getSelectedAnimationIds(
  catalog: SeethingSwarmLicensedRuntimeClipCatalog<string>,
  battle: PresentedBattle,
) {
  const choreography = createSeethingSwarmBattleChoreography({
    battle,
    catalog,
  })
  if (choreography.mode !== "licensed") {
    throw new Error("Expected licensed SeethingSwarm choreography")
  }

  return choreography.combatants.map(({ clips }) =>
    Object.fromEntries(
      Object.entries(clips).map(([role, selection]) => [
        role,
        selection.clip.animationId,
      ]),
    ),
  )
}

function getBattleEligibleAnimationIds() {
  return SEETHING_SWARM_BATTLE_ANIMATION_POLICIES.filter(
    (policy) => policy.usageKind === "battle-eligible",
  ).map(({ animationId }) => animationId)
}

describe("SeethingSwarm battle choreography", () => {
  it("freezes the complete semantic role and side contract", () => {
    expect(SEETHING_SWARM_BATTLE_CHOREOGRAPHY_VERSION).toBe(2)
    expect(SEETHING_SWARM_BATTLE_COMBATANT_SIDES).toEqual(["first", "second"])
    expect(
      SEETHING_SWARM_BATTLE_CLIP_ROLE_POLICIES.map(
        ({ role, semanticFamilyPriorities }) => [
          role,
          semanticFamilyPriorities,
        ],
      ),
    ).toEqual([
      ["entry", ["entry-exit", "rest"]],
      ["rest", ["rest"]],
      ["anticipation", ["anticipation", "rest"]],
      ["attack", ["attack", "rest"]],
      ["reaction", ["reaction", "rest"]],
      ["flourish", ["celebration", "rest"]],
    ])
    expect(Object.isFrozen(SEETHING_SWARM_BATTLE_COMBATANT_SIDES)).toBe(true)
    expect(Object.isFrozen(SEETHING_SWARM_BATTLE_CLIP_ROLE_POLICIES)).toBe(true)
    expect(
      SEETHING_SWARM_BATTLE_CLIP_ROLE_POLICIES.every(
        (policy) =>
          Object.isFrozen(policy) &&
          Object.isFrozen(policy.semanticFamilyPriorities),
      ),
    ).toBe(true)
  })

  it("projects stable canonical and Custom Value combatants by semantic role", () => {
    const battle = createTestBattle({
      pair: Object.freeze([RACCOON_VALUE_ID, CUSTOM_VALUE_ID]),
      customValues: [CUSTOM_VALUE],
    })
    const catalog = createTestLicensedCatalog([
      ["raccoonpack", COMPLETE_ROLE_ANIMATION_IDS],
      ["frogpack", COMPLETE_ROLE_ANIMATION_IDS],
    ])
    const choreography = createSeethingSwarmBattleChoreography({
      battle,
      catalog,
    })
    const repeatedChoreography = createSeethingSwarmBattleChoreography({
      battle,
      catalog: reverseTestCatalogClips(catalog),
    })

    expect(choreography.mode).toBe("licensed")
    expect(repeatedChoreography).toEqual(choreography)
    if (choreography.mode !== "licensed") {
      throw new Error("Expected licensed SeethingSwarm choreography")
    }

    expect(choreography.combatants).toMatchObject([
      {
        side: "first",
        valueId: RACCOON_VALUE_ID,
        animalId: "raccoonpack",
      },
      {
        side: "second",
        valueId: CUSTOM_VALUE_ID,
        animalId: "frogpack",
      },
    ])
    expect(getSelectedAnimationIds(catalog, battle)).toEqual([
      {
        entry: "run",
        rest: "idle",
        anticipation: expect.stringMatching(/^(bark|crouch)$/),
        attack: "attack",
        reaction: "hurt",
        flourish: "bark",
      },
      {
        entry: "hop",
        rest: "idle",
        anticipation: "croak",
        attack: "attackforward",
        reaction: "hurt",
        flourish: "croak",
      },
    ])
    expect(Object.isFrozen(choreography)).toBe(true)
    expect(Object.isFrozen(choreography.combatants)).toBe(true)
    expect(
      choreography.combatants.every(
        ({ clips }) =>
          Object.isFrozen(clips) &&
          Object.values(clips).every(
            (selection) =>
              Object.isFrozen(selection) &&
              Object.isFrozen(selection.clip) &&
              !["sleep", "wallgrab", "die"].includes(
                selection.clip.animationId,
              ),
          ),
      ),
    ).toBe(true)
  })

  it("keeps Frog attacks aimed at horizontal opponents across battle identities", () => {
    const catalog = createTestLicensedCatalog([
      [
        "frogpack",
        [
          "attackup",
          "attackdiagonal",
          "attackforward",
          "idle",
          "hurt",
          "croak",
          "dash",
        ],
      ],
      ["wolfpack", COMPLETE_ROLE_ANIMATION_IDS],
    ])
    for (
      let cycleIndex = 0;
      cycleIndex < SEETHING_SWARM_BATTLE_ANIMATION_POLICIES.length;
      cycleIndex += 1
    ) {
      const [frog] = getSelectedAnimationIds(
        catalog,
        createTestBattle({
          pair: Object.freeze([
            createCanonicalValueId("pvcs-2011:flexibility"),
            WOLF_VALUE_ID,
          ]),
          cycleIndex,
        }),
      )
      expect(frog.attack).toBe("attackforward")
      expect(Object.values(frog)).not.toContain("attackup")
      expect(Object.values(frog)).not.toContain("attackdiagonal")
    }
  })

  it("preserves two mapped placeholder combatants without licensed art", () => {
    const battle = createTestBattle({
      pair: Object.freeze([RACCOON_VALUE_ID, CUSTOM_VALUE_ID]),
      customValues: [CUSTOM_VALUE],
    })
    const choreography = createSeethingSwarmBattleChoreography({
      battle,
      catalog: createSeethingSwarmTypographyOnlyRuntimeClipCatalog(),
    })
    const result = resolveSeethingSwarmBattleResult(
      choreography,
      CUSTOM_VALUE_ID,
    )

    expect(choreography).toMatchObject({
      mode: "placeholder",
      combatants: [
        {
          side: "first",
          valueId: RACCOON_VALUE_ID,
          animalId: "raccoonpack",
        },
        {
          side: "second",
          valueId: CUSTOM_VALUE_ID,
          animalId: "frogpack",
        },
      ],
    })
    expect(result).toEqual({
      mode: "placeholder",
      winner: choreography.combatants[1],
      loser: choreography.combatants[0],
    })
    expect(Object.isFrozen(choreography)).toBe(true)
    expect(Object.isFrozen(choreography.combatants)).toBe(true)
    expect(choreography.combatants.every(Object.isFrozen)).toBe(true)
    expect(Object.isFrozen(result)).toBe(true)
  })

  it("resolves either presented licensed combatant without changing identity", () => {
    const choreography = createSeethingSwarmBattleChoreography({
      battle: createTestBattle({
        pair: Object.freeze([RACCOON_VALUE_ID, WOLF_VALUE_ID]),
      }),
      catalog: createTestLicensedCatalog([
        ["raccoonpack", ["idle"]],
        ["wolfpack", ["idle"]],
      ]),
    })
    if (choreography.mode !== "licensed") {
      throw new Error("Expected licensed SeethingSwarm choreography")
    }

    const firstResult = resolveSeethingSwarmBattleResult(
      choreography,
      RACCOON_VALUE_ID,
    )
    const secondResult = resolveSeethingSwarmBattleResult(
      choreography,
      WOLF_VALUE_ID,
    )

    expect(firstResult).toEqual({
      mode: "licensed",
      winner: choreography.combatants[0],
      loser: choreography.combatants[1],
    })
    expect(secondResult).toEqual({
      mode: "licensed",
      winner: choreography.combatants[1],
      loser: choreography.combatants[0],
    })
    expect(Object.isFrozen(firstResult)).toBe(true)
    expect(Object.isFrozen(secondResult)).toBe(true)
    expect(() =>
      resolveSeethingSwarmBattleResult(choreography, UNPRESENTED_VALUE_ID),
    ).toThrow("Battle winner is not a presented combatant: pvcs-2011:accuracy")
  })

  it("falls every missing preferred role back to a verified rest clip", () => {
    const choreography = createSeethingSwarmBattleChoreography({
      battle: createTestBattle({
        pair: Object.freeze([RACCOON_VALUE_ID, WOLF_VALUE_ID]),
      }),
      catalog: createTestLicensedCatalog([
        ["raccoonpack", ["idle"]],
        ["wolfpack", ["idle"]],
      ]),
    })
    if (choreography.mode !== "licensed") {
      throw new Error("Expected licensed SeethingSwarm choreography")
    }

    for (const combatant of choreography.combatants) {
      expect(
        Object.values(combatant.clips).map(({ semanticFamily, clip }) => [
          semanticFamily,
          clip.animationId,
        ]),
      ).toEqual(Array.from({ length: 6 }, () => ["rest", "idle"]))
    }
    expect(
      resolveSeethingSwarmBattleResult(choreography, WOLF_VALUE_ID).winner
        .valueId,
    ).toBe(WOLF_VALUE_ID)
  })

  it("keeps bat selections inside its approved family even with unrelated source clips", () => {
    const battleEligibleAnimationIds = getBattleEligibleAnimationIds()
    const catalog = createTestLicensedCatalog([
      ["bat", battleEligibleAnimationIds],
    ])
    const reachedAnimationIds = new Set<string>()

    for (
      let cycleIndex = 0;
      cycleIndex < battleEligibleAnimationIds.length;
      cycleIndex += 1
    ) {
      const choreography = createSeethingSwarmBattleChoreography({
        ordinals: new Map([["bat", { ...INITIAL_SEETHING_SWARM_ROLE_ORDINALS, rest: cycleIndex }]]),
        battle: createTestBattle({
          pair: Object.freeze([FIRST_BAT_VALUE_ID, SECOND_BAT_VALUE_ID]),
          cycleIndex,
        }),
        catalog,
      })
      if (choreography.mode !== "licensed") {
        throw new Error("Expected licensed SeethingSwarm choreography")
      }

      for (const combatant of choreography.combatants) {
        for (const selection of Object.values(combatant.clips)) {
          reachedAnimationIds.add(selection.clip.animationId)
        }
      }
    }

    expect([...reachedAnimationIds].toSorted()).toEqual(
      [
        "attack",
        "crouch",
        "fly_forward",
        "fly_idle",
        "hurt",
        "idle_upright",
        "idle_upright_blink",
      ].toSorted(),
    )
  })

  it("projects at least one complete battle for every mapped animal", () => {
    const catalog = createTestLicensedCatalog(
      ZOO_ANIMALS.map(({ id }) =>
        Object.freeze([id, [id === "bat" ? "idle_upright" : "idle"]] as const),
      ),
    )
    const projectedAnimalIds = new Set<ZooAnimalId>()

    for (const { id: animalId } of ZOO_ANIMALS) {
      const mapping = VALUE_TO_ANIMAL_MAP.find(
        (candidate) => candidate.animalId === animalId,
      )!
      const opponent = VALUE_TO_ANIMAL_MAP.find(
        (candidate) => candidate.valueId !== mapping.valueId,
      )!
      const choreography = createSeethingSwarmBattleChoreography({
        battle: createTestBattle({
          pair: Object.freeze([mapping.valueId, opponent.valueId]),
        }),
        catalog,
      })
      if (choreography.mode !== "licensed") {
        throw new Error("Expected licensed SeethingSwarm choreography")
      }

      projectedAnimalIds.add(choreography.combatants[0].animalId)
    }

    expect([...projectedAnimalIds].toSorted()).toEqual(
      ZOO_ANIMALS.map(({ id }) => id).toSorted(),
    )
  })

  it("fails loudly when a mapped animal has no runtime catalog", () => {
    expect(() =>
      createSeethingSwarmBattleChoreography({
        battle: createTestBattle({
          pair: Object.freeze([RACCOON_VALUE_ID, WOLF_VALUE_ID]),
        }),
        catalog: createTestLicensedCatalog([["raccoonpack", ["idle"]]]),
      }),
    ).toThrow("Missing battle animation catalog for animal: wolfpack")
  })

  it("fails loudly when a runtime clip has no source policy", () => {
    expect(() =>
      createSeethingSwarmBattleChoreography({
        battle: createTestBattle({
          pair: Object.freeze([RACCOON_VALUE_ID, WOLF_VALUE_ID]),
        }),
        catalog: createTestLicensedCatalog([
          ["raccoonpack", ["unknown"]],
          ["wolfpack", ["idle"]],
        ]),
      }),
    ).toThrow("Missing SeethingSwarm animation policy: unknown")
  })

  it("fails loudly when an animal has no battle-eligible clip", () => {
    expect(() =>
      createSeethingSwarmBattleChoreography({
        battle: createTestBattle({
          pair: Object.freeze([RACCOON_VALUE_ID, WOLF_VALUE_ID]),
        }),
        catalog: createTestLicensedCatalog([
          ["raccoonpack", ["sleep", "wallgrab", "die"]],
          ["wolfpack", ["idle"]],
        ]),
      }),
    ).toThrow("Missing battle-eligible rest animation for animal: raccoonpack")
  })
})
