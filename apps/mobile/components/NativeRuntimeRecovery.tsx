import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  runtimeRecoveryMachine,
  type RootActor,
} from "@game/machines/src/RuntimeRecovery"
import { useMachine } from "@xstate/react"
import { useEffect, useState, type ReactNode } from "react"
import { BackHandler, ScrollView, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeOperationMessages from "@/components/NativeOperationMessages"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { expoPlayerDataFileAdapter } from "@/lib/ExpoPlayerDataFiles"

export default function NativeRuntimeRecovery({
  gameActor,
  onRetry,
  onReopen,
}: {
  readonly gameActor?: RootActor
  readonly onRetry?: () => void
  readonly onReopen?: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const copy = localizedCopy.interfaceCopy.runtimeRecovery

  const content = (
    <>
      <Text
        accessibilityRole="header"
        className="text-mapache-vivid-primary-cyan text-3xl font-black"
      >
        {copy.title}
      </Text>
      <Text className="text-lg font-medium text-black">
        {!gameActor
          ? copy.startupDetail
          : onReopen
            ? copy.actorDetail
            : copy.renderDetail}
      </Text>
    </>
  )
  return (
    <MapacheScreen className="p-3 xl:p-6">
      <View className="mx-auto min-h-0 w-full max-w-2xl flex-1 border-4 border-black bg-white p-3">
        {gameActor ? (
          <RecoveryActions
            gameActor={gameActor}
            onRetry={onRetry}
            onReopen={onReopen}
          >
            {content}
          </RecoveryActions>
        ) : (
          <>
            <ScrollView
              className="min-h-0 flex-1"
              contentContainerClassName="gap-5 p-2"
            >
              {content}
            </ScrollView>
            <Button size="compact" className="mt-3" onPress={onRetry}>
              <Text>{copy.retry}</Text>
            </Button>
          </>
        )}
      </View>
    </MapacheScreen>
  )
}

function RecoveryActions({
  children,
  gameActor,
  onRetry,
  onReopen,
}: {
  readonly children: ReactNode
  readonly gameActor: RootActor
  readonly onRetry?: () => void
  readonly onReopen?: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const copy = localizedCopy.interfaceCopy.runtimeRecovery

  const [state, send] = useMachine(runtimeRecoveryMachine, {
    input: { gameActor, deliverDownload: expoPlayerDataFileAdapter.exportJson },
  })
  const [isConfirmingReopen, setIsConfirmingReopen] = useState(false)
  const isExporting = state.matches("Exporting")
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setIsConfirmingReopen(false)
        return true
      },
    )
    return () => subscription.remove()
  }, [])

  return (
    <View className="min-h-0 flex-1" accessibilityState={{ busy: isExporting }}>
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName="gap-4 p-2"
      >
        {children}
        <Button
          variant="outline"
          disabled={isExporting || !gameActor.getSnapshot().context.playerData}
          onPress={() =>
            send({ type: "RECOVERY.EXPORT", backupKind: "player" })
          }
        >
          <Text>{copy.exportPlayer}</Text>
        </Button>
        <Button
          variant="outline"
          disabled={isExporting}
          onPress={() =>
            send({ type: "RECOVERY.EXPORT", backupKind: "stored" })
          }
        >
          <Text>{copy.exportStored}</Text>
        </Button>
        <NativeOperationMessages
          activity={isExporting ? copy.exporting : null}
          issue={state.matches("Failed") ? copy.exportFailed : null}
          notice={state.matches("Exported") ? copy.exportReady : null}
        />

        {isConfirmingReopen && (
          <>
            <Text
              accessibilityRole="header"
              className="text-2xl font-black text-black"
            >
              {copy.confirmTitle}
            </Text>
            <Text className="font-medium text-black">{copy.confirmDetail}</Text>
          </>
        )}
      </ScrollView>
      <View className="shrink-0 flex-row flex-wrap gap-3 border-t-4 border-black pt-3 pb-2">
        {isConfirmingReopen ? (
          <>
            <Button
              size="compact"
              className="basis-readable-action min-w-0 flex-1"
              variant="outline"
              onPress={() => setIsConfirmingReopen(false)}
            >
              <Text>{copy.cancel}</Text>
            </Button>
            <Button
              size="compact"
              className="basis-readable-action min-w-0 flex-1"
              disabled={isExporting}
              onPress={onReopen}
            >
              <Text>{copy.confirm}</Text>
            </Button>
          </>
        ) : (
          <>
            {onRetry && (
              <Button
                size="compact"
                className="basis-readable-action min-w-0 flex-1"
                disabled={isExporting}
                onPress={onRetry}
              >
                <Text>{copy.retry}</Text>
              </Button>
            )}
            {onReopen && (
              <Button
                size="compact"
                className="basis-readable-action min-w-0 flex-1"
                variant="secondary"
                disabled={isExporting}
                onPress={() => setIsConfirmingReopen(true)}
              >
                <Text>{copy.reopen}</Text>
              </Button>
            )}
          </>
        )}
      </View>
    </View>
  )
}
