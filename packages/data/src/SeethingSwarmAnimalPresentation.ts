import { splitGraphemes } from "unicode-segmenter/grapheme"
import {
  createSeethingSwarmVisibleContentBounds,
  SeethingSwarmReferencePose,
  SeethingSwarmRuntimeAnimalClips,
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
  SeethingSwarmVisibleContentBounds,
} from "./SeethingSwarmRuntimeClipCatalog"
import type { ActiveValueDefinition } from "./Value"
import { VALUE_TO_ANIMAL_MAP } from "./ValueToAnimalMap"
import type { ZooAnimalId } from "./ZooAnimals"

export const SEETHING_SWARM_HUB_ANIMATION_CANDIDATES = Object.freeze([
  "idle",
  "idle_upright",
] as const)
export const SEETHING_SWARM_HUB_TILE_SIZE = 72
export const SEETHING_SWARM_STANDALONE_SCALE = 3
export const SEETHING_SWARM_CALM_FRAME_DURATION_MS = 160
export const SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS = 100
export const SEETHING_SWARM_BATTLE_FRAME_DURATION_MS = 100
export const SEETHING_SWARM_BATTLE_RESULT_DURATION_MS = 480
export const SEETHING_SWARM_BATTLE_TILE_SIZE = 112

export const SEETHING_SWARM_ANIMAL_PLAYBACK_MODES = Object.freeze([
  "loop",
  "one-shot",
  "hold-final-frame",
  "static",
] as const)

export type SeethingSwarmAnimalPlaybackMode =
  (typeof SEETHING_SWARM_ANIMAL_PLAYBACK_MODES)[number]

export const SEETHING_SWARM_ANIMAL_FACING_DIRECTIONS = Object.freeze([
  "left",
  "right",
] as const)

export type SeethingSwarmAnimalFacingDirection =
  (typeof SEETHING_SWARM_ANIMAL_FACING_DIRECTIONS)[number]

export type SeethingSwarmHubAnimationId =
  (typeof SEETHING_SWARM_HUB_ANIMATION_CANDIDATES)[number]

export type SeethingSwarmAnimalPresentationGeometry = Readonly<{
  visibleBounds: SeethingSwarmVisibleContentBounds
  integerScale: number
  frameOffsetX: number
  frameOffsetY: number
  width: number
  height: number
  anchorX: number
  anchorY: number
}>

export type ValueAnimalPresentation<PlatformAsset> =
  | Readonly<{
      kind: "animal"
      clip: SeethingSwarmRuntimeCharacterClip<PlatformAsset>
      animal: SeethingSwarmRuntimeAnimalClips<PlatformAsset>
    }>
  | Readonly<{
      kind: "custom-initial"
      initial: string
    }>
  | Readonly<{
      kind: "typography-only"
    }>

const TYPOGRAPHY_ONLY_VALUE_PRESENTATION = Object.freeze({
  kind: "typography-only",
}) satisfies ValueAnimalPresentation<never>

function assertPositiveSafeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${label}: ${value}`)
  }
}

export function createSeethingSwarmAnimalPresentationGeometry<PlatformAsset>(
  referencePose: SeethingSwarmReferencePose,
  clips: readonly SeethingSwarmRuntimeCharacterClip<PlatformAsset>[],
): SeethingSwarmAnimalPresentationGeometry {
  assertPositiveSafeInteger(clips.length, "SeethingSwarm clearance clip count")
  const bounds = clips.map((clip) =>
    createSeethingSwarmVisibleContentBounds(
      clip.frameWidth,
      clip.frameHeight,
      clip.visibleBounds,
    ),
  )
  const left = Math.min(...bounds.map((bound) => bound.left))
  const top = Math.min(...bounds.map((bound) => bound.top))
  const right = Math.max(...bounds.map((bound) => bound.left + bound.width))
  const bottom = Math.max(...bounds.map((bound) => bound.top + bound.height))
  const integerScale = SEETHING_SWARM_STANDALONE_SCALE
  return Object.freeze({
    visibleBounds: Object.freeze({
      left,
      top,
      width: right - left,
      height: bottom - top,
    }),
    integerScale,
    frameOffsetX: -left * integerScale,
    frameOffsetY: -top * integerScale,
    width: (right - left) * integerScale,
    height: (bottom - top) * integerScale,
    anchorX: (referencePose.anchor.x - left) * integerScale,
    anchorY: (referencePose.anchor.y - top) * integerScale,
  }) satisfies SeethingSwarmAnimalPresentationGeometry
}

function resolveCalmAnimalClip<PlatformAsset>(
  animal: SeethingSwarmRuntimeAnimalClips<PlatformAsset>,
) {
  for (const animationId of SEETHING_SWARM_HUB_ANIMATION_CANDIDATES) {
    const clip = animal.characterClips.find(
      (candidate) => candidate.animationId === animationId,
    )
    if (clip) return clip
  }

  throw new Error(
    `Missing calm SeethingSwarm Hub animation for ${animal.animalId}`,
  )
}

export function createSeethingSwarmStageGeometry(
  geometries: readonly (SeethingSwarmAnimalPresentationGeometry | null)[],
): Readonly<{ width: number; height: number; belowAnchor: number }> {
  const width = Math.max(
    SEETHING_SWARM_BATTLE_TILE_SIZE,
    ...geometries.map(
      (geometry) => geometry?.width ?? SEETHING_SWARM_BATTLE_TILE_SIZE,
    ),
  )
  const aboveAnchor = Math.max(
    SEETHING_SWARM_BATTLE_TILE_SIZE,
    ...geometries.map(
      (geometry) => geometry?.anchorY ?? SEETHING_SWARM_BATTLE_TILE_SIZE,
    ),
  )
  const belowAnchor = Math.max(
    0,
    ...geometries.map((geometry) =>
      geometry ? geometry.height - geometry.anchorY : 0,
    ),
  )
  return Object.freeze({
    width,
    height: aboveAnchor + belowAnchor,
    belowAnchor,
  })
}

function resolveAnimalClips<PlatformAsset>(
  catalog: Extract<
    SeethingSwarmRuntimeClipCatalog<PlatformAsset>,
    { mode: "licensed" }
  >,
  animalId: ZooAnimalId,
) {
  const animal = catalog.animals.find(
    (candidate) => candidate.animalId === animalId,
  )
  if (!animal) {
    throw new Error(`Missing animal presentation for animal: ${animalId}`)
  }
  return animal
}

function getCustomValueInitial(valueName: string) {
  const initial = splitGraphemes(valueName.trim()).next().value
  if (!initial) throw new Error("Custom Value name must contain one grapheme")
  return initial
}

export function resolveValueAnimalPresentation<PlatformAsset>(
  value: ActiveValueDefinition,
  catalog: SeethingSwarmRuntimeClipCatalog<PlatformAsset>,
): ValueAnimalPresentation<PlatformAsset> {
  if (catalog.mode === "typography-only") {
    return TYPOGRAPHY_ONLY_VALUE_PRESENTATION
  }
  if (value.kind === "custom") {
    return Object.freeze({
      kind: "custom-initial",
      initial: getCustomValueInitial(value.name),
    })
  }

  const animalId = VALUE_TO_ANIMAL_MAP.find(
    ({ valueId }) => valueId === value.id,
  )?.animalId
  if (!animalId) {
    throw new Error(`Missing animal mapping for canonical value: ${value.id}`)
  }

  const animal = resolveAnimalClips(catalog, animalId)
  return Object.freeze({
    kind: "animal",
    clip: resolveCalmAnimalClip(animal),
    animal,
  })
}
