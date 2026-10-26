import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import {
  getWrappableImportAction,
  presentWayvmImportPreview,
} from "@game/machines/src/WayvmImportPreviewPresentation"
import { useState, type ReactNode } from "react"
import { ScrollView, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativePlayerDataImportPreview({
  children,
  confirmLabel,
  isBusy,
  preview,
  title,
  warning,
  onCancel,
  onConfirm,
}: {
  readonly children?: ReactNode
  readonly confirmLabel?: string
  readonly isBusy: boolean
  readonly preview: WayvmImportPreview
  readonly title?: string
  readonly warning?: string
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  const localization = useLocaleCatalog()
  const copy = localization.interfaceCopy.portability
  const facts = presentWayvmImportPreview(preview, localization)
  const [detailsOpen, setDetailsOpen] = useState(false)
  return (
    <View
      accessibilityState={{ busy: isBusy }}
      className="min-h-0 flex-1 border-4 border-black bg-white"
    >
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName="gap-3 p-3"
        keyboardShouldPersistTaps="handled"
      >
        {children}
        <Text
          accessibilityRole="header"
          className="border-b-4 border-black pb-2 text-2xl font-black text-black uppercase"
        >
          {title ?? copy.importPreviewTitle}
        </Text>
        <Text className="bg-mapache-vivid-secondary-gold border-2 border-black p-2 text-sm font-bold text-black">
          {warning ?? copy.importPreviewWarning}
        </Text>
        {facts.summary.map(({ key, label, value }) => (
          <View key={key} className="border-b-2 border-black/20 py-2">
            <Text className="text-sm font-black text-black">{label}</Text>
            <Text className="text-lg font-bold text-black">{value}</Text>
          </View>
        ))}
        <Button
          size="compact"
          variant="outline"
          accessibilityState={{ expanded: detailsOpen }}
          onPress={() => setDetailsOpen(!detailsOpen)}
        >
          <Text>{copy.technicalDetails}</Text>
        </Button>
        {detailsOpen &&
          facts.details.map(({ key, label, value }) => (
            <View key={key} className="border-b border-black/20 py-2">
              <Text className="text-sm font-bold text-black">{label}</Text>
              <Text className="text-black">{value}</Text>
            </View>
          ))}
      </ScrollView>
      <View className="shrink-0 border-t-4 border-black p-3 pb-5">
        <View className="flex-row flex-wrap gap-3">
          <Button
            size="compact"
            className="basis-readable-action min-w-0 shrink grow"
            disabled={isBusy}
            variant="outline"
            onPress={onCancel}
          >
            <Text>{copy.importCancelAction}</Text>
          </Button>
          <Button
            size="compact"
            className="basis-readable-action min-w-0 shrink grow"
            disabled={isBusy}
            onPress={onConfirm}
            accessibilityLabel={confirmLabel ?? copy.importReplaceAction}
          >
            <Text>
              {getWrappableImportAction(
                confirmLabel ?? copy.importReplaceAction,
                localization.metadata.languageTag,
              )}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  )
}
