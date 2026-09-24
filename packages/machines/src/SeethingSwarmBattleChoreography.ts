import {
  createSeethingSwarmAnimalPresentationGeometry,
  type SeethingSwarmAnimalPresentationGeometry,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import {
  resolveSeethingSwarmBattleAnimationPolicy,
  type SeethingSwarmBattleEligibleAnimationPolicy,
  type SeethingSwarmBattleSemanticFamily,
} from "@game/data/src/SeethingSwarmBattleAnimationPolicy"
import { resolveSeethingSwarmBattleSequence } from "@game/data/src/SeethingSwarmBattleSequencePolicy"
import { resolveSeethingSwarmFamilyPerformanceProfile } from "@game/data/src/SeethingSwarmFamilyPerformanceProfiles"
import type {
  SeethingSwarmLicensedRuntimeClipCatalog,
  SeethingSwarmRuntimeAnimalClips,
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { ValueId } from "@game/data/src/Value"
import type { ZooAnimalId } from "@game/data/src/ZooAnimals"
import type { PresentedBattle } from "./CombatMachine"
import {
  resolveSeethingSwarmBattleCombatant,
  type SeethingSwarmBattleCombatant,
} from "./SeethingSwarmBattleCombatant"
import {
  INITIAL_SEETHING_SWARM_ROLE_ORDINALS,
  type SeethingSwarmAnimalOrdinals,
  type SeethingSwarmRoleOrdinals,
} from "./SeethingSwarmBattleVariation"

export const SEETHING_SWARM_BATTLE_CHOREOGRAPHY_VERSION = 2

export const SEETHING_SWARM_BATTLE_COMBATANT_SIDES = Object.freeze([
  "first",
  "second",
] as const)

export type SeethingSwarmBattleCombatantSide =
  (typeof SEETHING_SWARM_BATTLE_COMBATANT_SIDES)[number]

function defineBattleClipRolePolicy<const Role extends string>(
  role: Role,
  ...semanticFamilyPriorities: readonly SeethingSwarmBattleSemanticFamily[]
) {
  return Object.freeze({
    role,
    semanticFamilyPriorities: Object.freeze(semanticFamilyPriorities),
  })
}

export const SEETHING_SWARM_BATTLE_CLIP_ROLE_POLICIES = Object.freeze([
  defineBattleClipRolePolicy("entry", "entry-exit", "rest"),
  defineBattleClipRolePolicy("rest", "rest"),
  defineBattleClipRolePolicy("anticipation", "anticipation", "rest"),
  defineBattleClipRolePolicy("attack", "attack", "rest"),
  defineBattleClipRolePolicy("reaction", "reaction", "rest"),
  defineBattleClipRolePolicy("flourish", "celebration", "rest"),
])

export type SeethingSwarmBattleClipRole =
  (typeof SEETHING_SWARM_BATTLE_CLIP_ROLE_POLICIES)[number]["role"]

export type SeethingSwarmBattleClipSelection<PlatformAsset> = Readonly<{
  role: SeethingSwarmBattleClipRole
  semanticFamily: SeethingSwarmBattleSemanticFamily
  clip: SeethingSwarmRuntimeCharacterClip<PlatformAsset>
  sequence: readonly SeethingSwarmRuntimeCharacterClip<PlatformAsset>[]
}>

export type SeethingSwarmBattleClipSelections<PlatformAsset> = Readonly<{
  entry: SeethingSwarmBattleClipSelection<PlatformAsset>
  rest: SeethingSwarmBattleClipSelection<PlatformAsset>
  anticipation: SeethingSwarmBattleClipSelection<PlatformAsset>
  attack: SeethingSwarmBattleClipSelection<PlatformAsset>
  reaction: SeethingSwarmBattleClipSelection<PlatformAsset>
  flourish: SeethingSwarmBattleClipSelection<PlatformAsset>
}>

export type SeethingSwarmLicensedBattleCombatant<PlatformAsset> =
  SeethingSwarmBattleCombatant &
    Readonly<{
      side: SeethingSwarmBattleCombatantSide
      clips: SeethingSwarmBattleClipSelections<PlatformAsset>
      attentionAlternatives: readonly SeethingSwarmBattleClipSelection<PlatformAsset>[]
      geometry: SeethingSwarmAnimalPresentationGeometry
    }>

export type SeethingSwarmPlaceholderBattleCombatant =
  SeethingSwarmBattleCombatant &
    Readonly<{
      side: SeethingSwarmBattleCombatantSide
    }>

export type SeethingSwarmLicensedBattleChoreography<PlatformAsset> = Readonly<{
  mode: "licensed"
  choreographyIdentity: string
  combatants: readonly [
    SeethingSwarmLicensedBattleCombatant<PlatformAsset>,
    SeethingSwarmLicensedBattleCombatant<PlatformAsset>,
  ]
}>

export type SeethingSwarmPlaceholderBattleChoreography = Readonly<{
  mode: "placeholder"
  choreographyIdentity: string
  combatants: readonly [
    SeethingSwarmPlaceholderBattleCombatant,
    SeethingSwarmPlaceholderBattleCombatant,
  ]
}>

export type SeethingSwarmBattleChoreography<PlatformAsset> =
  | SeethingSwarmLicensedBattleChoreography<PlatformAsset>
  | SeethingSwarmPlaceholderBattleChoreography

type ClassifiedBattleEligibleClip<PlatformAsset> = Readonly<{
  clip: SeethingSwarmRuntimeCharacterClip<PlatformAsset>
  policy: SeethingSwarmBattleEligibleAnimationPolicy
}>

export function createSeethingSwarmChoreographyIdentity(
  battle: PresentedBattle,
) {
  const { scheduler } = battle
  return JSON.stringify([
    "seethingswarm-battle-choreography",
    SEETHING_SWARM_BATTLE_CHOREOGRAPHY_VERSION,
    scheduler.algorithmVersion,
    scheduler.activeDeckFingerprint,
    scheduler.progressGeneration,
    scheduler.deckRevision,
    scheduler.scheduleKind,
    scheduler.seed,
    scheduler.cycleIndex,
    scheduler.cursor,
    battle.pair,
  ])
}

function resolveRuntimeAnimalClips<PlatformAsset>(
  catalog: SeethingSwarmLicensedRuntimeClipCatalog<PlatformAsset>,
  animalId: ZooAnimalId,
) {
  const animal = catalog.animals.find(
    (candidate) => candidate.animalId === animalId,
  )
  if (!animal) {
    throw new Error(`Missing battle animation catalog for animal: ${animalId}`)
  }
  return animal
}

function classifyBattleEligibleClips<PlatformAsset>(
  animal: SeethingSwarmRuntimeAnimalClips<PlatformAsset>,
) {
  const profile = resolveSeethingSwarmFamilyPerformanceProfile(animal.animalId)
  const familyPools = [
    ["rest", profile.calm],
    ["anticipation", profile.attention],
    ["entry-exit", profile.locomotion],
    [
      "attack",
      profile.attack.filter((animationId) => animationId !== "attack_air"),
    ],
    ["celebration", profile.celebration],
    ["reaction", ["hurt"]],
  ] as const
  const battleEligibleClips: ClassifiedBattleEligibleClip<PlatformAsset>[] = []
  for (const clip of animal.characterClips)
    resolveSeethingSwarmBattleAnimationPolicy(clip.animationId)
  for (const [family, animationIds] of familyPools) {
    for (const animationId of animationIds) {
      const clip = animal.characterClips.find(
        (candidate) => candidate.animationId === animationId,
      )
      if (!clip) continue
      const policy = Object.freeze({
        animationId: clip.animationId,
        usageKind: "battle-eligible",
        semanticFamilies: Object.freeze([family]),
      }) satisfies SeethingSwarmBattleEligibleAnimationPolicy
      battleEligibleClips.push(Object.freeze({ clip, policy }))
    }
  }

  return Object.freeze(battleEligibleClips)
}

export function createSeethingSwarmSurfaceGeometry<PlatformAsset>(
  animal: SeethingSwarmRuntimeAnimalClips<PlatformAsset>,
  surface: "battle" | "portrait",
): SeethingSwarmAnimalPresentationGeometry {
  const eligible = classifyBattleEligibleClips(animal)
  const rest = eligible.find(({ policy }) =>
    policy.semanticFamilies.includes("rest"),
  )?.clip
  const clips = eligible.flatMap(({ clip, policy }) => {
    if (
      surface === "portrait" &&
      !policy.semanticFamilies.some(
        (family) =>
          family === "rest" ||
          family === "anticipation" ||
          family === "celebration",
      )
    )
      return []
    return (
      resolveSeethingSwarmBattleSequence(clip, animal.characterClips, rest) ??
      []
    )
  })
  return createSeethingSwarmAnimalPresentationGeometry(
    animal.referencePose,
    clips,
  )
}

function resolveRolePolicy(role: SeethingSwarmBattleClipRole) {
  const policy = SEETHING_SWARM_BATTLE_CLIP_ROLE_POLICIES.find(
    (candidate) => candidate.role === role,
  )
  if (!policy) {
    throw new Error(`Missing SeethingSwarm battle clip role: ${role}`)
  }
  return policy
}

function selectBattleClip<PlatformAsset>({
  battleEligibleClips,
  availableClips,
  animalId,
  ordinal,
  role,
  restClip,
}: {
  readonly battleEligibleClips: readonly ClassifiedBattleEligibleClip<PlatformAsset>[]
  readonly availableClips: readonly SeethingSwarmRuntimeCharacterClip<PlatformAsset>[]
  readonly animalId: ZooAnimalId
  readonly ordinal: number
  readonly role: SeethingSwarmBattleClipRole
  readonly restClip?: SeethingSwarmRuntimeCharacterClip<PlatformAsset>
}) {
  const rolePolicy = resolveRolePolicy(role)
  for (const semanticFamily of rolePolicy.semanticFamilyPriorities) {
    const candidates = battleEligibleClips
      .filter(({ policy }) => policy.semanticFamilies.includes(semanticFamily))
      .flatMap(({ clip }) => {
        const sequence = resolveSeethingSwarmBattleSequence(
          clip,
          availableClips,
          restClip,
        )
        return sequence ? [{ clip, sequence }] : []
      })
    if (candidates.length === 0) continue

    const selectedIndex = ordinal % candidates.length

    return Object.freeze({
      role,
      semanticFamily,
      clip: candidates[selectedIndex]!.clip,
      sequence: candidates[selectedIndex]!.sequence,
    }) satisfies SeethingSwarmBattleClipSelection<PlatformAsset>
  }

  throw new Error(
    `Missing battle-eligible ${role} animation for animal: ${animalId}`,
  )
}

function createLicensedBattleCombatant<PlatformAsset>({
  catalog,
  combatant,
  ordinals,
  side,
}: {
  readonly catalog: SeethingSwarmLicensedRuntimeClipCatalog<PlatformAsset>
  readonly combatant: SeethingSwarmBattleCombatant
  readonly ordinals: SeethingSwarmRoleOrdinals
  readonly side: SeethingSwarmBattleCombatantSide
}) {
  const animal = resolveRuntimeAnimalClips(catalog, combatant.animalId)
  const battleEligibleClips = classifyBattleEligibleClips(animal)
  const selectClip = (
    role: SeethingSwarmBattleClipRole,
    restClip?: SeethingSwarmRuntimeCharacterClip<PlatformAsset>,
  ) =>
    selectBattleClip({
      battleEligibleClips,
      availableClips: animal.characterClips,
      animalId: combatant.animalId,
      ordinal: role === "anticipation" ? 0 : ordinals[role],
      role,
      restClip,
    })

  const rest = selectClip("rest")
  const attentionAlternatives = createSeethingSwarmAttentionAlternatives(
    rest.clip,
    catalog,
  )

  return Object.freeze({
    ...combatant,
    side,
    clips: Object.freeze({
      entry: selectClip("entry", rest.clip),
      rest,
      anticipation: attentionAlternatives[0]!,
      attack: selectClip("attack", rest.clip),
      reaction: selectClip("reaction", rest.clip),
      flourish: selectClip("flourish", rest.clip),
    }),
    attentionAlternatives,
    geometry: createSeethingSwarmSurfaceGeometry(animal, "battle"),
  }) satisfies SeethingSwarmLicensedBattleCombatant<PlatformAsset>
}

export function createSeethingSwarmAttentionAlternatives<PlatformAsset>(
  calmClip: SeethingSwarmRuntimeCharacterClip<PlatformAsset>,
  catalog: SeethingSwarmRuntimeClipCatalog<PlatformAsset>,
): readonly SeethingSwarmBattleClipSelection<PlatformAsset>[] {
  if (catalog.mode !== "licensed")
    throw new Error("Hub animal requires licensed clips")
  const animal = resolveRuntimeAnimalClips(catalog, calmClip.animalId)
  const profile = resolveSeethingSwarmFamilyPerformanceProfile(animal.animalId)
  const alternatives = profile.attention.flatMap((animationId) => {
    const clip = animal.characterClips.find(
      (candidate) => candidate.animationId === animationId,
    )
    if (!clip) return []
    const sequence = resolveSeethingSwarmBattleSequence(
      clip,
      animal.characterClips,
      calmClip,
    )
    return sequence
      ? [
          Object.freeze({
            role: "anticipation",
            semanticFamily: "anticipation",
            clip,
            sequence,
          }) satisfies SeethingSwarmBattleClipSelection<PlatformAsset>,
        ]
      : []
  })
  return Object.freeze(
    alternatives.length
      ? alternatives
      : [
          Object.freeze({
            role: "anticipation",
            semanticFamily: "rest",
            clip: calmClip,
            sequence: [calmClip],
          }) satisfies SeethingSwarmBattleClipSelection<PlatformAsset>,
        ],
  )
}

function createPlaceholderBattleCombatant(
  combatant: SeethingSwarmBattleCombatant,
  side: SeethingSwarmBattleCombatantSide,
) {
  return Object.freeze({
    ...combatant,
    side,
  }) satisfies SeethingSwarmPlaceholderBattleCombatant
}

export function createSeethingSwarmBattleChoreography<PlatformAsset>({
  battle,
  catalog,
  ordinals,
}: {
  readonly battle: PresentedBattle
  readonly catalog: SeethingSwarmRuntimeClipCatalog<PlatformAsset>
  readonly ordinals?: SeethingSwarmAnimalOrdinals
}): SeethingSwarmBattleChoreography<PlatformAsset> {
  const firstCombatant = resolveSeethingSwarmBattleCombatant(battle.pair[0])
  const secondCombatant = resolveSeethingSwarmBattleCombatant(battle.pair[1])
  const choreographyIdentity = createSeethingSwarmChoreographyIdentity(battle)

  if (catalog.mode === "typography-only") {
    return Object.freeze({
      mode: "placeholder",
      choreographyIdentity,
      combatants: Object.freeze([
        createPlaceholderBattleCombatant(firstCombatant, "first"),
        createPlaceholderBattleCombatant(secondCombatant, "second"),
      ] as const),
    })
  }

  return Object.freeze({
    mode: "licensed",
    choreographyIdentity,
    combatants: Object.freeze([
      createLicensedBattleCombatant({
        catalog,
        combatant: firstCombatant,
        ordinals:
          ordinals?.get(firstCombatant.animalId) ??
          INITIAL_SEETHING_SWARM_ROLE_ORDINALS,
        side: "first",
      }),
      createLicensedBattleCombatant({
        catalog,
        combatant: secondCombatant,
        ordinals:
          ordinals?.get(secondCombatant.animalId) ??
          INITIAL_SEETHING_SWARM_ROLE_ORDINALS,
        side: "second",
      }),
    ] as const),
  })
}

function resolveWinnerAndLoser<
  Combatant extends Readonly<{ valueId: ValueId }>,
>(
  combatants: readonly [Combatant, Combatant],
  winnerId: ValueId,
): Readonly<{ winner: Combatant; loser: Combatant }> {
  if (combatants[0].valueId === winnerId) {
    return Object.freeze({ winner: combatants[0], loser: combatants[1] })
  }
  if (combatants[1].valueId === winnerId) {
    return Object.freeze({ winner: combatants[1], loser: combatants[0] })
  }
  throw new Error(`Battle winner is not a presented combatant: ${winnerId}`)
}

export function resolveSeethingSwarmBattleResult<PlatformAsset>(
  choreography: SeethingSwarmBattleChoreography<PlatformAsset>,
  winnerId: ValueId,
) {
  if (choreography.mode === "licensed") {
    return Object.freeze({
      mode: "licensed",
      ...resolveWinnerAndLoser(choreography.combatants, winnerId),
    })
  }

  return Object.freeze({
    mode: "placeholder",
    ...resolveWinnerAndLoser(choreography.combatants, winnerId),
  })
}
