import { resolveLocale } from "@game/data/src/LocaleRegistry"
import { rootMachine } from "@game/machines/src/RootMachine"
import type { RootActor } from "@game/machines/src/RuntimeRecovery"
import LocaleProvider from "@game/utils/src/LocaleContext"
import RenderRecoveryBoundary from "@game/utils/src/RenderRecoveryBoundary"
import { useActorRef } from "@xstate/react"
import * as ExpoCrypto from "expo-crypto"
import { getLocales } from "expo-localization"
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
  const [, notifyActorUpdate] = useReducer(
    (revision: number) => revision + 1,
    0,
  )
  const observer = useMemo(
    () => ({ next: notifyActorUpdate, error: notifyActorUpdate }),
    [],
  )
  const gameActor = useActorRef(
    rootMachine,
    {
      input: {
        ...nativeRootMachineInput,
        initialLocale: resolveLocale({
          preferredLanguages: getLocales().map(
            ({ languageTag }) => languageTag,
          ),
        }),
      },
    },
    observer,
  )
  useEffect(() => {
    gameActor.send({
      type: "APP.HYDRATED",
      schedulerSeed: ExpoCrypto.randomUUID(),
    })
  }, [gameActor])

  const snapshot = gameActor.getSnapshot()
  return (
    <LocaleProvider
      locale={
        snapshot.context.playerData?.settings.locale ??
        snapshot.context.initialLocale
      }
    >
      {snapshot.status === "error" ? (
        <NativeRuntimeRecovery gameActor={gameActor} onReopen={onReopen} />
      ) : (
        <RenderRecoveryBoundary
          fallback={(retry) => (
            <NativeRuntimeRecovery gameActor={gameActor} onRetry={retry} />
          )}
        >
          {children(gameActor)}
        </RenderRecoveryBoundary>
      )}
    </LocaleProvider>
  )
}
