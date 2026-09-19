import type { SeethingSwarmSourceAnimationId } from "./SeethingSwarmBattleAnimationPolicy"
import { SEETHING_SWARM_SOURCE_PACKS } from "./SeethingSwarmSourceEvidence"
import type { ZooAnimalId } from "./ZooAnimals"

type AnimationPool = readonly SeethingSwarmSourceAnimationId[]

export type SeethingSwarmFamilyPerformanceProfile = Readonly<{
  packId: string
  calm: AnimationPool
  attention: AnimationPool
  locomotion: AnimationPool
  attack: AnimationPool
  celebration: AnimationPool
}>

function defineProfile(
  packId: string,
  calm: AnimationPool,
  attention: AnimationPool,
  locomotion: AnimationPool,
  attack: AnimationPool,
  celebration: AnimationPool,
): SeethingSwarmFamilyPerformanceProfile {
  return Object.freeze({
    packId,
    calm: Object.freeze(calm),
    attention: Object.freeze(attention),
    locomotion: Object.freeze(locomotion),
    attack: Object.freeze(attack),
    celebration: Object.freeze(celebration),
  })
}

export const SEETHING_SWARM_FAMILY_PERFORMANCE_PROFILES = Object.freeze([
  defineProfile(
    "batpack",
    ["idle_upright", "idle_upright_blink"],
    ["crouch"],
    ["fly_forward"],
    ["attack"],
    ["fly_idle"],
  ),
  defineProfile(
    "bunnypack",
    ["idle", "idle_blink", "sit"],
    ["idle_blink"],
    ["run", "dash"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "catset",
    ["idle", "idle_blink", "sit"],
    ["crouch"],
    ["walk", "run", "dash", "sneak"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "chickenpack",
    ["idle", "idle_blink", "sit"],
    ["peck"],
    ["walk", "run"],
    ["attack_ground", "attack_air"],
    ["fly"],
  ),
  defineProfile(
    "cranepack",
    ["idle", "idle_blink"],
    ["display", "call"],
    ["walk", "run"],
    ["attack", "peck"],
    ["dance", "display", "call", "fly", "soar"],
  ),
  defineProfile(
    "crowpack",
    ["idle", "idle_caw"],
    ["idle_caw"],
    ["walk"],
    ["attack_ground", "attack_air"],
    ["idle_caw", "fly", "soar"],
  ),
  defineProfile(
    "deerpack",
    ["idle", "eat"],
    ["alerted", "crouch"],
    ["run", "dash"],
    ["attack01", "attack02"],
    ["jump"],
  ),
  defineProfile(
    "dogpack",
    ["idle", "idle_blink", "sit"],
    ["bark", "growl", "crouch"],
    ["walk", "run", "dash"],
    ["attack"],
    ["bark", "jump"],
  ),
  defineProfile(
    "dragonflypack",
    ["idle", "idle_blink"],
    ["crouch"],
    ["walk", "run", "fly_forward"],
    ["attack"],
    ["fly_idle01", "fly_idle02"],
  ),
  defineProfile(
    "falconpack",
    ["idle", "idle_call"],
    ["idle_call"],
    ["walk"],
    ["attack_ground", "attack_air"],
    ["idle_call", "fly", "soar", "soar_call"],
  ),
  defineProfile(
    "foxpack",
    ["idle", "idle_blink", "sit01", "sit02"],
    ["bark", "howl", "crouch"],
    ["run", "dash"],
    ["attack"],
    ["howl", "bark", "jump"],
  ),
  defineProfile(
    "frogpack",
    ["idle"],
    ["croak"],
    ["hop"],
    ["attackforward"],
    ["croak", "jump"],
  ),
  defineProfile(
    "catset-kittens",
    ["idle", "idle_blink", "sit"],
    ["crouch"],
    ["walk", "run", "dash", "sneak"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "lil-axolotl",
    ["idle", "idle_blink", "sit"],
    ["crouch"],
    ["walk", "run", "dash", "sneak"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "lil-doggies",
    ["idle", "idle_blink", "sit"],
    ["crouch"],
    ["walk", "run", "dash", "sneak"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "lil-fox",
    ["idle", "idle_blink", "sit"],
    ["crouch"],
    ["walk", "run", "dash", "sneak"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "lil-hedgehog",
    ["idle", "idle_blink"],
    ["crouch"],
    ["walk", "run", "dash", "sneak"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "lil-otter",
    ["idle", "idle_blink", "sit"],
    ["crouch"],
    ["walk", "run", "dash", "sneak"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "lil-pig",
    ["idle", "idle_blink", "sit"],
    ["crouch"],
    ["walk", "run", "dash", "sneak"],
    ["bite"],
    ["jump"],
  ),
  defineProfile(
    "mousepack",
    ["idle", "idle_blink"],
    ["sniff"],
    ["run", "dash"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "owlpack",
    ["idle", "idle_blink", "idle02", "idle02_blink"],
    ["idle_call"],
    ["walk"],
    ["attack_ground", "attack_air"],
    ["idle_call", "fly", "soar", "soar_call"],
  ),
  defineProfile(
    "pandapack",
    ["idle", "idle_laugh"],
    ["idle_laugh"],
    ["run"],
    ["attack01", "attack02", "bite"],
    ["idle_laugh", "jump"],
  ),
  defineProfile(
    "parrotpack",
    ["idle", "idle_caw"],
    ["idle_caw"],
    ["walk"],
    ["attack_ground", "attack_air"],
    ["idle_caw", "fly", "soar"],
  ),
  defineProfile(
    "pigpack",
    ["idle", "idle_blink", "sit", "sit_blink"],
    ["crouch"],
    ["walk", "run", "dash"],
    ["bite"],
    ["jump"],
  ),
  defineProfile(
    "raccoonpack",
    ["idle", "idle_blink", "sit01", "sit02"],
    ["bark", "crouch"],
    ["run", "dash"],
    ["attack"],
    ["bark", "jump"],
  ),
  defineProfile(
    "turtlepack",
    ["idle", "idle_blink"],
    ["idle_blink"],
    ["walk", "run"],
    ["attack"],
    ["jump"],
  ),
  defineProfile(
    "wolfpack",
    ["idle", "idle_blink", "sit"],
    ["growl", "howl", "crouch"],
    ["run", "dash"],
    ["attack"],
    ["howl", "jump"],
  ),
])

export function resolveSeethingSwarmFamilyPerformanceProfile(
  animalId: ZooAnimalId,
): SeethingSwarmFamilyPerformanceProfile {
  const pack = SEETHING_SWARM_SOURCE_PACKS.find((candidate) =>
    candidate.animalIds.includes(animalId),
  )
  const profile = SEETHING_SWARM_FAMILY_PERFORMANCE_PROFILES.find(
    (candidate) => candidate.packId === pack?.packId,
  )
  if (!profile)
    throw new Error(`Missing SeethingSwarm family profile: ${animalId}`)
  return profile
}
