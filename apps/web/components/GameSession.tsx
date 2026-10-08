"use client"

import type { DurableStoreAdapter } from "@game/machines/src/DurableStoreAdapter"
import { rootMachine } from "@game/machines/src/RootMachine"
import type { RootActor } from "@game/machines/src/RuntimeRecovery"
import RenderRecoveryBoundary from "@game/utils/src/RenderRecoveryBoundary"
import { useActorRef } from "@xstate/react"
import { useEffect, useMemo, useReducer, type ReactNode } from "react"
import RuntimeRecovery from "@/components/RuntimeRecovery"
import packageMetadata from "@/package.json"

export default function GameSession({
  durableStore,
  children,
  onReopen,
}: {
  readonly durableStore: DurableStoreAdapter
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
    {
      input: {
        durableStore,
        appVersion: packageMetadata.version,
        sourceBuild:
          process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "development",
        now: () => new Date().toISOString(),
        randomUuid: () => crypto.randomUUID(),
      },
    },
    observer,
  )

  useEffect(() => {
    gameActor.send({ type: "APP.HYDRATED", schedulerSeed: crypto.randomUUID() })
  }, [gameActor])

  if (gameActor.getSnapshot().status === "error")
    return <RuntimeRecovery gameActor={gameActor} onReopen={onReopen} />

  return (
    <RenderRecoveryBoundary
      fallback={(retry) => (
        <RuntimeRecovery gameActor={gameActor} onRetry={retry} />
      )}
    >
      {children(gameActor)}
    </RenderRecoveryBoundary>
  )
}
