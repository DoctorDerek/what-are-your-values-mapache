import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { type PlayerDataResetReview } from "@game/machines/src/PlayerDataReset"
import { useState, type ReactNode } from "react"
import { ScrollView, Switch, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativePlayerDataResetReview({
  children,
  isBusy,
  review,
  onCancel,
  onConfirm,
  onExport,
}: {
  readonly children?: ReactNode
  readonly isBusy: boolean
  readonly review: PlayerDataResetReview
  readonly onCancel: () => void
  readonly onConfirm: (review: PlayerDataResetReview) => void
  readonly onExport: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const playerDataResetCopy = localizedCopy.interfaceCopy.resets

  const [acknowledgedCompleteErasure, setAcknowledgedCompleteErasure] =
    useState(false)
  const copy = playerDataResetCopy[review.resetKind]
  const requiresCompleteErasureAcknowledgment =
    review.resetKind === "delete-all-data"

  return (
    <View className="border-mapache-vivid-primary-orange min-h-0 flex-1 border-8 bg-white shadow-[8px_8px_0px_0px_#000000]">
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName="gap-5 p-4 xl:p-8"
        keyboardShouldPersistTaps="handled"
      >
        {children}
        <Text
          variant="h2"
          className="border-b-4 border-black pb-2 text-3xl font-black tracking-tight text-black uppercase"
        >
          {copy.confirmationTitle}
        </Text>

        <View className="gap-4">
          {copy.confirmationBody.map((paragraph) => (
            <Text
              key={paragraph}
              className="text-lg leading-7 font-bold text-black"
            >
              {paragraph}
            </Text>
          ))}
        </View>

        {requiresCompleteErasureAcknowledgment ? (
          <View className="bg-mapache-vivid-light flex-row items-center gap-4 border-4 border-black p-4">
            <Switch
              accessibilityLabel={
                localizedCopy.interfaceCopy.screen.deleteAllDataAcknowledgment
              }
              disabled={isBusy}
              onValueChange={setAcknowledgedCompleteErasure}
              value={acknowledgedCompleteErasure}
            />
            <Text className="min-w-0 flex-1 text-lg leading-7 font-black text-black">
              {localizedCopy.interfaceCopy.screen.deleteAllDataAcknowledgment}
            </Text>
          </View>
        ) : null}

        <Button
          size="compact"
          disabled={isBusy}
          variant="secondary"
          onPress={onExport}
        >
          <Text>{localizedCopy.interfaceCopy.screen.exportData}</Text>
        </Button>
      </ScrollView>
      <View className="shrink-0 flex-row flex-wrap gap-3 border-t-4 border-black p-3 pb-5 xl:p-4">
        <Button
          size="compact"
          className="basis-readable-action min-w-0 flex-1"
          disabled={isBusy}
          variant="outline"
          onPress={onCancel}
        >
          <Text>{localizedCopy.interfaceCopy.screen.cancel}</Text>
        </Button>
        <Button
          disabled={
            isBusy ||
            (requiresCompleteErasureAcknowledgment &&
              !acknowledgedCompleteErasure)
          }
          size="compact"
          className="basis-readable-action min-w-0 flex-1"
          variant="destructive"
          onPress={() => onConfirm(review)}
        >
          <Text>{copy.actionLabel}</Text>
        </Button>
      </View>
    </View>
  )
}
