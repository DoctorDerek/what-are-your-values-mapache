import { describe, expect, it } from "vitest"
import {
  BATTLE_RESULTS_REORDER_MOTION_MS,
  projectBattleExitResultsMotion,
} from "./BattleExitResultsMotion"

describe("Results lift and insert", () => {
  it("preserves the approved lift and decelerates lateral and scale travel into the landing", () => {
    for (const phase of [0, 0.1, 0.25, 0.5]) {
      const frame = projectBattleExitResultsMotion(
        75,
        1,
        phase * BATTLE_RESULTS_REORDER_MOTION_MS,
        false,
      )
      expect(frame.lateralPercentage).toBeCloseTo(Math.sin(Math.PI * phase) * 5)
      expect(frame.travel).toBeCloseTo(1 - (1 - phase) ** 2)
    }
    const late = [0.75, 0.8, 0.85, 0.9, 0.95, 1].map((phase) =>
      projectBattleExitResultsMotion(
        75,
        1,
        phase * BATTLE_RESULTS_REORDER_MOTION_MS,
        false,
      ),
    )
    for (let index = 2; index < late.length; index += 1) {
      expect(
        late[index - 1].lateralPercentage - late[index].lateralPercentage,
      ).toBeLessThan(
        late[index - 2].lateralPercentage - late[index - 1].lateralPercentage,
      )
      expect(late[index].scale - late[index - 1].scale).toBeLessThan(
        late[index - 1].scale - late[index - 2].scale,
      )
    }
    expect(late.at(-1)).toEqual({ travel: 1, lateralPercentage: 0, scale: 1 })
  })
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
