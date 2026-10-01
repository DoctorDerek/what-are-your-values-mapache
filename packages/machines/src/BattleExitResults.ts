import type { ValueId } from "@game/data/src/Value"
import type { ValueProgress } from "@game/data/src/ValueProgress"
import { rankValues, type RankedValue } from "@game/data/src/ValueRanking"
import type { BattleProfile } from "@game/machines/src/BattleProfile"
import {
  getExactLevelProgressFromXP,
  getExactLevelStartingXp,
} from "@game/utils/src/LevelMath"

const MIN_LEVEL_BAR_FILL_DURATION_MS = 900
const MIN_XP_PROGRESSION_DURATION_MS = 3_700
export const BATTLE_RESULTS_PRESENTATION_TICK_MS = 50
export const BATTLE_RESULTS_REORDER_MOTION_MS = 3_700

export type BattleExitResultsValue = {
  readonly definition: RankedValue["definition"]
  readonly entryRank: number
  readonly exitRank: number
  readonly entryProgress: ValueProgress
  readonly exitProgress: ValueProgress
  readonly changed: boolean
  readonly presentationDurationMs: number
}

export type BattleExitResults = {
  readonly values: readonly BattleExitResultsValue[]
  readonly entryProfileXp: bigint
  readonly exitProfileXp: bigint
  readonly profileXpChange: bigint
  readonly changedValueCount: number
  readonly hasChanges: boolean
  readonly presentationDurationMs: number
  readonly profilePresentationDurationMs: number
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

function getProgressionDurationMs(entryXp: bigint, exitXp: bigint) {
  const distance = Math.abs(getSignedLevelDistance(entryXp, exitXp))
  return entryXp === exitXp
    ? 0
    : Math.ceil(
        Math.max(
          MIN_XP_PROGRESSION_DURATION_MS,
          distance * MIN_LEVEL_BAR_FILL_DURATION_MS,
        ),
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
      presentationDurationMs: getProgressionDurationMs(
        BigInt(entryValue.progress.totalXp),
        BigInt(exitValue.progress.totalXp),
      ),
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
  const profilePresentationDurationMs = getProgressionDurationMs(
    entryProfileXp,
    exitProfileXp,
  )
  const presentationDurationMs = values.reduce(
    (longest, value) => Math.max(longest, value.presentationDurationMs),
    Math.max(
      profilePresentationDurationMs,
      values.some((value) => value.entryRank !== value.exitRank)
        ? BATTLE_RESULTS_REORDER_MOTION_MS
        : 0,
    ),
  )

  return Object.freeze({
    values: Object.freeze(values),
    entryProfileXp,
    exitProfileXp,
    profileXpChange: exitProfileXp - entryProfileXp,
    changedValueCount,
    hasChanges: changedValueCount > 0,
    presentationDurationMs,
    profilePresentationDurationMs,
  })
}

function projectPresentationProgress(
  entryXp: bigint,
  exitXp: bigint,
  elapsedMs: number,
  durationMs: number,
) {
  const entryProgress = getExactLevelProgressFromXP(entryXp)
  const exitProgress = getExactLevelProgressFromXP(exitXp)
  const signedDistance = getSignedLevelDistance(entryXp, exitXp)
  const distance = Math.abs(signedDistance)
  const traveledLevelDistance =
    durationMs > 0 ? (elapsedMs / durationMs) * distance : 0

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
  areRowPositionsSettled = false,
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

  const useExitOrder = elapsedMs > 0 || areRowPositionsSettled
  const values = results.values
    .map((value) => {
      const progress = projectPresentationProgress(
        BigInt(value.entryProgress.totalXp),
        BigInt(value.exitProgress.totalXp),
        elapsedMs,
        value.presentationDurationMs,
      )
      const previousProgress =
        previousElapsedMs === elapsedMs
          ? progress
          : projectPresentationProgress(
              BigInt(value.entryProgress.totalXp),
              BigInt(value.exitProgress.totalXp),
              previousElapsedMs,
              value.presentationDurationMs,
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
    elapsedMs,
    results.profilePresentationDurationMs,
  )
  const previousProfileProgress =
    previousElapsedMs === elapsedMs
      ? profileProgress
      : projectPresentationProgress(
          results.entryProfileXp,
          results.exitProfileXp,
          previousElapsedMs,
          results.profilePresentationDurationMs,
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
