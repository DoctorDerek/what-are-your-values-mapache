export const BATTLE_ANIMATION_SPEED_MODES = ["1x", "2x", "3x", "skip"] as const
export type BattleAnimationSpeed = (typeof BATTLE_ANIMATION_SPEED_MODES)[number]
export const DEFAULT_BATTLE_ANIMATION_SPEED: BattleAnimationSpeed = "1x"

export function scaleBattleAnimationDuration(
  durationMs: number,
  speed: BattleAnimationSpeed,
): number {
  return durationMs / (speed === "3x" ? 3 : speed === "2x" ? 2 : 1)
}
