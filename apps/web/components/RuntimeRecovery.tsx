"use client"

import {
  runtimeRecoveryMachine,
  type RootActor,
} from "@game/machines/src/RuntimeRecovery"
import { RUNTIME_RECOVERY_COPY as copy } from "@game/machines/src/RuntimeRecoveryCopy"
import { useMachine } from "@xstate/react"
import { useEffect, useRef, useState } from "react"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { downloadPlayerDataFile } from "@/lib/PlayerDataFiles"
import useWebSemanticBack from "@/lib/useWebSemanticBack"

export default function RuntimeRecovery({
  gameActor,
  onRetry,
  onReopen,
}: {
  readonly gameActor?: RootActor
  readonly onRetry?: () => void
  readonly onReopen?: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <MapacheScreen className="flex items-center justify-center">
      <section className="flex w-full max-w-2xl flex-col gap-5 border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000] sm:p-8">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-mapache-vivid-primary-cyan text-3xl font-black outline-none sm:text-4xl"
        >
          {copy.title}
        </h1>
        <p className="text-lg font-medium text-black">
          {!gameActor
            ? copy.startupDetail
            : onReopen
              ? copy.actorDetail
              : copy.renderDetail}
        </p>
        {gameActor ? (
          <RecoveryActions
            gameActor={gameActor}
            onRetry={onRetry}
            onReopen={onReopen}
          />
        ) : (
          <Button onClick={onRetry} wrap>
            {copy.retry}
          </Button>
        )}
      </section>
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
    input: { gameActor, deliverDownload: downloadPlayerDataFile },
  })
  const [isConfirmingReopen, setIsConfirmingReopen] = useState(false)
  const isExporting = state.matches("Exporting")
  const confirmationRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (isConfirmingReopen) confirmationRef.current?.focus()
  }, [isConfirmingReopen])
  useWebSemanticBack({
    hasParent: true,
    onBack: () => {
      setIsConfirmingReopen(false)
      return true
    },
  })

  return (
    <div className="flex flex-col gap-4" aria-busy={isExporting}>
      {onRetry && (
        <Button disabled={isExporting} onClick={onRetry} wrap>
          {copy.retry}
        </Button>
      )}
      <Button
        variant="outline"
        disabled={isExporting || !gameActor.getSnapshot().context.playerData}
        onClick={() => send({ type: "RECOVERY.EXPORT", backupKind: "player" })}
        wrap
      >
        {copy.exportPlayer}
      </Button>
      <Button
        variant="outline"
        disabled={isExporting}
        onClick={() => send({ type: "RECOVERY.EXPORT", backupKind: "stored" })}
        wrap
      >
        {copy.exportStored}
      </Button>
      {state.matches("Failed") && (
        <p role="alert" className="font-bold text-black">
          {copy.exportFailed}
        </p>
      )}
      <p role="status" className="min-h-7 font-medium text-black">
        {isExporting
          ? copy.exporting
          : state.matches("Exported")
            ? copy.exportReady
            : ""}
      </p>
      {onReopen &&
        (isConfirmingReopen ? (
          <div className="flex flex-col gap-4 border-t-4 border-black pt-5">
            <h2
              ref={confirmationRef}
              tabIndex={-1}
              className="text-2xl font-black text-black outline-none"
            >
              {copy.confirmTitle}
            </h2>
            <p className="font-medium text-black">{copy.confirmDetail}</p>
            <Button
              variant="outline"
              onClick={() => setIsConfirmingReopen(false)}
              wrap
            >
              {copy.cancel}
            </Button>
            <Button disabled={isExporting} onClick={onReopen} wrap>
              {copy.confirm}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            disabled={isExporting}
            onClick={() => setIsConfirmingReopen(true)}
            wrap
          >
            {copy.reopen}
          </Button>
        ))}
    </div>
  )
}
