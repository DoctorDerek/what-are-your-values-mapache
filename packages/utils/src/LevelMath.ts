export const XP_QUANTUM = 4
export const MAX_PAYOUT_TIER = 100
export const MAX_BATTLE_XP = XP_QUANTUM * MAX_PAYOUT_TIER
const LEVEL_CURVE_NUMERATOR = 11
const LEVEL_CURVE_DENOMINATOR = 20
export const MAX_SUPPORTED_TOTAL_XP =
  Math.floor(
    (Number.MAX_SAFE_INTEGER - LEVEL_CURVE_DENOMINATOR) /
      (LEVEL_CURVE_NUMERATOR * XP_QUANTUM),
  ) * XP_QUANTUM

function validateTotalXp(totalXp: number) {
  if (
    !Number.isSafeInteger(totalXp) ||
    totalXp < 0 ||
    totalXp > MAX_SUPPORTED_TOTAL_XP
  ) {
    throw new Error(`Unsupported total XP: ${totalXp}`)
  }
}

export function getLevelFromXP(totalXp: number) {
  validateTotalXp(totalXp)
  return (
    1 + Math.floor((LEVEL_CURVE_NUMERATOR * totalXp) / LEVEL_CURVE_DENOMINATOR)
  )
}

const MAX_SUPPORTED_LEVEL = getLevelFromXP(MAX_SUPPORTED_TOTAL_XP)

function validateLevel(level: number) {
  if (!Number.isSafeInteger(level) || level < 1 || level > MAX_SUPPORTED_LEVEL)
    throw new Error(`Unsupported Level: ${level}`)
}

export function getMinimumReachableXpForLevel(level: number) {
  validateLevel(level)
  return XP_QUANTUM * Math.ceil((5 * (level - 1)) / 11)
}

export function getLevelProgressFromXP(totalXp: number) {
  const level = getLevelFromXP(totalXp)
  const levelStartingTotalXp = Math.ceil(
    (LEVEL_CURVE_DENOMINATOR * (level - 1)) / LEVEL_CURVE_NUMERATOR,
  )
  const nextLevelStartingTotalXp = Math.ceil(
    (LEVEL_CURVE_DENOMINATOR * level) / LEVEL_CURVE_NUMERATOR,
  )

  return Object.freeze({
    level,
    earnedXpTowardNextLevel: totalXp - levelStartingTotalXp,
    requiredXpForNextLevel: nextLevelStartingTotalXp - levelStartingTotalXp,
  } as const)
}

export function getExactLevelProgressFromXP(totalXp: bigint) {
  if (totalXp < 0n) throw new Error(`Unsupported total XP: ${totalXp}`)

  const numerator = BigInt(LEVEL_CURVE_NUMERATOR)
  const denominator = BigInt(LEVEL_CURVE_DENOMINATOR)
  const level = 1n + (numerator * totalXp) / denominator
  const levelStartingTotalXp =
    (denominator * (level - 1n) + numerator - 1n) / numerator
  const nextLevelStartingTotalXp =
    (denominator * level + numerator - 1n) / numerator

  return Object.freeze({
    level,
    earnedXpTowardNextLevel: totalXp - levelStartingTotalXp,
    requiredXpForNextLevel: nextLevelStartingTotalXp - levelStartingTotalXp,
  } as const)
}

export function getPayoutTierFromXP(totalXp: number) {
  validateTotalXp(totalXp)
  return Math.floor((1 + Math.sqrt(1 + 2 * totalXp)) / 2)
}

export function calculateCycleSnapshotXpPayout(
  opponentPayoutTierAtCycleStart: number,
) {
  if (
    !Number.isSafeInteger(opponentPayoutTierAtCycleStart) ||
    opponentPayoutTierAtCycleStart < 1
  )
    throw new Error(
      `Invalid cycle-snapshot opponent payout tier: ${opponentPayoutTierAtCycleStart}`,
    )

  return XP_QUANTUM * Math.min(opponentPayoutTierAtCycleStart, MAX_PAYOUT_TIER)
}
