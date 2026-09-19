import { resolveSeethingSwarmFamilyPerformanceProfile } from "@game/data/src/SeethingSwarmFamilyPerformanceProfiles"
import type {
  SeethingSwarmLicensedRuntimeClipCatalog,
  SeethingSwarmRuntimeCharacterClip,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { ZooAnimalId } from "@game/data/src/ZooAnimals"
import type { PresentedBattle } from "@game/machines/src/CombatMachine"
import { resolveSeethingSwarmBattleCombatant } from "@game/machines/src/SeethingSwarmBattleCombatant"
import type { StaticImageData } from "next/image"

function getTestAnimationIds(animalId: ZooAnimalId) {
  const profile = resolveSeethingSwarmFamilyPerformanceProfile(animalId)
  return [
    ...new Set([
      profile.calm[0]!,
      profile.attention.at(-1)!,
      profile.attack[0]!,
      "hurt",
      profile.celebration[0]!,
      profile.locomotion[0]!,
    ]),
  ]
}

function createTestClip(animalId: ZooAnimalId, animationId: string) {
  const frameWidth = 32
  const frameHeight = 32
  const frameCount = 4

  return Object.freeze({
    kind: "character",
    animalId,
    animationId,
    relativePath: `${animalId}/${animationId}_strip${frameCount}.png`,
    frameWidth,
    frameHeight,
    frameCount,
    visibleBounds: Object.freeze({
      left: 0,
      top: 0,
      width: frameWidth,
      height: frameHeight,
    }),
    asset: Object.freeze({
      src: `/test-assets/${animalId}/${animationId}.png`,
      width: frameWidth * frameCount,
      height: frameHeight,
    }),
  }) satisfies SeethingSwarmRuntimeCharacterClip<StaticImageData>
}

export function createSeethingSwarmBattleStageTestCatalog(
  ...battles: readonly PresentedBattle[]
) {
  const animalIds = [
    ...new Set(
      battles.flatMap(({ pair }) =>
        pair.map(
          (valueId) => resolveSeethingSwarmBattleCombatant(valueId).animalId,
        ),
      ),
    ),
  ]
  const animals = animalIds.map((animalId) =>
    Object.freeze({
      animalId,
      characterClips: Object.freeze(
        getTestAnimationIds(animalId).map((animationId) =>
          createTestClip(animalId, animationId),
        ),
      ),
      auxiliaryEffectClips: Object.freeze([]),
      referencePose: Object.freeze({
        animationId: animalId === "bat" ? "idle_upright" : "idle",
        frameIndex: 0,
        bounds: Object.freeze({ left: 0, top: 0, width: 32, height: 32 }),
        anchor: Object.freeze({ x: 16, y: 32 }),
      }),
    }),
  )

  return Object.freeze({
    mode: "licensed",
    evidenceSnapshotId: "battle-stage-test",
    animals: Object.freeze(animals),
    characterClipCount: animals.reduce(
      (count, animal) => count + animal.characterClips.length,
      0,
    ),
    auxiliaryEffectClipCount: 0,
  }) satisfies SeethingSwarmLicensedRuntimeClipCatalog<StaticImageData>
}
