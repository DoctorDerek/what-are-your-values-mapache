import { readTuple } from "./PersistenceValidation"
import {
  FULL_CYCLE_SCHEDULE_KIND,
  JOIN_PASS_SCHEDULE_KIND,
  PAIR_SCHEDULER_ALGORITHM_VERSION,
  type ScheduleKind,
  type SchedulerIdentity,
} from "./SchedulerIdentity"

declare const battleIdBrand: unique symbol
declare const cycleCompleteEventIdBrand: unique symbol

export type BattleId = string & {
  readonly [battleIdBrand]: "battle"
}

export type CycleCompleteEventId = string & {
  readonly [cycleCompleteEventIdBrand]: "cycle-complete-event"
}

export function createBattleId(scheduler: SchedulerIdentity<ScheduleKind>) {
  return JSON.stringify([
    "battle-v1",
    scheduler.progressGeneration,
    scheduler.deckRevision,
    scheduler.activeDeckFingerprint,
    scheduler.algorithmVersion,
    scheduler.scheduleKind,
    scheduler.cycleIndex,
    scheduler.cursor,
  ]) as BattleId
}

export function readBattleId(value: unknown, label: string) {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${label}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error(`Invalid ${label}`)
  }

  const [
    format,
    progressGeneration,
    deckRevision,
    activeDeckFingerprint,
    algorithmVersion,
    scheduleKind,
    cycleIndex,
    cursor,
  ] = readTuple(parsed, 8, label)
  if (
    format !== "battle-v1" ||
    typeof progressGeneration !== "number" ||
    !Number.isSafeInteger(progressGeneration) ||
    progressGeneration < 0 ||
    typeof deckRevision !== "number" ||
    !Number.isSafeInteger(deckRevision) ||
    deckRevision < 0 ||
    typeof activeDeckFingerprint !== "string" ||
    activeDeckFingerprint.length === 0 ||
    algorithmVersion !== PAIR_SCHEDULER_ALGORITHM_VERSION ||
    (scheduleKind !== FULL_CYCLE_SCHEDULE_KIND &&
      scheduleKind !== JOIN_PASS_SCHEDULE_KIND) ||
    typeof cycleIndex !== "number" ||
    !Number.isSafeInteger(cycleIndex) ||
    cycleIndex < 0 ||
    typeof cursor !== "number" ||
    !Number.isSafeInteger(cursor) ||
    cursor < 0 ||
    JSON.stringify(parsed) !== value
  ) {
    throw new Error(`Invalid ${label}`)
  }

  return value as BattleId
}

export function createCycleCompleteEventId(battleId: BattleId) {
  return JSON.stringify(["cycle-complete-v1", battleId]) as CycleCompleteEventId
}
