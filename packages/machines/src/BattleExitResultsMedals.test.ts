import type { ValueRankMedalColor } from "@game/data/src/ValueRankMedal"
import { describe, expect, it } from "vitest"
import {
  createBattleExitResults,
  projectBattleExitResultsFrame,
} from "./BattleExitResults"
import {
  applyBattleChoice,
  applyBattleUndo,
  createInitialBattleProfile,
} from "./BattleProfile"
import { projectBattlePair } from "./BattleScheduler"

function createRankedProfiles(entryRank: number) {
  const initial = createInitialBattleProfile("results-medal-progression")
  const progressById = new Map(initial.progressById)
  for (const [index, valueId] of initial.activeDeck.valueIds
    .slice(0, 20)
    .entries())
    progressById.set(valueId, {
      totalXp: (20 - index) * 4,
      profileWins: 20 - index,
      profileComparisons: 20 - index,
      currentCycleWins: 0,
    })
  const entry = { ...initial, progressById }
  const valueId = initial.activeDeck.valueIds[entryRank - 1]!
  const exitProgressById = new Map(progressById)
  exitProgressById.set(valueId, {
    totalXp: 84,
    profileWins: 21,
    profileComparisons: 21,
    currentCycleWins: 1,
  })
  return { entry, exit: { ...entry, progressById: exitProgressById }, valueId }
}

