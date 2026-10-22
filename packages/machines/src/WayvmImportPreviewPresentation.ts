import type { LocalizationCatalog } from "@game/data/src/LocalizationCatalog"
import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import type { WayvmImportPreview } from "./WayvmImportPreview"

export function presentWayvmImportPreview(
  preview: WayvmImportPreview,
  localization: LocalizationCatalog,
) {
  const { integer, dateTime } = createLocaleFormatters(localization.metadata.languageTag)
  const copy = localization.interfaceCopy
  const values = {
    backupCreated: dateTime(preview.exportedAt),
    language: preview.locale,
    totalComparisons: integer(preview.totalComparisons),
    includedValues: integer(preview.activeValueCount - preview.customValueCount),
    customValues: integer(preview.customValueCount),
    activeValues: integer(preview.activeValueCount),
    achievements: integer(preview.unlockedAchievementCount),
    sourceApplication: copy.screen.versionNumber(preview.sourceAppVersion),
    sourceBuild: preview.sourceBuild,
    saveSchema: copy.screen.versionNumber(String(preview.saveSchemaVersion)),
    canonicalCatalog: preview.canonicalCatalogVersion,
    currentCycle: integer(preview.currentCycle),
    cyclePairings: integer(preview.activePairCycleSize),
    deckRevision: integer(preview.deckRevision),
    progressGeneration: integer(preview.progressGeneration),
    achievementProgressGeneration: integer(preview.achievementProgressGeneration),
    replacement: copy.screen.replacesCurrentData,
  } satisfies Record<keyof typeof copy.portability.preview, string>
  const summaryKeys = ["backupCreated", "language", "totalComparisons", "includedValues", "customValues", "activeValues", "achievements"] as const
  const detailKeys = ["sourceApplication", "sourceBuild", "saveSchema", "canonicalCatalog", "currentCycle", "cyclePairings", "deckRevision", "progressGeneration", "achievementProgressGeneration", "replacement"] as const
  const fact = (key: keyof typeof values) => ({ key, label: copy.portability.preview[key], value: values[key] })
  return { summary: summaryKeys.map(fact), details: detailKeys.map(fact) }
}
