import type { SeethingSwarmSourceAnimationId } from "./SeethingSwarmBattleAnimationPolicy"
import type { SeethingSwarmRuntimeCharacterClip } from "./SeethingSwarmRuntimeClipCatalog"

function defineSequenceRecipe(
  animationIds: readonly SeethingSwarmSourceAnimationId[],
  ...candidates: readonly (readonly SeethingSwarmSourceAnimationId[])[]
) {
  return Object.freeze({
    animationIds: Object.freeze(animationIds),
    candidates: Object.freeze(
      candidates.map((candidate) => Object.freeze(candidate)),
    ),
  })
}

export const SEETHING_SWARM_BATTLE_SEQUENCE_RECIPES = Object.freeze([
  defineSequenceRecipe(["hide", "unhide"], ["hide", "unhide"]),
  defineSequenceRecipe(["jump"], ["jump", "fall", "land"]),
  defineSequenceRecipe(["fall"], ["jump", "fall", "land"]),
  defineSequenceRecipe(
    ["land"],
    ["jump", "fall", "land"],
    ["takeoff", "fly", "fall", "land"],
    ["fly_forward", "land"],
  ),
  defineSequenceRecipe(["land_upright"], ["fly_forward", "land_upright"]),
  defineSequenceRecipe(["takeoff", "fly"], ["takeoff", "fly", "fall", "land"]),
  defineSequenceRecipe(
    ["fly_forward"],
    ["fly_forward", "land"],
    ["fly_forward", "land_upright"],
  ),
  defineSequenceRecipe(
    ["fly_idle"],
    ["fly_forward", "fly_idle", "land_upright"],
  ),
  defineSequenceRecipe(["fly_idle01"], ["fly_forward", "fly_idle01", "land"]),
  defineSequenceRecipe(["fly_idle02"], ["fly_forward", "fly_idle02", "land"]),
  defineSequenceRecipe(["soar"], ["takeoff", "soar", "fall", "land"]),
  defineSequenceRecipe(["soar_call"], ["takeoff", "soar_call", "fall", "land"]),
  defineSequenceRecipe(
    ["attack_air"],
    ["takeoff", "attack_air", "fall", "land"],
  ),
  defineSequenceRecipe(
    ["liedown_godown", "liedown_idle", "liedown_getup"],
    ["liedown_godown", "liedown_idle", "liedown_getup"],
  ),
])

export function resolveSeethingSwarmBattleSequence<PlatformAsset>(
  clip: SeethingSwarmRuntimeCharacterClip<PlatformAsset>,
  availableClips: readonly SeethingSwarmRuntimeCharacterClip<PlatformAsset>[],
  restClip?: SeethingSwarmRuntimeCharacterClip<PlatformAsset>,
): readonly SeethingSwarmRuntimeCharacterClip<PlatformAsset>[] | null {
  if (clip.animalId === "bat" && clip.animationId === "attack") {
    const sequence = ["fly_forward", "attack", "land_upright"].map(
      (animationId) =>
        availableClips.find((source) => source.animationId === animationId),
    )
    return sequence.every((source) => source !== undefined)
      ? Object.freeze(restClip ? [...sequence, restClip] : sequence)
      : null
  }
  const recipe = SEETHING_SWARM_BATTLE_SEQUENCE_RECIPES.find((candidate) =>
    candidate.animationIds.some(
      (animationId) => animationId === clip.animationId,
    ),
  )
  if (!recipe) return Object.freeze([clip])

  for (const candidate of recipe.candidates) {
    const sequence = candidate.map((animationId) =>
      availableClips.find((source) => source.animationId === animationId),
    )
    if (!sequence.every((source) => source !== undefined)) continue
    return Object.freeze(restClip ? [...sequence, restClip] : sequence)
  }
  return null
}
