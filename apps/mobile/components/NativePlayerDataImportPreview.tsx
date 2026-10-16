import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import type { ReactNode } from "react"
import { View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

function PreviewFact({
  label,
  children,
}: {
  readonly label: string
  readonly children: ReactNode
}) {
  return (
    <View className="border-4 border-black bg-white p-4">
      <Text className="text-sm font-black tracking-wide text-black uppercase">
        {label}
      </Text>
      <Text className="mt-1 text-lg leading-7 font-bold text-black">
        {children}
      </Text>
    </View>
  )
}

export default function NativePlayerDataImportPreview({
  confirmLabel,
  isBusy,
  preview,
  title,
  warning,
  onCancel,
  onConfirm,
}: {
  readonly confirmLabel?: string
  readonly isBusy: boolean
  readonly preview: WayvmImportPreview
  readonly title?: string
  readonly warning?: string
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const playerDataPortabilityCopy = localizedCopy.interfaceCopy.portability

  const formattedExportTimestamp = createLocaleFormatters(
    localizedCopy.metadata.languageTag,
  ).dateTime(preview.exportedAt)

  return (
    <View className="gap-5 border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000]">
      <Text
        variant="h2"
        className="border-b-4 border-black pb-2 text-3xl font-black tracking-tight text-black uppercase"
      >
        {title ?? playerDataPortabilityCopy.importPreviewTitle}
      </Text>

      <View className="gap-3">
        <PreviewFact label={playerDataPortabilityCopy.preview.backupCreated}>
          {formattedExportTimestamp}
        </PreviewFact>
        <PreviewFact
          label={playerDataPortabilityCopy.preview.sourceApplication}
        >
          {localizedCopy.interfaceCopy.screen.versionNumber(
            preview.sourceAppVersion,
          )}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.sourceBuild}>
          {preview.sourceBuild}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.saveSchema}>
          {localizedCopy.interfaceCopy.screen.versionNumber(
            String(preview.saveSchemaVersion),
          )}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.totalComparisons}>
          {preview.totalComparisons}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.canonicalCatalog}>
          {preview.canonicalCatalogVersion}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.includedValues}>
          {preview.activeValueCount - preview.customValueCount}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.customValues}>
          {preview.customValueCount}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.activeValues}>
          {preview.activeValueCount}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.currentCycle}>
          {preview.currentCycle}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.cyclePairings}>
          {preview.activePairCycleSize}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.deckRevision}>
          {preview.deckRevision}
        </PreviewFact>
        <PreviewFact
          label={playerDataPortabilityCopy.preview.progressGeneration}
        >
          {preview.progressGeneration}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.achievements}>
          {preview.unlockedAchievementCount}
        </PreviewFact>
        <PreviewFact
          label={
            playerDataPortabilityCopy.preview.achievementProgressGeneration
          }
        >
          {preview.achievementProgressGeneration}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.language}>
          {preview.locale}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.replacement}>
          {localizedCopy.interfaceCopy.screen.replacesCurrentData}
        </PreviewFact>
      </View>

      <Text
        accessibilityRole="alert"
        className="bg-mapache-vivid-secondary-gold border-4 border-black p-4 text-lg leading-7 font-black text-black"
      >
        {warning ?? playerDataPortabilityCopy.importPreviewWarning}
      </Text>

      <View className="gap-4">
        <Button disabled={isBusy} variant="outline" onPress={onCancel}>
          <Text>{playerDataPortabilityCopy.importCancelAction}</Text>
        </Button>
        <Button disabled={isBusy} onPress={onConfirm}>
          <Text>
            {confirmLabel ?? playerDataPortabilityCopy.importReplaceAction}
          </Text>
        </Button>
      </View>
    </View>
  )
}
