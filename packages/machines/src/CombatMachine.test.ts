import { describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"
import {
  createBattleCycleCandidate,
  createInitialBattleCycle,
  type BattleCycleState,
} from "./BattleCycle"
import { projectBattlePair } from "./BattleScheduler"
import { combatMachine, type PresentedBattle } from "./CombatMachine"

function projectBattle(battleCycle: BattleCycleState): PresentedBattle {
  return Object.freeze({
    pair: projectBattlePair(battleCycle.activeDeck, battleCycle.scheduler),
    scheduler: battleCycle.scheduler,
  })
}

describe("Combat Machine", () => {
  it("freezes numerical rate, ignores same-pair save projections and latches Skip until accepted next pair", () => {
    const cycle = createInitialBattleCycle("speed-boundary")
    const battle = projectBattle(cycle)
    const onWinnerSelected = vi.fn()
    const actor = createActor(combatMachine, {
      input: { initialBattle: battle, animationSpeed: "2x", onWinnerSelected },
    }).start()
    actor.send({ type: "VALUE.WINNER_SELECTED", valueId: battle.pair[0] })
    actor.send({ type: "BATTLE.SPEED_CHANGED", speed: "3x" })
    expect(actor.getSnapshot().context.activeAnimationSpeed).toBe("2x")
    actor.send({ type: "BATTLE.PROJECTED", battle: { ...battle } })
    expect(actor.getSnapshot().context.pendingBattle).toBeNull()
    actor.send({ type: "BATTLE.SPEED_CHANGED", speed: "skip" })
    actor.send({ type: "BATTLE.SPEED_CHANGED", speed: "1x" })
    expect(actor.getSnapshot().context.shouldSkipCurrentAnimation).toBe(true)
    expect(actor.getSnapshot().matches("AnimatingResult")).toBe(true)
    const next = projectBattle(
      createBattleCycleCandidate({
        battleCycle: cycle,
        winnerId: battle.pair[0],
        expectedScheduler: battle.scheduler,
      }),
    )
    actor.send({ type: "BATTLE.PROJECTED", battle: next })
    actor.send({ type: "ANIMATION.RESULT_FINISHED" })
    actor.send({ type: "ANIMATION.RESULT_FINISHED" })
    expect(actor.getSnapshot().context.currentBattle).toBe(next)
    expect(actor.getSnapshot().context.shouldSkipCurrentAnimation).toBe(false)
    expect(onWinnerSelected).toHaveBeenCalledTimes(1)
    actor.send({ type: "VALUE.WINNER_SELECTED", valueId: next.pair[0] })
    expect(actor.getSnapshot().context.activeAnimationSpeed).toBe("1x")
    actor.stop()
  })
  it("accepts one semantic winner while rejecting rapid duplicate input", () => {
    const onWinnerSelected = vi.fn()
    const battleCycle = createInitialBattleCycle("combat-selection-seed")
    const battle = projectBattle(battleCycle)
    const [winnerId] = battle.pair
    const actor = createActor(combatMachine, {
      input: { initialBattle: battle, onWinnerSelected },
    })
    expect(actor.getSnapshot().context.currentBattle).toBe(battle)
    expect(actor.getSnapshot().matches("AwaitingInput")).toBe(true)
    actor.start()

    expect(actor.getSnapshot().matches("AwaitingInput")).toBe(true)
    actor.send({ type: "VALUE.FOCUS_REQUESTED", valueId: winnerId })
    expect(actor.getSnapshot().context.focusedId).toBe(winnerId)

    actor.send({ type: "VALUE.WINNER_SELECTED", valueId: winnerId })
    actor.send({ type: "VALUE.WINNER_SELECTED", valueId: winnerId })

    expect(actor.getSnapshot().matches("AnimatingResult")).toBe(true)
    expect(actor.getSnapshot().context.winnerId).toBe(winnerId)
    expect(onWinnerSelected).toHaveBeenCalledTimes(1)
    expect(onWinnerSelected).toHaveBeenCalledWith(
      winnerId,
      battleCycle.scheduler,
    )
  })

  it("holds the next projection until result animation completes", () => {
    const onWinnerSelected = vi.fn()
    const battleCycle = createInitialBattleCycle("combat-animation-seed")
    const currentBattle = projectBattle(battleCycle)
    const [winnerId] = currentBattle.pair
    const nextBattleCycle = createBattleCycleCandidate({
      battleCycle,
      winnerId,
      expectedScheduler: battleCycle.scheduler,
    })
    const nextBattle = projectBattle(nextBattleCycle)
    const actor = createActor(combatMachine, {
      input: { initialBattle: currentBattle, onWinnerSelected },
    })
    actor.start()
    actor.send({ type: "VALUE.WINNER_SELECTED", valueId: winnerId })
    actor.send({ type: "BATTLE.PROJECTED", battle: nextBattle })

    expect(actor.getSnapshot().context.currentBattle).toBe(currentBattle)
    expect(actor.getSnapshot().context.pendingBattle).toBe(nextBattle)

    actor.send({ type: "ANIMATION.RESULT_FINISHED" })

    expect(actor.getSnapshot().matches("AwaitingInput")).toBe(true)
    expect(actor.getSnapshot().context.currentBattle).toBe(nextBattle)
    expect(actor.getSnapshot().context.pendingBattle).toBeNull()
    expect(actor.getSnapshot().context.winnerId).toBeNull()
  })

  it("waits for a projection when animation finishes before Root advances", () => {
    const onWinnerSelected = vi.fn()
    const battleCycle = createInitialBattleCycle("delayed-projection-seed")
    const battle = projectBattle(battleCycle)
    const actor = createActor(combatMachine, {
      input: { initialBattle: battle, onWinnerSelected },
    })
    actor.start()
    actor.send({
      type: "VALUE.WINNER_SELECTED",
      valueId: battle.pair[0],
    })
    actor.send({ type: "ANIMATION.RESULT_FINISHED" })

    expect(actor.getSnapshot().matches("Preparing")).toBe(true)
    expect(actor.getSnapshot().context.currentBattle).toBe(battle)
    actor.send({ type: "VALUE.WINNER_SELECTED", valueId: battle.pair[0] })
    actor.send({ type: "VALUE.FOCUS_REQUESTED", valueId: battle.pair[1] })
    expect(onWinnerSelected).toHaveBeenCalledTimes(1)
    expect(actor.getSnapshot().context.focusedId).toBeNull()

    const nextBattle = projectBattle(
      createBattleCycleCandidate({
        battleCycle,
        winnerId: battle.pair[0],
        expectedScheduler: battle.scheduler,
      }),
    )
    actor.send({ type: "BATTLE.PROJECTED", battle: nextBattle })
    expect(actor.getSnapshot().matches("AwaitingInput")).toBe(true)
    expect(actor.getSnapshot().context.currentBattle).toBe(nextBattle)
  })
})
