"use client"

import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  runtimeRecoveryMachine,
  type RootActor,
} from "@game/machines/src/RuntimeRecovery"
import { useMachine } from "@xstate/react"
import { useEffect, useRef, useState, type ReactNode } from "react"
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
  const localizedCopy = useLocaleCatalog()
  const copy = localizedCopy.interfaceCopy.runtimeRecovery

  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const content = (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-mapache-vivid-primary-cyan text-3xl font-black outline-none xl:text-4xl"
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
    </>
  )
  return (
    <MapacheScreen
      viewport="fixed"
      spacing="compact"
      className="flex items-stretch justify-center"
    >
      <section className="flex min-h-0 w-full max-w-2xl flex-col border-4 border-black bg-white p-3 shadow-[8px_8px_0px_0px_#000000] xl:p-5">
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
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-2">
              {content}
            </div>
            <Button className="mt-3 shrink-0" onClick={onRetry} wrap>
              {copy.retry}
            </Button>
          </>
        )}
      </section>
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
    <div className="flex min-h-0 flex-1 flex-col" aria-busy={isExporting}>
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-2"
        data-controller-scroll
        tabIndex={0}
      >
        {children}
        <Button
          variant="outline"
          disabled={isExporting || !gameActor.getSnapshot().context.playerData}
          onClick={() =>
            send({ type: "RECOVERY.EXPORT", backupKind: "player" })
          }
          wrap
        >
          {copy.exportPlayer}
        </Button>
        <Button
          variant="outline"
          disabled={isExporting}
          onClick={() =>
            send({ type: "RECOVERY.EXPORT", backupKind: "stored" })
          }
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

        {isConfirmingReopen && (
          <>
            <h2
              ref={confirmationRef}
              tabIndex={-1}
              className="text-2xl font-black text-black outline-none"
            >
              {copy.confirmTitle}
            </h2>
            <p className="font-medium text-black">{copy.confirmDetail}</p>
          </>
        )}
      </div>
      <footer className="flex shrink-0 flex-wrap gap-3 border-t-4 border-black pt-3 pb-2">
        {isConfirmingReopen ? (
          <>
            <Button
              wrap
              className="min-w-0 flex-1 basis-[8em]"
              variant="outline"
              onClick={() => setIsConfirmingReopen(false)}
            >
              {copy.cancel}
            </Button>
            <Button
              wrap
              className="min-w-0 flex-1 basis-[8em]"
              disabled={isExporting}
              onClick={onReopen}
            >
              {copy.confirm}
            </Button>
          </>
        ) : (
          <>
            {onRetry && (
              <Button
                wrap
                className="min-w-0 flex-1 basis-[8em]"
                disabled={isExporting}
                onClick={onRetry}
              >
                {copy.retry}
              </Button>
            )}
            {onReopen && (
              <Button
                wrap
                className="min-w-0 flex-1 basis-[8em]"
                variant="secondary"
                disabled={isExporting}
                onClick={() => setIsConfirmingReopen(true)}
              >
                {copy.reopen}
              </Button>
            )}
          </>
        )}
      </footer>
    </div>
  )
}
