import {
  runtimeRecoveryMachine,
  type RootActor,
} from "@game/machines/src/RuntimeRecovery"
import { RUNTIME_RECOVERY_COPY as copy } from "@game/machines/src/RuntimeRecoveryCopy"
import { useMachine } from "@xstate/react"
import { useEffect, useState } from "react"
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
  return (
    <MapacheScreen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow justify-center p-5 pb-10"
      >
        <View className="mx-auto w-full max-w-2xl gap-5 border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000]">
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
          {gameActor ? (
            <RecoveryActions
              gameActor={gameActor}
              onRetry={onRetry}
              onReopen={onReopen}
            />
          ) : (
            <Button onPress={onRetry}>
              <Text>{copy.retry}</Text>
            </Button>
          )}
        </View>
      </ScrollView>
    </MapacheScreen>
  )
}

function RecoveryActions({
  gameActor,
  onRetry,
  onReopen,
}: {
  readonly gameActor: RootActor
  readonly onRetry?: () => void
  readonly onReopen?: () => void
}) {
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
    <View className="gap-4" accessibilityState={{ busy: isExporting }}>
      {onRetry && (
        <Button disabled={isExporting} onPress={onRetry}>
          <Text>{copy.retry}</Text>
        </Button>
      )}
      <Button
        variant="outline"
        disabled={isExporting || !gameActor.getSnapshot().context.playerData}
        onPress={() => send({ type: "RECOVERY.EXPORT", backupKind: "player" })}
      >
        <Text>{copy.exportPlayer}</Text>
      </Button>
      <Button
        variant="outline"
        disabled={isExporting}
        onPress={() => send({ type: "RECOVERY.EXPORT", backupKind: "stored" })}
      >
        <Text>{copy.exportStored}</Text>
      </Button>
      <NativeOperationMessages
        activity={isExporting ? copy.exporting : null}
        issue={state.matches("Failed") ? copy.exportFailed : null}
        notice={state.matches("Exported") ? copy.exportReady : null}
      />
      {onReopen &&
        (isConfirmingReopen ? (
          <View className="gap-4 border-t-4 border-black pt-5">
            <Text
              accessibilityRole="header"
              className="text-2xl font-black text-black"
            >
              {copy.confirmTitle}
            </Text>
            <Text className="font-medium text-black">{copy.confirmDetail}</Text>
            <Button
              variant="outline"
              onPress={() => setIsConfirmingReopen(false)}
            >
              <Text>{copy.cancel}</Text>
            </Button>
            <Button disabled={isExporting} onPress={onReopen}>
              <Text>{copy.confirm}</Text>
            </Button>
          </View>
        ) : (
          <Button
            variant="secondary"
            disabled={isExporting}
            onPress={() => setIsConfirmingReopen(true)}
          >
            <Text>{copy.reopen}</Text>
          </Button>
        ))}
    </View>
  )
}
