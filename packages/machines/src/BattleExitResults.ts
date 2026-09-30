import type { ValueId } from "@game/data/src/Value"
import type { ValueProgress } from "@game/data/src/ValueProgress"
import { rankValues, type RankedValue } from "@game/data/src/ValueRanking"
import {
  getExactLevelProgressFromXP,
  XP_QUANTUM,
} from "@game/utils/src/LevelMath"
import type { BattleProfile } from "./BattleProfile"

export const BATTLE_RESULTS_PRESENTATION_DURATION_MS = 900
export const BATTLE_RESULTS_PRESENTATION_STEPS = 20

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
}

export type BattleExitResultsFrameValue = {
  readonly value: BattleExitResultsValue
  readonly rank: number
  readonly totalXp: number
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

  return Object.freeze({
    values: Object.freeze(values),
    entryProfileXp,
    exitProfileXp,
    profileXpChange: exitProfileXp - entryProfileXp,
    changedValueCount,
    hasChanges: changedValueCount > 0,
  })
}

function interpolateValueXp(
  value: BattleExitResultsValue,
  presentationStep: number,
) {
  const entryQuanta = value.entryProgress.totalXp / XP_QUANTUM
  const exitQuanta = value.exitProgress.totalXp / XP_QUANTUM
  const displayedQuanta =
    entryQuanta +
    Math.round(
      ((exitQuanta - entryQuanta) * presentationStep) /
        BATTLE_RESULTS_PRESENTATION_STEPS,
    )

  return displayedQuanta * XP_QUANTUM
}

export function projectBattleExitResultsFrame(
  results: BattleExitResults,
  presentationStep: number,
) {
  if (
    !Number.isInteger(presentationStep) ||
    presentationStep < 0 ||
    presentationStep > BATTLE_RESULTS_PRESENTATION_STEPS
  ) {
    throw new Error(`Invalid Results presentation step: ${presentationStep}`)
  }

  const useExitOrder = presentationStep >= BATTLE_RESULTS_PRESENTATION_STEPS / 2
  const values = results.values
    .map(
      (value) =>
        Object.freeze({
          value,
          rank: useExitOrder ? value.exitRank : value.entryRank,
          totalXp: interpolateValueXp(value, presentationStep),
        }) satisfies BattleExitResultsFrameValue,
    )
    .sort((first, second) => first.rank - second.rank)
  const profileXp = values.reduce(
    (total, value) => total + BigInt(value.totalXp),
    0n,
  )

  return Object.freeze({
    values: Object.freeze(values),
    profileXp,
    profileLevelProgress: getExactLevelProgressFromXP(profileXp),
  })
}
