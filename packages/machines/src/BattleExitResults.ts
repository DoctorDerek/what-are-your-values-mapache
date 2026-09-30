import type { ValueId } from "@game/data/src/Value"
import type { ValueProgress } from "@game/data/src/ValueProgress"
import { rankValues, type RankedValue } from "@game/data/src/ValueRanking"
import {
  getExactLevelProgressFromXP,
  getExactLevelStartingXp,
} from "@game/utils/src/LevelMath"
import type { BattleProfile } from "./BattleProfile"

const MIN_LEVEL_BAR_FILL_DURATION_MS = 900
const MIN_XP_PROGRESSION_DURATION_MS = 3_700
export const BATTLE_RESULTS_PRESENTATION_TICK_MS = 50
export const BATTLE_RESULTS_REORDER_MOTION_MS = 280

export type BattleExitResultsValue = {
  readonly definition: RankedValue["definition"]
  readonly entryRank: number
  readonly exitRank: number
  readonly entryProgress: ValueProgress
  readonly exitProgress: ValueProgress
  readonly changed: boolean
}

export type BattleExitResults = {
  readonly values: readonly BattleExitResultsValue[]
  readonly entryProfileXp: bigint
  readonly exitProfileXp: bigint
  readonly profileXpChange: bigint
  readonly changedValueCount: number
  readonly hasChanges: boolean
  readonly presentationDurationMs: number
  readonly levelBarFillDurationMs: number
}

export type BattleExitResultsFrameValue = {
  readonly value: BattleExitResultsValue
  readonly rank: number
  readonly totalXp: number
  readonly levelBarPercentage: number
  readonly didCrossLevel: boolean
}

function didValueProgressChange(
  entryProgress: ValueProgress,
  exitProgress: ValueProgress,
) {
  return (
    entryProgress.totalXp !== exitProgress.totalXp ||
    entryProgress.profileWins !== exitProgress.profileWins ||
    entryProgress.profileComparisons !== exitProgress.profileComparisons ||
    entryProgress.currentCycleWins !== exitProgress.currentCycleWins
  )
}

function getLevelFraction(
  progress: ReturnType<typeof getExactLevelProgressFromXP>,
) {
  return (
    Number(progress.earnedXpTowardNextLevel) /
    Number(progress.requiredXpForNextLevel)
  )
}

function getSignedLevelDistance(entryXp: bigint, exitXp: bigint) {
  const entry = getExactLevelProgressFromXP(entryXp)
  const exit = getExactLevelProgressFromXP(exitXp)
  return (
    Number(exit.level - entry.level) +
    getLevelFraction(exit) -
    getLevelFraction(entry)
  )
}

export function createBattleExitResults(
  entryProfile: BattleProfile,
  exitProfile: BattleProfile,
): BattleExitResults | null {
  if (
    entryProfile.activeDeck.valueIds.length !==
      exitProfile.activeDeck.valueIds.length ||
    entryProfile.activeDeck.valueIds.some(
      (valueId, index) => exitProfile.activeDeck.valueIds[index] !== valueId,
    )
  ) {
    return null
  }

  const entryRankedValues = rankValues(
    entryProfile.activeDeck,
    entryProfile.progressById,
  )
  const exitRankedValues = rankValues(
    exitProfile.activeDeck,
    exitProfile.progressById,
  )
  const entryById = new Map<ValueId, RankedValue>(
    entryRankedValues.map((value) => [value.definition.id, value]),
  )
  const values = exitRankedValues.map((exitValue) => {
    const entryValue = entryById.get(exitValue.definition.id)
    if (!entryValue) {
      throw new Error(`Results entry is missing ${exitValue.definition.id}`)
    }

    return Object.freeze({
      definition: exitValue.definition,
      entryRank: entryValue.rank,
      exitRank: exitValue.rank,
      entryProgress: entryValue.progress,
      exitProgress: exitValue.progress,
      changed:
        entryValue.rank !== exitValue.rank ||
        didValueProgressChange(entryValue.progress, exitValue.progress),
    }) satisfies BattleExitResultsValue
  })
  const entryProfileXp = values.reduce(
    (total, value) => total + BigInt(value.entryProgress.totalXp),
    0n,
  )
  const exitProfileXp = values.reduce(
    (total, value) => total + BigInt(value.exitProgress.totalXp),
    0n,
  )
  const changedValueCount = values.filter((value) => value.changed).length
  const greatestLevelDistance = values.reduce(
    (greatest, value) =>
      Math.max(
        greatest,
        Math.abs(
          getSignedLevelDistance(
            BigInt(value.entryProgress.totalXp),
            BigInt(value.exitProgress.totalXp),
          ),
        ),
      ),
    Math.abs(getSignedLevelDistance(entryProfileXp, exitProfileXp)),
  )
  const presentationDurationMs =
    greatestLevelDistance > 0
      ? Math.ceil(
          Math.max(
            MIN_XP_PROGRESSION_DURATION_MS,
            greatestLevelDistance * MIN_LEVEL_BAR_FILL_DURATION_MS,
          ),
        )
      : values.some((value) => value.entryRank !== value.exitRank)
        ? BATTLE_RESULTS_REORDER_MOTION_MS * 2
        : 0

  return Object.freeze({
    values: Object.freeze(values),
    entryProfileXp,
    exitProfileXp,
    profileXpChange: exitProfileXp - entryProfileXp,
    changedValueCount,
    hasChanges: changedValueCount > 0,
    presentationDurationMs,
    levelBarFillDurationMs:
      greatestLevelDistance > 0
        ? presentationDurationMs / greatestLevelDistance
        : 0,
  })
}

