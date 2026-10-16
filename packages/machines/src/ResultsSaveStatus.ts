export const RESULTS_SAVE_CONFIRMATION_MS = 5_000
export const RESULTS_SAVE_CONFIRMATION_FADE_MS = 300

export function getResultsSaveConfirmationRemainingMs(
  openedAt: string | null,
  currentTimeMs: number,
): number {
  return openedAt === null
    ? 0
    : Math.max(
        0,
        Date.parse(openedAt) + RESULTS_SAVE_CONFIRMATION_MS - currentTimeMs,
      )
}
