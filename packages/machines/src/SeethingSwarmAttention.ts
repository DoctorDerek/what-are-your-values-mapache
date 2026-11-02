export type SeethingSwarmAttentionState = Readonly<{
  isAttended: boolean
  isActive: boolean
  entries: number
  tapRequest: number
  alternativeIndex: number
  generation: number
}>

export function createSeethingSwarmAttentionState(): SeethingSwarmAttentionState {
  return {
    isAttended: false,
    isActive: false,
    entries: 0,
    tapRequest: 0,
    alternativeIndex: 0,
    generation: 0,
  }
}

export function updateSeethingSwarmAttention(
  previous: SeethingSwarmAttentionState,
  isAttended: boolean,
  canAnimate: boolean,
  alternativeCount: number,
  tapRequest = 0,
): SeethingSwarmAttentionState {
  const enters =
    canAnimate &&
    isAttended &&
    (!previous.isAttended || tapRequest !== previous.tapRequest)
  const isActive = canAnimate && isAttended && (enters || previous.isActive)
  if (
    previous.isAttended === isAttended &&
    previous.isActive === isActive &&
    previous.tapRequest === tapRequest
  )
    return previous
  return {
    isAttended,
    isActive,
    entries: previous.entries + Number(enters),
    tapRequest,
    alternativeIndex:
      enters && previous.entries > 0
        ? (previous.alternativeIndex + 1) % alternativeCount
        : previous.alternativeIndex,
    generation:
      previous.generation + (enters || previous.isActive !== isActive ? 1 : 0),
  }
}
