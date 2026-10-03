import { describe, expect, it } from "vitest"
import {
  BATTLE_RESULTS_REORDER_MOTION_MS,
  projectBattleExitResultsMotion,
} from "./BattleExitResultsMotion"

describe("Results lift and insert", () => {
  it("lifts promoted and displaced cards in opposite directions while traveling", () => {
    const promoted = projectBattleExitResultsMotion(75, 1, 1_850, false)
    const displaced = projectBattleExitResultsMotion(1, 3, 1_850, false)
    expect(promoted.travel).toBe(0.75)
    expect(displaced.travel).toBe(0.75)
    expect(promoted.lateralPercentage).toBe(5)
    expect(displaced.lateralPercentage).toBe(-5)
    expect(promoted.scale).toBe(0.955)
    expect(displaced.scale).toBe(0.955)
  })

  it("finishes precisely at 3.7 seconds and never replays during longer fills", () => {
    for (const elapsedMs of [BATTLE_RESULTS_REORDER_MOTION_MS, 30_000]) {
      expect(projectBattleExitResultsMotion(5, 2, elapsedMs, false)).toEqual({
        travel: 1,
        lateralPercentage: 0,
        scale: 1,
      })
    }
  })

  it("settles immediately for interaction without creating any progression data", () => {
    expect(projectBattleExitResultsMotion(75, 1, 900, true)).toEqual({
      travel: 1,
      lateralPercentage: 0,
      scale: 1,
    })
    expect(projectBattleExitResultsMotion(2, 2, 1_850, false)).toEqual({
      travel: 0.75,
      lateralPercentage: 0,
      scale: 1,
    })
  })
})