function projectPresentationProgress(
  entryXp: bigint,
  exitXp: bigint,
  traveledLevelDistance: number,
) {
  const entryProgress = getExactLevelProgressFromXP(entryXp)
  const exitProgress = getExactLevelProgressFromXP(exitXp)
  const signedDistance = getSignedLevelDistance(entryXp, exitXp)
  const distance = Math.abs(signedDistance)

  if (traveledLevelDistance <= 0 || distance === 0)
    return Object.freeze({
      totalXp: entryXp,
      levelProgress: entryProgress,
      levelBarPercentage: getLevelFraction(entryProgress) * 100,
    })

  if (traveledLevelDistance >= distance)
    return Object.freeze({
      totalXp: exitXp,
      levelProgress: exitProgress,
      levelBarPercentage: getLevelFraction(exitProgress) * 100,
    })

  const relativeLevelPosition =
    getLevelFraction(entryProgress) +
    Math.sign(signedDistance) * traveledLevelDistance
  const crossedLevels = Math.floor(relativeLevelPosition)
  const level = entryProgress.level + BigInt(crossedLevels)
  const levelFraction = relativeLevelPosition - crossedLevels
  const levelStartingXp = getExactLevelStartingXp(level)
  const requiredXp = getExactLevelStartingXp(level + 1n) - levelStartingXp
  const totalXp =
    levelStartingXp + BigInt(Math.floor(levelFraction * Number(requiredXp)))

  return Object.freeze({
    totalXp,
    levelProgress: getExactLevelProgressFromXP(totalXp),
    levelBarPercentage: levelFraction * 100,
  })
}

export function projectBattleExitResultsFrame(
  results: BattleExitResults,
  elapsedMs: number,
  previousElapsedMs = elapsedMs,
) {
  if (
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0 ||
    !Number.isFinite(previousElapsedMs) ||
    previousElapsedMs < 0 ||
    previousElapsedMs > elapsedMs
  ) {
    throw new Error(`Invalid Results presentation time: ${elapsedMs}`)
  }

  const traveledLevelDistance =
    results.levelBarFillDurationMs > 0
      ? elapsedMs / results.levelBarFillDurationMs
      : 0
  const previousTraveledLevelDistance =
    results.levelBarFillDurationMs > 0
      ? previousElapsedMs / results.levelBarFillDurationMs
      : 0
  const useExitOrder = elapsedMs >= results.presentationDurationMs / 2
  const values = results.values
    .map((value) => {
      const progress = projectPresentationProgress(
        BigInt(value.entryProgress.totalXp),
        BigInt(value.exitProgress.totalXp),
        traveledLevelDistance,
      )
      const previousProgress =
        previousElapsedMs === elapsedMs
          ? progress
          : projectPresentationProgress(
              BigInt(value.entryProgress.totalXp),
              BigInt(value.exitProgress.totalXp),
              previousTraveledLevelDistance,
            )
      return Object.freeze({
        value,
        rank: useExitOrder ? value.exitRank : value.entryRank,
        totalXp: Number(progress.totalXp),
        levelBarPercentage: progress.levelBarPercentage,
        didCrossLevel:
          progress.levelProgress.level !== previousProgress.levelProgress.level,
      }) satisfies BattleExitResultsFrameValue
    })
    .sort((first, second) => first.rank - second.rank)
  const profileProgress = projectPresentationProgress(
    results.entryProfileXp,
    results.exitProfileXp,
    traveledLevelDistance,
  )
  const previousProfileProgress =
    previousElapsedMs === elapsedMs
      ? profileProgress
      : projectPresentationProgress(
          results.entryProfileXp,
          results.exitProfileXp,
          previousTraveledLevelDistance,
        )

  return Object.freeze({
    values: Object.freeze(values),
    profileXp: profileProgress.totalXp,
    profileLevelProgress: profileProgress.levelProgress,
    profileLevelBarPercentage: profileProgress.levelBarPercentage,
    profileDidCrossLevel:
      profileProgress.levelProgress.level !==
      previousProfileProgress.levelProgress.level,
  })
}
