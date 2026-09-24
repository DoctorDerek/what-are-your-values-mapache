import {
  SEETHING_SWARM_BATTLE_FRAME_DURATION_MS,
  SEETHING_SWARM_BATTLE_TILE_SIZE,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { ValueId } from "@game/data/src/Value"
import type {
  SeethingSwarmBattleChoreography,
  SeethingSwarmBattleCombatantSide,
} from "./SeethingSwarmBattleChoreography"

export const SEETHING_SWARM_BATTLE_APPROACH_DURATION_MS = 160

export function requiresSeethingSwarmReturnTravel<Asset>(
  choreography: SeethingSwarmBattleChoreography<Asset>,
  winnerId: ValueId | null,
) {
  return choreography.mode === "licensed" && choreography.combatants.some(
    (combatant) => combatant.valueId === winnerId && combatant.locomotion.animationId !== "fly_forward",
  )
}

export function resolveSeethingSwarmTravelDuration<Asset>(
  choreography: SeethingSwarmBattleChoreography<Asset>,
  winnerId: ValueId | null,
) {
  if (choreography.mode !== "licensed")
    return SEETHING_SWARM_BATTLE_APPROACH_DURATION_MS
  const winner = choreography.combatants.find(
    (combatant) => combatant.valueId === winnerId,
  )
  return winner
    ? winner.locomotion.frameCount * SEETHING_SWARM_BATTLE_FRAME_DURATION_MS
    : SEETHING_SWARM_BATTLE_APPROACH_DURATION_MS
}

export type SeethingSwarmBattleExchangeCue =
  | "introduction"
  | "attention"
  | "rest"
  | "approach"
  | "strike"
  | "impact"
  | "recovery"
  | "settled"

export type SeethingSwarmBattlePoint = Readonly<{ x: number; y: number }>

export function resolveSeethingSwarmPlaceholderRole(
  cue: SeethingSwarmBattleExchangeCue,
  isWinner: boolean,
) {
  if (cue === "strike" && isWinner) return "attack"
  if (cue === "impact") return isWinner ? "flourish" : "reaction"
  return "rest"
}

export function createSeethingSwarmBattleTravel({
  attacker,
  defender,
  attackerSide,
  combatantWidth = SEETHING_SWARM_BATTLE_TILE_SIZE,
}: {
  readonly attacker: SeethingSwarmBattlePoint
  readonly defender: SeethingSwarmBattlePoint
  readonly attackerSide: SeethingSwarmBattleCombatantSide
  readonly combatantWidth?: number
}): SeethingSwarmBattlePoint {
  const distanceX = defender.x - attacker.x
  const distanceY = defender.y - attacker.y
  const contactDistance = (combatantWidth * 3) / 4

  return Object.freeze({
    x: Math.round(
      distanceX +
        (attackerSide === "first" ? -contactDistance : contactDistance),
    ),
    y: Math.round(distanceY),
  })
}
