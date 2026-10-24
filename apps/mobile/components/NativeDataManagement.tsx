import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type {
  PlayerDataResetKind,
  PlayerDataResetReview,
} from "@game/machines/src/PlayerDataReset"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import { ScrollView, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeOperationMessages from "@/components/NativeOperationMessages"
import NativePlayerDataImportPreview from "@/components/NativePlayerDataImportPreview"
import NativePlayerDataResetActions from "@/components/NativePlayerDataResetActions"
import NativePlayerDataResetReview from "@/components/NativePlayerDataResetReview"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export type NativeDataManagementActivity = string

export default function NativeDataManagement({
  activity,
  customValueCount,
  isNavigationPending,
  issue,
  notice,
  preview,
  resetReview,
  onCancelImport,
  onCancelReset,
  onChooseBackup,
  onClose,
  onConfirmImport,
  onConfirmReset,
  onExport,
  onOpenMenu,
  onRequestReset,
}: {
  readonly activity: NativeDataManagementActivity | null
  readonly customValueCount: number
  readonly isNavigationPending: boolean
  readonly issue: string | null
  readonly notice: string | null
  readonly preview: WayvmImportPreview | null
  readonly resetReview: PlayerDataResetReview | null
  readonly onCancelImport: () => void
  readonly onCancelReset: () => void
  readonly onChooseBackup: () => void
  readonly onClose: () => void
  readonly onConfirmImport: () => void
  readonly onConfirmReset: (review: PlayerDataResetReview) => void
  readonly onExport: () => void
  readonly onOpenMenu: () => void
  readonly onRequestReset: (resetKind: PlayerDataResetKind) => void
}) {
  const localizedCopy = useLocaleCatalog()
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu
  const playerDataPortabilityCopy = localizedCopy.interfaceCopy.portability

  const isBusy = activity !== null
  const isNavigationBlocked =
    isNavigationPending || isBusy || preview !== null || resetReview !== null

  return (
    <MapacheScreen>
      <View className="gap-4 border-b-4 border-black p-4">
        <Text
          variant="h1"
          className="text-mapache-vivid-primary-cyan text-left text-2xl font-black tracking-tight uppercase xl:text-4xl"
        >
          {playerDataPortabilityCopy.screenTitle}
        </Text>
        {!preview && (
          <View className="flex-row flex-wrap gap-3">
            <Button
              className="flex-1"
              disabled={isNavigationBlocked}
              variant="outline"
              onPress={onOpenMenu}
            >
              <Text>{PRODUCT_MENU_COPY.openAction}</Text>
            </Button>
            <Button
              className="flex-1"
              disabled={isNavigationBlocked}
              variant="secondary"
              onPress={onClose}
            >
              <Text>{localizedCopy.interfaceCopy.screen.backToValues}</Text>
            </Button>
          </View>
        )}
      </View>

      {preview && !resetReview ? (
        <ScrollView
          className="min-h-0 flex-1"
          contentContainerClassName="grow gap-2 p-3"
          keyboardShouldPersistTaps="handled"
        >
          <NativeOperationMessages
            activity={activity}
            issue={issue}
            notice={notice}
          />
          <NativePlayerDataImportPreview
            isBusy={isBusy}
            preview={preview}
            onCancel={onCancelImport}
            onConfirm={onConfirmImport}
          />
        </ScrollView>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-5 p-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <View accessibilityState={{ busy: isBusy }} className="gap-5">
            <NativeOperationMessages
              activity={activity}
              issue={issue}
              notice={notice}
            />

            {resetReview ? (
              <NativePlayerDataResetReview
                key={resetReview.confirmationId}
                isBusy={isBusy}
                review={resetReview}
                onCancel={onCancelReset}
                onConfirm={onConfirmReset}
                onExport={onExport}
              />
            ) : (
              <>
                <View className="gap-4 border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]">
                  <Text
                    accessibilityRole="header"
                    className="border-b-4 border-black pb-3 text-3xl font-black text-black uppercase"
                  >
                    {playerDataPortabilityCopy.exportTitle}
                  </Text>
                  <Button disabled={isBusy} onPress={onExport}>
                    <Text>{playerDataPortabilityCopy.exportAction}</Text>
                  </Button>
                  <Text className="font-bold text-black">
                    {playerDataPortabilityCopy.exportDescription}
                  </Text>
                </View>

                <View className="gap-4 border-4 border-black bg-white p-5 shadow-[6px_6px_0px_0px_#000000]">
                  <Text
                    accessibilityRole="header"
                    className="border-b-4 border-black pb-3 text-3xl font-black text-black uppercase"
                  >
                    {playerDataPortabilityCopy.importTitle}
                  </Text>
                  <Button
                    disabled={isBusy}
                    variant="secondary"
                    onPress={onChooseBackup}
                  >
                    <Text>{playerDataPortabilityCopy.chooseBackupAction}</Text>
                  </Button>
                  <Text className="font-bold text-black">
                    {playerDataPortabilityCopy.importDescription}
                  </Text>
                </View>

                <Text className="font-bold text-white">
                  {playerDataPortabilityCopy.introduction}
                </Text>
                <NativePlayerDataResetActions
                  customValueCount={customValueCount}
                  isBusy={isBusy}
                  onRequestReset={onRequestReset}
                />
              </>
            )}
          </View>
        </ScrollView>
      )}
    </MapacheScreen>
  )
}
