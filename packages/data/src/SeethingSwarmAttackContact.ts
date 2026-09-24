import { resolveSeethingSwarmFamilyPerformanceProfile } from "./SeethingSwarmFamilyPerformanceProfiles"
import type { SeethingSwarmRuntimeCharacterClip } from "./SeethingSwarmRuntimeClipCatalog"

const INSPECTED_ATTACK_CONTACTS = [
  ["batpack", "attack", 7, 2],
  ["bunnypack", "attack", 6, 3],
  ["catset", "attack", 7, 1],
  ["chickenpack", "attack_ground", 6, 2],
  ["cranepack", "attack", 7, 3],
  ["cranepack", "peck", 20, 4],
  ["crowpack", "attack_ground", 6, 2],
  ["deerpack", "attack01", 6, 2],
  ["deerpack", "attack02", 5, 1],
  ["dogpack", "attack", 7, 3],
  ["dragonflypack", "attack", 7, 3],
  ["falconpack", "attack_ground", 6, 2],
  ["foxpack", "attack", 7, 3],
  ["frogpack", "attackforward", 6, 3],
  ["catset-kittens", "attack", 6, 1],
  ["lil-axolotl", "attack", 7, 2],
  ["lil-doggies", "attack", 7, 2],
  ["lil-fox", "attack", 7, 2],
  ["lil-hedgehog", "attack", 7, 2],
  ["lil-otter", "attack", 7, 2],
  ["lil-pig", "bite", 7, 2],
  ["mousepack", "attack", 4, 2],
  ["owlpack", "attack_ground", 6, 2],
  ["pandapack", "attack01", 5, 2],
  ["pandapack", "attack02", 5, 2],
  ["pandapack", "bite", 8, 4],
  ["parrotpack", "attack_ground", 6, 2],
  ["pigpack", "bite", 7, 3],
  ["raccoonpack", "attack", 7, 3],
  ["turtlepack", "attack", 8, 3],
  ["wolfpack", "attack", 7, 3],
] as const

export function resolveSeethingSwarmAttackContact<Asset>(
  clip: SeethingSwarmRuntimeCharacterClip<Asset>,
): Readonly<{ frameIndex: number; facesAway: boolean }> | null {
  const { packId } = resolveSeethingSwarmFamilyPerformanceProfile(clip.animalId)
  const inspected = INSPECTED_ATTACK_CONTACTS.find(
    ([family, animation, frameCount]) =>
      family === packId &&
      animation === clip.animationId &&
      frameCount === clip.frameCount,
  )
  return inspected
    ? {
        frameIndex: inspected[3],
        facesAway: packId === "deerpack" && clip.animationId === "attack02",
      }
    : null
}
