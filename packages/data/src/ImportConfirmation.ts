export const IMPORT_CONFIRMATION_DURATION_MS = 5_000

export type ImportConfirmation = Readonly<{
  summary: string
  message: string
}>