describe("Results rank medals", () => {
  it("promotes bronze through silver to gold on the existing rank clock", () => {
    const { entry, exit, valueId } = createRankedProfiles(14)
    const results = createBattleExitResults(entry, exit)!
    expect(results.hasEntryRanking).toBe(true)
    expect(results.hasExitRanking).toBe(true)
    for (const [elapsedMs, rank, medal] of [
      [0, 14, "bronze"],
      [925, 9, "silver"],
      [1_850, 5, "gold"],
      [3_700, 1, "gold"],
    ] as const) {
      const row = projectBattleExitResultsFrame(results, elapsedMs).values.find(
        ({ value }) => value.definition.id === valueId,
      )!
      expect(row).toMatchObject({ rank, medal, finalMedal: "gold" })
    }
    const moving = projectBattleExitResultsFrame(results, 925)
    const settled = projectBattleExitResultsFrame(results, 925, 925, true)
    expect(settled.values[0]).toMatchObject({ rank: 1, medal: "gold" })
    expect(settled.values.map(({ totalXp }) => totalXp)).toEqual(
      moving.values.map(({ totalXp }) => totalXp),
    )
    expect(settled.profileXp).toBe(moving.profileXp)
  })

  it("enters and leaves the medal bands truthfully in either direction", () => {
    const { entry, exit, valueId } = createRankedProfiles(17)
    for (const [before, after, expectedMedals] of [
      [entry, exit, [null, "bronze", "silver", "gold"]],
      [exit, entry, ["gold", "silver", "bronze", null]],
    ] as const) {
      const results = createBattleExitResults(before, after)!
      const seen = new Set<ValueRankMedalColor | null>()
      for (let elapsedMs = 0; elapsedMs <= 3_700; elapsedMs += 50) {
        const row = projectBattleExitResultsFrame(
          results,
          elapsedMs,
        ).values.find(({ value }) => value.definition.id === valueId)!
        seen.add(row.medal)
      }
      expect([...seen]).toEqual(expectedMedals)
      const final = projectBattleExitResultsFrame(
        results,
        results.presentationDurationMs,
      )
      expect(final.values.filter(({ medal }) => medal === "gold")).toHaveLength(
        5,
      )
      expect(
        final.values.filter(({ medal }) => medal === "silver"),
      ).toHaveLength(5)
      expect(
        final.values.filter(({ medal }) => medal === "bronze"),
      ).toHaveLength(5)
      expect(
        final.values.every(({ medal, finalMedal }) => medal === finalMedal),
      ).toBe(true)
    }
  })

  it("reveals the first ranking from blank through each earned medal tier", () => {
    const entry = createInitialBattleProfile("results-first-ranking-medals")
    const [winnerId] = projectBattlePair(entry.activeDeck, entry.scheduler)
    const { profile: exit } = applyBattleChoice({
      profile: entry,
      winnerId,
      expectedScheduler: entry.scheduler,
    })
    const results = createBattleExitResults(entry, exit)!
    expect(results.hasEntryRanking).toBe(false)
    expect(results.hasExitRanking).toBe(true)
    for (const [elapsedMs, gold, silver, bronze] of [
      [0, null, null, null],
      [50, "bronze", "bronze", "bronze"],
      [700, "silver", "bronze", "bronze"],
      [1_100, "silver", "silver", "bronze"],
      [1_600, "gold", "silver", "bronze"],
      [3_700, "gold", "silver", "bronze"],
    ] as const) {
      const frame = projectBattleExitResultsFrame(results, elapsedMs)
      const expectedMedals = { gold, silver, bronze }
      for (const row of frame.values)
        expect(row.medal).toBe(
          row.finalMedal ? expectedMedals[row.finalMedal] : null,
        )
    }
    const progressing = projectBattleExitResultsFrame(results, 50)
    const settled = projectBattleExitResultsFrame(results, 50, 50, true)
    expect(settled.values.every(({ medal, finalMedal }) => medal === finalMedal))
      .toBe(true)
    expect(settled.values.map(({ totalXp }) => totalXp)).toEqual(
      progressing.values.map(({ totalXp }) => totalXp),
    )
    expect(settled.profileXp).toBe(progressing.profileXp)
    expect(results.presentationDurationMs).toBe(3_700)
  })

  it("reveals first medals even when the ranked card does not change position", () => {
    const entry = createInitialBattleProfile("results-stationary-first-medal")
    const progressById = new Map(entry.progressById)
    progressById.set(entry.activeDeck.valueIds[0], {
      totalXp: 4,
      profileWins: 1,
      profileComparisons: 1,
      currentCycleWins: 1,
    })
    const results = createBattleExitResults(entry, { ...entry, progressById })!
    expect(results.values[0]).toMatchObject({ entryRank: 1, exitRank: 1 })
    for (const [elapsedMs, medal] of [
      [0, null],
      [50, "bronze"],
      [700, "silver"],
      [1_600, "gold"],
    ] as const)
      expect(projectBattleExitResultsFrame(results, elapsedMs).values[0])
        .toMatchObject({ rank: 1, medal, finalMedal: "gold" })
  })

  it("removes medals when Undo returns to an unranked profile", () => {
    const entry = createInitialBattleProfile("results-undo-ranking-medals")
    const [winnerId] = projectBattlePair(entry.activeDeck, entry.scheduler)
    const { profile: exit } = applyBattleChoice({
      profile: entry,
      winnerId,
      expectedScheduler: entry.scheduler,
    })
    const undone = applyBattleUndo(exit)!
    const undoResults = createBattleExitResults(exit, undone.profile)!
    expect(undoResults.hasExitRanking).toBe(false)
    expect(
      projectBattleExitResultsFrame(undoResults, 0).values.some(
        ({ medal }) => medal === "gold",
      ),
    ).toBe(true)
    for (const frame of [
      projectBattleExitResultsFrame(undoResults, 3_700),
      projectBattleExitResultsFrame(undoResults, 925, 925, true),
    ])
      expect(
        frame.values.every(
          ({ medal, finalMedal }) => medal === null && finalMedal === null,
        ),
      ).toBe(true)
  })

  it("keeps unchanged standings quiet while XP progresses", () => {
    const { entry, exit } = createRankedProfiles(1)
    const results = createBattleExitResults(entry, exit)!
    const start = projectBattleExitResultsFrame(results, 0)
    for (const elapsedMs of [925, 1_850, 3_700])
      expect(
        projectBattleExitResultsFrame(results, elapsedMs).values.map(
          ({ rank, medal }) => ({ rank, medal }),
        ),
      ).toEqual(start.values.map(({ rank, medal }) => ({ rank, medal })))
    expect(
      projectBattleExitResultsFrame(results, 925).profileXp,
    ).toBeGreaterThan(start.profileXp)
  })
})
