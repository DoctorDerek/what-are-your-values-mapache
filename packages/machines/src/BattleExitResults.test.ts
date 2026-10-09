import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { createCustomValueId } from "@game/data/src/Value"
import { createInitialValueProgress } from "@game/data/src/ValueProgress"
import { MAX_SUPPORTED_TOTAL_XP } from "@game/utils/src/LevelMath"
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

describe("Battle-exit Results", () => {
  it("keeps final XP-ranked paint priority stable through fills and position settlement", () => {
    const entry = createInitialBattleProfile("results-stacking-order")
    const progressById = new Map(entry.progressById)
    for (const valueId of entry.activeDeck.valueIds.slice(74, 76)) {
      progressById.set(valueId, {
        ...progressById.get(valueId)!,
        totalXp: 12,
        profileWins: 3,
        profileComparisons: 3,
      })
    }
    const results = createBattleExitResults(entry, { ...entry, progressById })!
    for (const elapsedMs of [0, 1_850, 3_700, results.presentationDurationMs]) {
      for (const arePositionsSettled of [false, true]) {
        const frame = projectBattleExitResultsFrame(
          results,
          elapsedMs,
          elapsedMs,
          arePositionsSettled,
        )
        expect(frame.values.map(({ stackingOrder }) => stackingOrder)).toEqual(
          results.values.map(
            ({ exitRank }) => results.values.length + 1 - exitRank,
          ),
        )
        expect(frame.values.map(({ value }) => value.definition.id)).toEqual(
          results.values.map(({ definition }) => definition.id),
        )
      }
    }
    expect(projectBattleExitResultsFrame(results, 0).values[0]?.totalXp).toBe(0)
    expect(results.values[0]?.exitProgress.totalXp).toBe(12)
  })

  it("stages a distant promotion visibly from entry XP and settles only its position", () => {
    const entry = createInitialBattleProfile("results-distant-promotion")
    const valueId = entry.activeDeck.valueIds[74]!
    const progressById = new Map(entry.progressById)
    progressById.set(valueId, {
      ...progressById.get(valueId)!,
      totalXp: 12,
      profileWins: 3,
      profileComparisons: 3,
    })
    const results = createBattleExitResults(entry, { ...entry, progressById })!
    const start = projectBattleExitResultsFrame(results, 0)
    const midway = projectBattleExitResultsFrame(results, 1_850)
    const settled = projectBattleExitResultsFrame(results, 1_850, 1_850, true)
    expect(start.values[0]?.value.definition.id).toBe(valueId)
    expect(start.values[0]?.value.entryRank).toBe(75)
    expect(start.values[0]?.totalXp).toBe(0)
    expect(start.values[0]?.motion.travel).toBe(0)
    expect(start.values[0]?.rank).toBe(75)
    expect(midway.values[0]?.motion.travel).toBeGreaterThan(0.5)
    expect(midway.values[0]?.motion.lateralPercentage).toBe(5)
    expect(midway.values[0]?.rank).toBe(20)
    expect(midway.values[0]?.rankLabelPlaceholder).toBe("#103")
    for (const elapsedMs of [0, 925, 1_850, 2_775, 3_700]) {
      const frame = projectBattleExitResultsFrame(results, elapsedMs)
      for (const { rank, value } of frame.values) {
        expect(rank).toBe(
          value.entryRank +
            Math.trunc(
              (value.exitRank - value.entryRank) *
                (1 - (1 - elapsedMs / 3_700) ** 2),
            ),
        )
      }
    }
    expect(settled.values[0]?.motion.travel).toBe(1)
    expect(settled.values[0]?.rank).toBe(1)
    expect(settled.values[0]?.totalXp).toBe(midway.values[0]?.totalXp)
    const sortComplete = projectBattleExitResultsFrame(results, 3_700)
    expect(sortComplete.values.every(({ motion }) => motion.travel === 1)).toBe(
      true,
    )
    expect(sortComplete.values[0]?.totalXp).toBeLessThan(12)
    const nearlyComplete = projectBattleExitResultsFrame(results, 3_699)
    expect(
      nearlyComplete.values
        .filter(({ value }) => value.entryRank !== value.exitRank)
        .every(({ rank, value }) => rank !== value.exitRank),
    ).toBe(true)
    expect(
      sortComplete.values.every(({ rank, value }) => rank === value.exitRank),
    ).toBe(true)
    expect(
      start.values
        .filter(({ value }) => value.entryRank === value.exitRank)
        .every(
          ({ motion }) => motion.lateralPercentage === 0 && motion.scale === 1,
        ),
    ).toBe(true)
  })

  it("compares only committed entry and exit profiles using the canonical ranking", () => {
    const entry = createInitialBattleProfile("results-choice-seed")
    const [winnerId] = projectBattlePair(entry.activeDeck, entry.scheduler)
    const committed = applyBattleChoice({
      profile: entry,
      winnerId,
      expectedScheduler: entry.scheduler,
    })
    const results = createBattleExitResults(entry, committed.profile)
    if (!results) throw new Error("Results projection was unavailable")

    expect(results.hasChanges).toBe(true)
    expect(results.entryProfileXp).toBe(0n)
    expect(results.exitProfileXp).toBe(4n)
    expect(results.profileXpChange).toBe(4n)
    expect(results.presentationDurationMs).toBe(3_700)
    expect(results.profilePresentationDurationMs).toBe(3_700)
    expect(results.values[0]?.presentationDurationMs).toBe(3_700)
    expect(results.values[0]?.definition.id).toBe(winnerId)
    expect(results.values[0]?.exitRank).toBe(1)
    expect(projectBattleExitResultsFrame(results, 0).profileXp).toBe(0n)
    const firstFill = projectBattleExitResultsFrame(results, 925)
    const firstBoundary = projectBattleExitResultsFrame(results, 1_850, 1_800)
    const secondFill = projectBattleExitResultsFrame(results, 2_775)
    const winnerAt = (elapsedMs: number, previousElapsedMs = elapsedMs) =>
      projectBattleExitResultsFrame(
        results,
        elapsedMs,
        previousElapsedMs,
      ).values.find(({ value }) => value.definition.id === winnerId)
    expect(firstFill.profileLevelProgress.level).toBe(1n)
    expect(firstFill.profileLevelBarPercentage).toBe(75)
    expect(winnerAt(925)?.levelBarPercentage).toBe(75)
    expect(firstBoundary.profileLevelProgress.level).toBe(2n)
    expect(firstBoundary.profileLevelBarPercentage).toBe(0)
    expect(firstBoundary.profileDidCrossLevel).toBe(true)
    expect(winnerAt(1_850, 1_800)?.didCrossLevel).toBe(true)
    expect(secondFill.profileLevelProgress.level).toBe(2n)
    expect(secondFill.profileLevelBarPercentage).toBe(75)
    expect(
      firstFill.values
        .filter(({ value }) => !value.changed)
        .every(
          ({ levelBarPercentage, didCrossLevel }) =>
            levelBarPercentage === 0 && !didCrossLevel,
        ),
    ).toBe(true)
    expect(
      projectBattleExitResultsFrame(results, results.presentationDurationMs)
        .profileXp,
    ).toBe(4n)
    expect(
      projectBattleExitResultsFrame(results, results.presentationDurationMs)
        .profileLevelProgress.level,
    ).toBe(3n)
    expect(
      projectBattleExitResultsFrame(
        results,
        results.presentationDurationMs,
      ).values.map(({ value }) => value.definition.id),
    ).toEqual(results.values.map(({ definition }) => definition.id))
  })

  it("does not invent a result after Undo returns the profile to entry", () => {
    const entry = createInitialBattleProfile("results-undo-seed")
    const [winnerId] = projectBattlePair(entry.activeDeck, entry.scheduler)
    const committed = applyBattleChoice({
      profile: entry,
      winnerId,
      expectedScheduler: entry.scheduler,
    })
    const undone = applyBattleUndo(committed.profile)
    if (!undone) throw new Error("Undo was unavailable")

    const results = createBattleExitResults(entry, undone.profile)
    expect(results?.hasChanges).toBe(false)
    expect(results?.profileXpChange).toBe(0n)
  })

  it("keeps a truthful negative aggregate when exiting after an Undo", () => {
    const entry = createInitialBattleProfile("results-negative-seed")
    const [winnerId] = projectBattlePair(entry.activeDeck, entry.scheduler)
    const committed = applyBattleChoice({
      profile: entry,
      winnerId,
      expectedScheduler: entry.scheduler,
    })
    const undone = applyBattleUndo(committed.profile)
    if (!undone) throw new Error("Undo was unavailable")

    const results = createBattleExitResults(committed.profile, undone.profile)
    expect(results?.hasChanges).toBe(true)
    expect(results?.profileXpChange).toBe(-4n)
    if (!results) throw new Error("Negative Results projection was unavailable")
    const descending = projectBattleExitResultsFrame(results, 925)
    expect(descending.profileXp).toBe(2n)
    expect(descending.profileLevelProgress.level).toBe(2n)
    expect(descending.profileLevelBarPercentage).toBe(25)
    expect(
      projectBattleExitResultsFrame(results, results.presentationDurationMs)
        .profileXp,
    ).toBe(0n)
  })

  it("slows each short gain across the minimum without adding a static hold", () => {
    const entry = createInitialBattleProfile("results-short-fill-seed")
    const [valueId] = entry.activeDeck.valueIds
    if (!valueId) throw new Error("Short-fill fixture is incomplete")
    const progressById = new Map(entry.progressById)
    const initialProgress = progressById.get(valueId)
    if (!initialProgress) throw new Error("Short-fill progress is missing")
    progressById.set(valueId, { ...initialProgress, totalXp: 4 })
    const results = createBattleExitResults(entry, {
      ...entry,
      progressById,
    })
    if (!results) throw new Error("Short-fill Results were unavailable")

    expect(results.presentationDurationMs).toBe(3_700)
    expect(results.profilePresentationDurationMs).toBe(3_700)
    expect(
      results.values.find(({ definition }) => definition.id === valueId)
        ?.presentationDurationMs,
    ).toBe(3_700)
    expect(
      projectBattleExitResultsFrame(results, 925).profileLevelBarPercentage,
    ).toBe(75)
    expect(
      projectBattleExitResultsFrame(results, 3_650).profileLevelBarPercentage,
    ).toBeGreaterThan(95)
    expect(
      projectBattleExitResultsFrame(results, 3_650).profileLevelBarPercentage,
    ).toBeLessThan(100)
    expect(projectBattleExitResultsFrame(results, 3_700).profileXp).toBe(4n)
  })

  it("extends a large gain beyond the minimum while shorter rows settle concurrently", () => {
    const entry = createInitialBattleProfile("results-long-fill-seed")
    const [longValueId, shortValueId] = entry.activeDeck.valueIds
    if (!longValueId || !shortValueId)
      throw new Error("Long-fill fixture is incomplete")
    const progressById = new Map(entry.progressById)
    const longProgress = progressById.get(longValueId)
    const shortProgress = progressById.get(shortValueId)
    if (!longProgress || !shortProgress)
      throw new Error("Long-fill progress is missing")
    progressById.set(longValueId, { ...longProgress, totalXp: 12 })
    progressById.set(shortValueId, { ...shortProgress, totalXp: 4 })
    const results = createBattleExitResults(entry, {
      ...entry,
      progressById,
    })
    if (!results) throw new Error("Long-fill Results were unavailable")

    expect(results.profilePresentationDurationMs).toBe(7_650)
    expect(
      results.values.find(({ definition }) => definition.id === shortValueId)
        ?.presentationDurationMs,
    ).toBe(3_700)
    expect(results.presentationDurationMs).toBe(7_650)
    const midway = projectBattleExitResultsFrame(results, 1_800)
    expect(
      midway.values.find(({ value }) => value.definition.id === shortValueId)
        ?.totalXp,
    ).toBeLessThan(4)
    expect(
      midway.values.find(({ value }) => value.definition.id === longValueId)
        ?.totalXp,
    ).toBeLessThan(12)
    const minimumComplete = projectBattleExitResultsFrame(results, 3_700)
    expect(
      minimumComplete.values.find(
        ({ value }) => value.definition.id === shortValueId,
      )?.totalXp,
    ).toBe(4)
    expect(
      minimumComplete.values.find(
        ({ value }) => value.definition.id === longValueId,
      )?.totalXp,
    ).toBeLessThan(12)
    expect(
      minimumComplete.values.map(({ value }) => value.definition.id),
    ).toEqual(results.values.map(({ definition }) => definition.id))
    expect(
      projectBattleExitResultsFrame(results, 7_600).profileXp,
    ).toBeLessThan(16n)
    expect(projectBattleExitResultsFrame(results, 7_650).profileXp).toBe(16n)
  })

  it("uses only the reorder motion when ranks change without XP", () => {
    const initial = createInitialBattleProfile("results-rank-only-seed")
    const [firstValueId, valueId] = initial.activeDeck.valueIds
    if (!firstValueId || !valueId)
      throw new Error("Rank-only fixture is incomplete")
    const entryProgressById = new Map(initial.progressById)
    const tiedProgress = {
      totalXp: 4,
      profileWins: 1,
      profileComparisons: 1,
      currentCycleWins: 0,
    }
    entryProgressById.set(firstValueId, tiedProgress)
    entryProgressById.set(valueId, tiedProgress)
    const entry = { ...initial, progressById: entryProgressById }
    const exitProgressById = new Map(entryProgressById)
    exitProgressById.set(valueId, { ...tiedProgress, currentCycleWins: 1 })
    const results = createBattleExitResults(entry, {
      ...entry,
      progressById: exitProgressById,
    })
    if (!results) throw new Error("Rank-only Results were unavailable")

    expect(results.presentationDurationMs).toBe(3_700)
    expect(results.profilePresentationDurationMs).toBe(0)
    expect(
      results.values.every(
        ({ presentationDurationMs }) => presentationDurationMs === 0,
      ),
    ).toBe(true)
    expect(
      projectBattleExitResultsFrame(results, 0).values[0]?.value.definition.id,
    ).toBe(valueId)
    expect(
      projectBattleExitResultsFrame(results, 50).values[0]?.value.definition.id,
    ).toBe(valueId)
    expect(projectBattleExitResultsFrame(results, 3_700).profileXp).toBe(8n)
    expect(
      projectBattleExitResultsFrame(results, 0, 0, true).values[0]?.value
        .definition.id,
    ).toBe(valueId)
  })

  it("preserves partial-span pacing and XP when row positions settle", () => {
    const initial = createInitialBattleProfile("results-partial-span-seed")
    const [valueId] = initial.activeDeck.valueIds
    if (!valueId) throw new Error("Partial-span fixture is incomplete")
    const progressById = new Map(initial.progressById)
    const progress = progressById.get(valueId)
    if (!progress) throw new Error("Partial-span progress is missing")
    progressById.set(valueId, { ...progress, totalXp: 8 })
    const entry = { ...initial, progressById }
    const exitProgressById = new Map(progressById)
    exitProgressById.set(valueId, { ...progress, totalXp: 12 })
    const results = createBattleExitResults(entry, {
      ...entry,
      progressById: exitProgressById,
    })
    if (!results) throw new Error("Partial-span Results were unavailable")
    expect(results.presentationDurationMs).toBe(3_700)
    expect(results.profilePresentationDurationMs).toBe(3_700)
    const moving = projectBattleExitResultsFrame(results, 1_850, 1_800)
    const settled = projectBattleExitResultsFrame(results, 1_850, 1_800, true)
    expect(settled.profileXp).toBe(moving.profileXp)
    expect(settled.profileLevelBarPercentage).toBe(
      moving.profileLevelBarPercentage,
    )
    expect(settled.values.map(({ totalXp }) => totalXp)).toEqual(
      moving.values.map(({ totalXp }) => totalXp),
    )
    expect(settled.profileLevelBarPercentage).toBe(43.75)
    expect(
      settled.values.find(({ value }) => value.definition.id === valueId)
        ?.levelBarPercentage,
    ).toBe(43.75)
    expect(
      projectBattleExitResultsFrame(results, 3_650).profileLevelBarPercentage,
    ).toBeLessThan(50)
    expect(
      projectBattleExitResultsFrame(results, 3_700).profileLevelBarPercentage,
    ).toBe(50)
    expect(
      results.values
        .filter(({ definition }) => definition.id !== valueId)
        .every(({ presentationDurationMs }) => presentationDurationMs === 0),
    ).toBe(true)
    expect(projectBattleExitResultsFrame(results, 0, 0, true).profileXp).toBe(
      8n,
    )
  })

  it("sums supported per-value totals without Number aggregate precision loss", () => {
    const entry = createInitialBattleProfile("results-large-aggregate-seed")
    const progressById = new Map(entry.progressById)
    for (const valueId of entry.activeDeck.valueIds.slice(0, 80)) {
      progressById.set(valueId, {
        totalXp: MAX_SUPPORTED_TOTAL_XP,
        profileWins: 0,
        profileComparisons: 0,
        currentCycleWins: 0,
      })
    }
    const largeProfile = Object.freeze({ ...entry, progressById })
    const results = createBattleExitResults(largeProfile, largeProfile)
    if (!results) throw new Error("Large aggregate Results were unavailable")
    expect(results.entryProfileXp).toBe(BigInt(MAX_SUPPORTED_TOTAL_XP) * 80n)
    expect(
      projectBattleExitResultsFrame(results, results.presentationDurationMs)
        .profileXp,
    ).toBe(BigInt(MAX_SUPPORTED_TOTAL_XP) * 80n)

    const nextValueId = entry.activeDeck.valueIds[80]
    if (!nextValueId) throw new Error("Large aggregate fixture is incomplete")
    const exitProgressById = new Map(progressById)
    exitProgressById.set(nextValueId, {
      totalXp: 4,
      profileWins: 1,
      profileComparisons: 1,
      currentCycleWins: 1,
    })
    const changed = createBattleExitResults(largeProfile, {
      ...largeProfile,
      progressById: exitProgressById,
    })
    if (!changed) throw new Error("Large aggregate change was unavailable")
    expect(projectBattleExitResultsFrame(changed, 925).profileXp).toBe(
      BigInt(MAX_SUPPORTED_TOTAL_XP) * 80n + 1n,
    )
    expect(
      projectBattleExitResultsFrame(changed, changed.presentationDurationMs)
        .profileXp,
    ).toBe(BigInt(MAX_SUPPORTED_TOTAL_XP) * 80n + 4n)
  })

  it("refuses to compare different Active Deck membership", () => {
    const entry = createInitialBattleProfile("results-deck-seed")
    const changedDeck = Object.freeze({
      ...entry.activeDeck,
      valueIds: entry.activeDeck.valueIds.slice(1),
    })
    expect(
      createBattleExitResults(entry, { ...entry, activeDeck: changedDeck }),
    ).toBeNull()
  })

  it("includes a new Custom Value in the same full-roster projection", () => {
    const customValueId = createCustomValueId(
      "custom:00000000-0000-4000-8000-000000000330",
    )
    const activeDeck = createActiveDeck([
      {
        kind: "custom",
        id: customValueId,
        name: "Ingenuity in every curious experiment",
        definition: "to find thoughtful new ways forward",
        creationOrdinal: 1,
        createdAt: "2026-09-29T00:00:00.000Z",
        updatedAt: "2026-09-29T00:00:00.000Z",
      },
    ])
    const initial = createInitialBattleProfile("results-custom-seed")
    const entry = Object.freeze({
      ...initial,
      activeDeck,
      progressById: createInitialValueProgress(activeDeck),
    })
    const results = createBattleExitResults(entry, entry)

    expect(results?.values).toHaveLength(104)
    expect(
      results?.values.find(({ definition }) => definition.id === customValueId)
        ?.definition,
    ).toMatchObject({ name: "Ingenuity in every curious experiment" })
  })
})
