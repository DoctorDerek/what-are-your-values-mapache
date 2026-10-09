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
  const snapshot = gameActor.getSnapshot()
  const isPublicArrival =
    snapshot.matches("Splash") || snapshot.matches("InitializingProfile")

  useEffect(() => {
    gameActor.send({ type: "APP.HYDRATED", schedulerSeed: crypto.randomUUID() })
  }, [gameActor])

  return (
    <div data-game-surface={isPublicArrival ? "arrival" : "active"}>
      {snapshot.status === "error" ? (
        <RuntimeRecovery gameActor={gameActor} onReopen={onReopen} />
      ) : (
        <RenderRecoveryBoundary
          fallback={(retry) => (
            <RuntimeRecovery gameActor={gameActor} onRetry={retry} />
          )}
        >
          {children(gameActor)}
        </RenderRecoveryBoundary>
      )}
    </div>
  )
}
