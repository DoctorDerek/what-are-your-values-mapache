import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { PlayerDataResetReview } from "@game/machines/src/PlayerDataReset"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import { View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeOperationMessages from "@/components/NativeOperationMessages"
import NativePlayerDataImportPreview from "@/components/NativePlayerDataImportPreview"
import NativePlayerDataRecoveryActions from "@/components/NativePlayerDataRecoveryActions"
import NativePlayerDataResetReview from "@/components/NativePlayerDataResetReview"
import { Text } from "@/components/ui/text"

export type NativePlayerDataRecoveryActivity = string

type SharedNativePersistenceFailureProps = {
  readonly activity: NativePlayerDataRecoveryActivity | null
  readonly issue: string | null
  readonly notice: string | null
  readonly onTryAgain: () => void
}

type UnreadableDataFailureProps = SharedNativePersistenceFailureProps & {
  readonly mode: "unreadable-data"
  readonly hasLastKnownGoodSave: boolean
  readonly pendingImportSource: "last-known-good" | "selected-backup" | null
  readonly preview: WayvmImportPreview | null
  readonly resetReview: PlayerDataResetReview | null
  readonly onCancelImport: () => void
  readonly onCancelReset: () => void
  readonly onConfirmImport: () => void
  readonly onConfirmReset: (review: PlayerDataResetReview) => void
  readonly onDeleteAllData: () => void
  readonly onExportUnreadableData: () => void
  readonly onImportBackup: () => void
  readonly onRestoreLastKnownGoodSave: () => void
}

type StorageUnavailableFailureProps = SharedNativePersistenceFailureProps & {
  readonly mode: "storage-unavailable"
  readonly hasPendingSave?: boolean
  readonly canExportCurrentData: boolean
  readonly canReturnWithoutNewChanges: boolean
  readonly onExportCurrentData: () => void
  readonly onReturnWithoutNewChanges: () => void
}

type NativePersistenceFailureProps =
  UnreadableDataFailureProps | StorageUnavailableFailureProps

export default function NativePersistenceFailure(
  props: NativePersistenceFailureProps,
) {
  const localizedCopy = useLocaleCatalog()
  const playerDataRecoveryCopy = localizedCopy.interfaceCopy.recovery

  const isBusy = props.activity !== null
  const title =
    props.mode === "unreadable-data"
      ? playerDataRecoveryCopy.unreadableData.title
      : props.hasPendingSave
        ? playerDataRecoveryCopy.pendingSave.title
        : playerDataRecoveryCopy.storageUnavailable.title
  const body =
    props.mode === "unreadable-data"
      ? playerDataRecoveryCopy.unreadableData.body
      : [
          props.hasPendingSave
            ? playerDataRecoveryCopy.pendingSave.body
            : playerDataRecoveryCopy.storageUnavailable.body,
        ]

  const feedback = (
    <NativeOperationMessages
      activity={props.activity}
      issue={props.issue}
      notice={props.notice}
    />
  )
  const content = (
    <>
      <Text
        accessibilityRole="header"
        variant="h1"
        className="text-mapache-vivid-secondary-red text-center text-4xl font-black tracking-tight"
      >
        {props.mode === "storage-unavailable" && props.hasPendingSave ? (
          <Text accessibilityElementsHidden>✖ </Text>
        ) : null}
        {title}
      </Text>
      <View className="mt-5 gap-4">
        {body.map((paragraph) => (
          <Text
            key={paragraph}
            className="text-lg leading-7 font-medium text-black"
          >
            {paragraph}
          </Text>
        ))}
      </View>

      {feedback}
      {props.mode === "unreadable-data" && !props.hasLastKnownGoodSave && (
        <Text
          accessibilityRole="alert"
          className="bg-mapache-vivid-secondary-gold border-4 border-black p-4 text-lg font-black text-black"
        >
          {playerDataRecoveryCopy.unreadableData.noKnownGoodSave}
        </Text>
      )}
    </>
  )
  return (
    <MapacheScreen className="p-3 xl:p-6">
      <View
        accessibilityState={{ busy: isBusy }}
        className="mx-auto min-h-0 w-full max-w-3xl flex-1 border-4 border-black bg-white p-3"
      >
        {props.mode === "unreadable-data" ? (
          props.resetReview ? (
            <NativePlayerDataResetReview
              key={props.resetReview.confirmationId}
              isBusy={isBusy}
              review={props.resetReview}
              onCancel={props.onCancelReset}
              onConfirm={props.onConfirmReset}
              onExport={props.onExportUnreadableData}
            >
              {feedback}
            </NativePlayerDataResetReview>
          ) : props.preview ? (
            <NativePlayerDataImportPreview
              confirmLabel={
                props.pendingImportSource === "last-known-good"
                  ? playerDataRecoveryCopy.unreadableData.restoreReviewAction
                  : playerDataRecoveryCopy.unreadableData
                      .selectedBackupReviewAction
              }
              isBusy={isBusy}
              preview={props.preview}
              title={
                props.pendingImportSource === "last-known-good"
                  ? playerDataRecoveryCopy.unreadableData.restoreReviewTitle
                  : playerDataRecoveryCopy.unreadableData
                      .selectedBackupReviewTitle
              }
              warning={
                props.pendingImportSource === "last-known-good"
                  ? playerDataRecoveryCopy.unreadableData.restoreConfirmation
                  : playerDataRecoveryCopy.unreadableData
                      .selectedBackupConfirmation
              }
              onCancel={props.onCancelImport}
              onConfirm={props.onConfirmImport}
            >
              {feedback}
            </NativePlayerDataImportPreview>
          ) : (
            <NativePlayerDataRecoveryActions
              mode="unreadable-data"
              hasLastKnownGoodSave={props.hasLastKnownGoodSave}
              isBusy={isBusy}
              onDeleteAllData={props.onDeleteAllData}
              onExportUnreadableData={props.onExportUnreadableData}
              onImportBackup={props.onImportBackup}
              onRestoreLastKnownGoodSave={props.onRestoreLastKnownGoodSave}
              onTryAgain={props.onTryAgain}
            >
              {content}
            </NativePlayerDataRecoveryActions>
          )
        ) : (
          <NativePlayerDataRecoveryActions
            mode="storage-unavailable"
            hasPendingSave={props.hasPendingSave}
            canExportCurrentData={props.canExportCurrentData}
            canReturnWithoutNewChanges={props.canReturnWithoutNewChanges}
            isBusy={isBusy}
            onExportCurrentData={props.onExportCurrentData}
            onReturnWithoutNewChanges={props.onReturnWithoutNewChanges}
            onTryAgain={props.onTryAgain}
          >
            {content}
          </NativePlayerDataRecoveryActions>
        )}
      </View>
    </MapacheScreen>
  )
}
