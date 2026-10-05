export const BATTLE_ANIMATION_SPEED_MODES = ["1x", "2x", "3x", "skip"] as const
export type BattleAnimationSpeed = (typeof BATTLE_ANIMATION_SPEED_MODES)[number]
export const DEFAULT_BATTLE_ANIMATION_SPEED: BattleAnimationSpeed = "1x"
export const BATTLE_ANIMATION_SPEED_GROUP_LABEL = "Battle animation speed"
export const BATTLE_ANIMATION_SPEED_OPTIONS = Object.freeze([
  { value: "1x", label: "1×", accessibleLabel: "Battle animation speed 1×" },
  { value: "2x", label: "2×", accessibleLabel: "Battle animation speed 2×" },
  { value: "3x", label: "3×", accessibleLabel: "Battle animation speed 3×" },
  { value: "skip", label: "Skip", accessibleLabel: "Skip battle animations" },
] as const)

export function scaleBattleAnimationDuration(
  durationMs: number,
  speed: BattleAnimationSpeed,
): number {
  return durationMs / (speed === "3x" ? 3 : speed === "2x" ? 2 : 1)
}
