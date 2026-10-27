import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { ReactNode } from "react"
import { ScrollView, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

type SharedRecoveryActions = {
  readonly children?: ReactNode
  readonly isBusy: boolean
  readonly onTryAgain: () => void
}

type UnreadableDataRecoveryActions = SharedRecoveryActions & {
  readonly mode: "unreadable-data"
  readonly hasLastKnownGoodSave: boolean
  readonly onDeleteAllData: () => void
  readonly onExportUnreadableData: () => void
  readonly onImportBackup: () => void
  readonly onRestoreLastKnownGoodSave: () => void
}

type StorageUnavailableRecoveryActions = SharedRecoveryActions & {
  readonly mode: "storage-unavailable"
  readonly hasPendingSave?: boolean
  readonly canExportCurrentData: boolean
  readonly canReturnWithoutNewChanges: boolean
  readonly onExportCurrentData: () => void
  readonly onReturnWithoutNewChanges: () => void
}

type NativePlayerDataRecoveryActionsProps =
  UnreadableDataRecoveryActions | StorageUnavailableRecoveryActions

export default function NativePlayerDataRecoveryActions(
  props: NativePlayerDataRecoveryActionsProps,
) {
  const localizedCopy = useLocaleCatalog()
  const playerDataRecoveryCopy = localizedCopy.interfaceCopy.recovery

  const { actions } = playerDataRecoveryCopy

  if (props.mode === "unreadable-data")
    return (
      <View className="min-h-0 flex-1">
        <ScrollView
          className="min-h-0 flex-1"
          contentContainerClassName="gap-4 p-1 pb-5"
        >
          {props.children}

          <Button
            disabled={props.isBusy}
            size="compact"
            variant="secondary"
            onPress={props.onImportBackup}
          >
            <Text>{actions.importBackup}</Text>
          </Button>
          <Button
            disabled={props.isBusy}
            size="compact"
            variant="outline"
            onPress={props.onExportUnreadableData}
          >
            <Text>{actions.exportUnreadableData}</Text>
          </Button>

          <Button
            disabled={props.isBusy}
            size="compact"
            variant="destructive"
            onPress={props.onDeleteAllData}
          >
            <Text>{actions.deleteAllData}</Text>
          </Button>
        </ScrollView>
        <View className="shrink-0 gap-3 pt-3 pb-2">
          {props.hasLastKnownGoodSave ? (
            <Button
              disabled={props.isBusy}
              size="compact"
              onPress={props.onRestoreLastKnownGoodSave}
              accessibilityLabel={actions.restoreLastKnownGoodSave}
            >
              <Text>
                {playerDataRecoveryCopy.unreadableData.restoreReviewAction}
              </Text>
            </Button>
          ) : null}
          <Button
            disabled={props.isBusy}
            size="compact"
            variant="outline"
            onPress={props.onTryAgain}
          >
            <Text>{actions.tryAgain}</Text>
          </Button>
        </View>
      </View>
    )

  return (
    <View className="min-h-0 flex-1">
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName="gap-4 p-1 pb-5"
      >
        {props.children}
        {props.canExportCurrentData && !props.hasPendingSave && (
          <Button
            disabled={props.isBusy}
            size="compact"
            variant="secondary"
            onPress={props.onExportCurrentData}
          >
            <Text>{actions.exportCurrentData}</Text>
          </Button>
        )}
      </ScrollView>
      <View className="shrink-0 gap-3 pt-3 pb-2">
        {props.canExportCurrentData && props.hasPendingSave ? (
          <Button
            disabled={props.isBusy}
            size="compact"
            variant="secondary"
            onPress={props.onExportCurrentData}
          >
            <Text>{playerDataRecoveryCopy.pendingSave.export}</Text>
          </Button>
        ) : null}
        <Button
          disabled={props.isBusy}
          size="compact"
          onPress={props.onTryAgain}
        >
          <Text>
            {props.hasPendingSave
              ? playerDataRecoveryCopy.pendingSave.retry
              : actions.tryAgain}
          </Text>
        </Button>
        {props.canReturnWithoutNewChanges ? (
          <Button
            disabled={props.isBusy}
            size="compact"
            variant="outline"
            onPress={props.onReturnWithoutNewChanges}
          >
            <Text>{actions.returnWithoutNewChanges}</Text>
          </Button>
        ) : null}
      </View>
    </View>
  )
}
