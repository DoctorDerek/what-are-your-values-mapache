import { getExactLevelProgressFromXP } from "@game/utils/src/LevelMath"
import { describe, expect, it } from "vitest"
import {
  createBattleExitResults,
  projectBattleExitResultsFrame,
} from "./BattleExitResults"
import { createInitialBattleProfile } from "./BattleProfile"

function createProgression(entryXp: number, exitXp: number) {
  const initial = createInitialBattleProfile("results-easing")
  const valueId = initial.activeDeck.valueIds[0]!
  const progress = initial.progressById.get(valueId)!
  const entryProgress = new Map(initial.progressById)
  const exitProgress = new Map(initial.progressById)
  entryProgress.set(valueId, { ...progress, totalXp: entryXp })
  exitProgress.set(valueId, { ...progress, totalXp: exitXp })
  const results = createBattleExitResults(
    { ...initial, progressById: entryProgress },
    { ...initial, progressById: exitProgress },
  )!
  return { results, valueId }
}

describe("Results quadratic Level-span progression", () => {
  it.each([
    { entryXp: 0, exitXp: 4, elapsedMs: 925, halfwayPercentage: 75 },
    { entryXp: 12, exitXp: 16, elapsedMs: 462.5, halfwayPercentage: 87.5 },
    { entryXp: 8, exitXp: 12, elapsedMs: 3_330, halfwayPercentage: 37.5 },
    { entryXp: 16, exitXp: 12, elapsedMs: 462.5, halfwayPercentage: 12.5 },
    { entryXp: 12, exitXp: 8, elapsedMs: 370, halfwayPercentage: 12.5 },
  ])(
    "eases $entryXp → $exitXp XP continuously across the complete minimum",
    ({ entryXp, exitXp, elapsedMs, halfwayPercentage }) => {
      const { results, valueId } = createProgression(entryXp, exitXp)
      expect(results.profilePresentationDurationMs).toBe(3_700)
      const halfway = projectBattleExitResultsFrame(results, elapsedMs)
      expect(halfway.profileLevelBarPercentage).toBe(halfwayPercentage)
      expect(
        halfway.values.find(({ value }) => value.definition.id === valueId)
          ?.levelBarPercentage,
      ).toBe(halfwayPercentage)
      const almostComplete = projectBattleExitResultsFrame(results, 3_699)
      const complete = projectBattleExitResultsFrame(results, 3_700)
      expect(almostComplete.profileLevelBarPercentage).not.toBe(
        complete.profileLevelBarPercentage,
      )
      expect(complete.profileXp).toBe(BigInt(exitXp))
      expect(complete.profileLevelProgress).toEqual(
        getExactLevelProgressFromXP(BigInt(exitXp)),
      )
    },
  )

  it("restarts the curve at each 900 ms Level without rushing the whole journey", () => {
    const { results, valueId } = createProgression(0, 12)
    expect(results.profilePresentationDurationMs).toBe(5_850)
    for (const [elapsedMs, level, percentage] of [
      [450, 1n, 75],
      [900, 2n, 0],
      [1_350, 2n, 75],
      [1_800, 3n, 0],
      [5_400, 7n, 0],
      [5_625, 7n, 37.5],
      [5_850, 7n, 50],
    ] as const) {
      const frame = projectBattleExitResultsFrame(results, elapsedMs)
      expect(frame.profileLevelProgress.level).toBe(level)
      expect(frame.profileLevelBarPercentage).toBeCloseTo(percentage)
      expect(
        frame.values.find(({ value }) => value.definition.id === valueId)
          ?.levelBarPercentage,
      ).toBeCloseTo(percentage)
      expect(frame.profileLevelProgress).toEqual(
        getExactLevelProgressFromXP(frame.profileXp),
      )
    }
  })

  it("allocates first and last partial spans proportionally in both directions", () => {
    const forward = createProgression(12, 16).results
    const backward = createProgression(16, 12).results
    for (const results of [forward, backward]) {
      expect(results.profilePresentationDurationMs).toBe(3_700)
      const firstPartialHalf = projectBattleExitResultsFrame(results, 3_700 / 8)
      expect(firstPartialHalf.profileLevelBarPercentage).toBeCloseTo(
        results === forward ? 87.5 : 12.5,
      )
      const lastPartialHalf = projectBattleExitResultsFrame(
        results,
        (3_700 * 7) / 8,
      )
      expect(lastPartialHalf.profileLevelBarPercentage).toBeCloseTo(
        results === forward ? 37.5 : 62.5,
      )
      const complete = projectBattleExitResultsFrame(results, 3_700)
      expect(complete.profileXp).toBe(results.exitProfileXp)
      expect(complete.profileLevelBarPercentage).toBe(50)
    }
  })

  it("eases ranks in both directions while preserving exact settlement and quiet rows", () => {
    const initial = createInitialBattleProfile("results-rank-easing")
    const valueId = initial.activeDeck.valueIds[74]!
    const progressById = new Map(initial.progressById)
    progressById.set(valueId, {
      ...progressById.get(valueId)!,
      totalXp: 12,
    })
    const results = createBattleExitResults(initial, {
      ...initial,
      progressById,
    })!
    for (const [elapsedMs, expectedRank] of [
      [0, 75],
      [925, 43],
      [1_850, 20],
      [2_775, 6],
      [3_699, 2],
      [3_700, 1],
    ] as const) {
      const frame = projectBattleExitResultsFrame(results, elapsedMs)
      expect(frame.values[0]?.rank).toBe(expectedRank)
      expect(
        frame.values.find(({ value }) => value.entryRank === 1)?.rank,
      ).toBe(elapsedMs === 3_700 ? 2 : 1)
      expect(
        frame.values
          .filter(({ value }) => value.entryRank === value.exitRank)
          .every(({ rank, value }) => rank === value.entryRank),
      ).toBe(true)
    }
    const moving = projectBattleExitResultsFrame(results, 925)
    const settled = projectBattleExitResultsFrame(results, 925, 925, true)
    expect(settled.values[0]?.rank).toBe(1)
    expect(settled.profileXp).toBe(moving.profileXp)
    expect(settled.profileLevelBarPercentage).toBe(
      moving.profileLevelBarPercentage,
    )
  })
})
