export const BATTLE_RESULTS_REORDER_MOTION_MS = 3_700

export type BattleExitResultsMotion = {
  readonly travel: number
  readonly lateralPercentage: number
  readonly scale: number
}

function smoothTravel(progress: number) {
  return progress * progress * (3 - 2 * progress)
}

export function projectBattleExitResultsMotion(
  entryRank: number,
  exitRank: number,
  elapsedMs: number,
  arePositionsSettled: boolean,
): BattleExitResultsMotion {
  const phase = arePositionsSettled
    ? 1
    : Math.min(elapsedMs / BATTLE_RESULTS_REORDER_MOTION_MS, 1)
  const isPromoted = exitRank < entryRank
  const hasMoved = entryRank !== exitRank
  const lift = phase === 1 ? 0 : Math.sin(Math.PI * phase)
  const travel = smoothTravel(
    isPromoted ? (exitRank === 1 ? 1 - (1 - phase) ** 2 : phase ** 1.3) : phase,
  )

  return Object.freeze({
    travel,
    lateralPercentage: hasMoved ? lift * (isPromoted ? 5 : -5) : 0,
    scale: hasMoved ? 1 - lift * 0.045 : 1,
  })
}
