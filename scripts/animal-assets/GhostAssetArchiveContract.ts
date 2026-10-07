export type GhostAssetArchiveContract = Readonly<{
  entryRoot: string
  requiredEntryNames: readonly string[]
  limits: Readonly<{
    maximumEntryCount: number
    maximumEntrySizeBytes: number
    maximumTotalSizeBytes: number
  }>
}>
