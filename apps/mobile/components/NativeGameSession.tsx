import { rootMachine } from "@game/machines/src/RootMachine"
import type { RootActor } from "@game/machines/src/RuntimeRecovery"
import RenderRecoveryBoundary from "@game/utils/src/RenderRecoveryBoundary"
import { useActorRef } from "@xstate/react"
import * as ExpoCrypto from "expo-crypto"
import { useEffect, useMemo, useReducer, type ReactNode } from "react"
import NativeRuntimeRecovery from "@/components/NativeRuntimeRecovery"
import { expoDurableStore } from "@/lib/ExpoDurableStore"
import packageMetadata from "@/package.json"

const nativeRootMachineInput = Object.freeze({
  durableStore: expoDurableStore,
  appVersion: packageMetadata.version,
  sourceBuild: process.env.EXPO_PUBLIC_SOURCE_BUILD ?? "development",
  now: () => new Date().toISOString(),
  randomUuid: () => ExpoCrypto.randomUUID(),
})

export default function NativeGameSession({
  children,
  onReopen,
}: {
  readonly children: (gameActor: RootActor) => ReactNode
  readonly onReopen: () => void
}) {
  const [, notifyActorFailure] = useReducer(
    (revision: number) => revision + 1,
    0,
  )
  const observer = useMemo(() => ({ error: notifyActorFailure }), [])
  const gameActor = useActorRef(
    rootMachine,
    { input: nativeRootMachineInput },
    observer,
  )
  useEffect(() => {
    gameActor.send({
      type: "APP.HYDRATED",
      schedulerSeed: ExpoCrypto.randomUUID(),
    })
  }, [gameActor])

  if (gameActor.getSnapshot().status === "error")
    return <NativeRuntimeRecovery gameActor={gameActor} onReopen={onReopen} />

  return (
    <RenderRecoveryBoundary
      fallback={(retry) => (
        <NativeRuntimeRecovery gameActor={gameActor} onRetry={retry} />
      )}
    >
      {children(gameActor)}
    </RenderRecoveryBoundary>
  )
}
