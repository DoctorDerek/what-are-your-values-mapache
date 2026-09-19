export type SeethingSwarmAttentionState = Readonly<{
  isAttended: boolean
  isActive: boolean
  hasEntered: boolean
  alternativeIndex: number
  generation: number
}>

export function createSeethingSwarmAttentionState(): SeethingSwarmAttentionState {
  return {
    isAttended: false,
    isActive: false,
    hasEntered: false,
    alternativeIndex: 0,
    generation: 0,
  }
}

export function updateSeethingSwarmAttention(
  previous: SeethingSwarmAttentionState,
  isAttended: boolean,
  canAnimate: boolean,
  alternativeCount: number,
): SeethingSwarmAttentionState {
  const enters = isAttended && !previous.isAttended && canAnimate
  const isActive = canAnimate && isAttended && (enters || previous.isActive)
  if (previous.isAttended === isAttended && previous.isActive === isActive)
    return previous
  return {
    isAttended,
    isActive,
    hasEntered: previous.hasEntered || enters,
    alternativeIndex:
      enters && previous.hasEntered
        ? (previous.alternativeIndex + 1) % alternativeCount
        : previous.alternativeIndex,
    generation:
      previous.generation + (enters || previous.isActive !== isActive ? 1 : 0),
  }
}
