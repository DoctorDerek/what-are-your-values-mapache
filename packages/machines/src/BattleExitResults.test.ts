import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { createCustomValueId } from "@game/data/src/Value"
import { createInitialValueProgress } from "@game/data/src/ValueProgress"
import { MAX_SUPPORTED_TOTAL_XP } from "@game/utils/src/LevelMath"
import { describe, expect, it } from "vitest"
import {
  BATTLE_RESULTS_PRESENTATION_STEPS,
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
    expect(results.values[0]?.definition.id).toBe(winnerId)
    expect(results.values[0]?.exitRank).toBe(1)
    expect(projectBattleExitResultsFrame(results, 0).profileXp).toBe(0n)
    const firstFill = projectBattleExitResultsFrame(results, 5)
    const firstBoundary = projectBattleExitResultsFrame(results, 10)
    const secondFill = projectBattleExitResultsFrame(results, 15)
    const winnerAt = (step: number) =>
      projectBattleExitResultsFrame(results, step).values.find(
        ({ value }) => value.definition.id === winnerId,
      )
    expect(firstFill.profileLevelProgress.level).toBe(1n)
    expect(firstFill.profileLevelBarPercentage).toBe(50)
    expect(winnerAt(5)?.levelBarPercentage).toBe(50)
    expect(firstBoundary.profileLevelProgress.level).toBe(2n)
    expect(firstBoundary.profileLevelBarPercentage).toBe(0)
    expect(firstBoundary.profileDidCrossLevel).toBe(true)
    expect(winnerAt(10)?.didCrossLevel).toBe(true)
    expect(secondFill.profileLevelProgress.level).toBe(2n)
    expect(secondFill.profileLevelBarPercentage).toBe(50)
    expect(
      firstFill.values
        .filter(({ value }) => !value.changed)
        .every(
          ({ levelBarPercentage, didCrossLevel }) =>
            levelBarPercentage === 0 && !didCrossLevel,
        ),
    ).toBe(true)
    expect(
      projectBattleExitResultsFrame(results, BATTLE_RESULTS_PRESENTATION_STEPS)
        .profileXp,
    ).toBe(4n)
    expect(
      projectBattleExitResultsFrame(results, BATTLE_RESULTS_PRESENTATION_STEPS)
        .profileLevelProgress.level,
    ).toBe(3n)
    expect(
      projectBattleExitResultsFrame(
        results,
        BATTLE_RESULTS_PRESENTATION_STEPS,
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
    const descending = projectBattleExitResultsFrame(results, 5)
    expect(descending.profileXp).toBe(3n)
    expect(descending.profileLevelProgress.level).toBe(2n)
    expect(descending.profileLevelBarPercentage).toBe(50)
    expect(
      projectBattleExitResultsFrame(results, BATTLE_RESULTS_PRESENTATION_STEPS)
        .profileXp,
    ).toBe(0n)
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
      projectBattleExitResultsFrame(results, BATTLE_RESULTS_PRESENTATION_STEPS)
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
    expect(projectBattleExitResultsFrame(changed, 5).profileXp).toBe(
      BigInt(MAX_SUPPORTED_TOTAL_XP) * 80n + 1n,
    )
    expect(
      projectBattleExitResultsFrame(changed, BATTLE_RESULTS_PRESENTATION_STEPS)
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

    expect(results?.values).toHaveLength(101)
    expect(
      results?.values.find(({ definition }) => definition.id === customValueId)
        ?.definition,
    ).toMatchObject({ name: "Ingenuity in every curious experiment" })
  })
})
