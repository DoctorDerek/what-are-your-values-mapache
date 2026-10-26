"use client"

import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type {
  PlayerDataResetKind,
  PlayerDataResetReview as PlayerDataResetReviewState,
} from "@game/machines/src/PlayerDataReset"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import { useEffect, useRef } from "react"
import MapacheScreen from "@/components/MapacheScreen"
import PlayerDataImportPreview from "@/components/PlayerDataImportPreview"
import PlayerDataResetActions from "@/components/PlayerDataResetActions"
import PlayerDataResetReview from "@/components/PlayerDataResetReview"
import { Button } from "@/components/ui/button"
import { WAYVM_IMPORT_FILE_ACCEPT } from "@/lib/PlayerDataFiles"

export type DataManagementActivity = string

export default function DataManagement({
  activity,
  customValueCount,
  issue,
  notice,
  preview,
  resetReview,
  onCancelImport,
  onCancelReset,
  onClose,
  onConfirmImport,
  onConfirmReset,
  onExport,
  onImportFile,
  onOpenMenu,
  onRequestReset,
}: {
  activity: DataManagementActivity | null
  customValueCount: number
  issue: string | null
  notice: string | null
  preview: WayvmImportPreview | null
  resetReview: PlayerDataResetReviewState | null
  onCancelImport: () => void
  onCancelReset: () => void
  onClose: () => void
  onConfirmImport: () => void
  onConfirmReset: (review: PlayerDataResetReviewState) => void
  onExport: () => void
  onImportFile: (file: File) => void
  onOpenMenu: () => void
  onRequestReset: (resetKind: PlayerDataResetKind) => void
}) {
  const localizedCopy = useLocaleCatalog()
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu
  const playerDataPortabilityCopy = localizedCopy.interfaceCopy.portability

  const headingRef = useRef<HTMLHeadingElement>(null)
  const issueRef = useRef<HTMLParagraphElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const chooseBackupButtonRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreChooseBackupFocusRef = useRef(false)
  const resetActionFocusTargetIdRef = useRef<string | null>(null)
  const previousResetReviewRef = useRef(resetReview)
  const isBusy = activity !== null
  const isNavigationBlocked = isBusy || preview !== null || resetReview !== null

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    issueRef.current?.focus()
  }, [issue])

  useEffect(() => {
    if (preview || !shouldRestoreChooseBackupFocusRef.current) return

    shouldRestoreChooseBackupFocusRef.current = false
    chooseBackupButtonRef.current?.focus()
  }, [preview])

  useEffect(() => {
    if (
      previousResetReviewRef.current &&
      !resetReview &&
      resetActionFocusTargetIdRef.current
    ) {
      document.getElementById(resetActionFocusTargetIdRef.current)?.focus()
    }

    previousResetReviewRef.current = resetReview
  }, [resetReview])

  const handleCancelImport = () => {
    shouldRestoreChooseBackupFocusRef.current = true
    onCancelImport()
  }

  const handleRequestReset = (
    resetKind: PlayerDataResetKind,
    focusTargetId: string,
  ) => {
    resetActionFocusTargetIdRef.current = focusTargetId
    onRequestReset(resetKind)
  }

  const operationMessages = (
    <>
      {activity ? (
        <p
          role="status"
          className="bg-mapache-vivid-primary-cyan text-mapache-vivid-dark border-4 border-black p-4 text-xl font-black uppercase shadow-[6px_6px_0px_0px_#000000]"
        >
          {activity}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="bg-mapache-vivid-secondary-green text-mapache-vivid-dark border-4 border-black p-4 text-xl font-black shadow-[6px_6px_0px_0px_#000000]"
        >
          {notice}
        </p>
      ) : null}
      {issue ? (
        <p
          ref={issueRef}
          role="alert"
          tabIndex={-1}
          className="bg-mapache-vivid-primary-orange border-4 border-black p-4 text-xl font-black text-white shadow-[6px_6px_0px_0px_#000000] outline-none"
        >
          {issue}
        </p>
      ) : null}
    </>
  )

  if (resetReview || preview)
    return (
      <MapacheScreen
        viewport="fixed"
        spacing="compact"
        className="flex flex-col"
      >
        <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
          {resetReview ? (
            <PlayerDataResetReview
              key={resetReview.confirmationId}
              isBusy={isBusy}
              review={resetReview}
              onCancel={onCancelReset}
              onConfirm={onConfirmReset}
              onExport={onExport}
            >
              {operationMessages}
            </PlayerDataResetReview>
          ) : (
            preview && (
              <PlayerDataImportPreview
                isBusy={isBusy}
                preview={preview}
                onCancel={handleCancelImport}
                onConfirm={onConfirmImport}
              >
                {operationMessages}
              </PlayerDataImportPreview>
            )
          )}
        </div>
      </MapacheScreen>
    )

  return (
    <MapacheScreen
      spacing="compact"
      viewport="fixed"
      className="flex flex-col items-center"
    >
      <div className="flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-mapache-vivid-primary-cyan text-2xl font-black wrap-anywhere uppercase drop-shadow-[3px_3px_0px_#000000] outline-none xl:text-4xl"
        >
          {playerDataPortabilityCopy.screenTitle}
        </h1>
      </div>

      <div
        aria-busy={isBusy}
        className="mt-5 min-h-0 w-full max-w-5xl flex-1 space-y-5 overflow-y-auto overscroll-contain p-1 pr-3 pb-5 [&_button]:max-w-full [&_button]:whitespace-normal"
      >
        {operationMessages}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section
            aria-labelledby="export-data-heading"
            className="flex flex-col border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000] xl:p-8"
          >
            <h2
              id="export-data-heading"
              className="text-mapache-vivid-dark border-b-4 border-black pb-4 text-3xl font-black uppercase xl:text-4xl"
            >
              {playerDataPortabilityCopy.exportTitle}
            </h2>
            <Button
              type="button"
              size="lg"
              disabled={isBusy}
              onClick={onExport}
              className="w-full"
            >
              {playerDataPortabilityCopy.exportAction}
            </Button>
            <p className="text-mapache-vivid-dark pt-4 font-bold">
              {playerDataPortabilityCopy.exportDescription}
            </p>
          </section>

          <section
            aria-labelledby="import-data-heading"
            className="flex flex-col border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000] xl:p-8"
          >
            <h2
              id="import-data-heading"
              className="text-mapache-vivid-dark border-b-4 border-black pb-4 text-3xl font-black uppercase xl:text-4xl"
            >
              {playerDataPortabilityCopy.importTitle}
            </h2>
            <input
              ref={importInputRef}
              type="file"
              accept={WAYVM_IMPORT_FILE_ACCEPT}
              disabled={isBusy}
              aria-label={localizedCopy.interfaceCopy.screen.chooseBackup}
              className="sr-only"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                if (file) onImportFile(file)
              }}
            />
            <Button
              ref={chooseBackupButtonRef}
              type="button"
              variant="secondary"
              size="lg"
              disabled={isBusy}
              onClick={() => importInputRef.current?.click()}
              className="w-full"
            >
              {playerDataPortabilityCopy.chooseBackupAction}
            </Button>
            <p className="text-mapache-vivid-dark pt-4 font-bold">
              {playerDataPortabilityCopy.importDescription}
            </p>
          </section>
        </div>
        <p className="font-bold text-white">
          {playerDataPortabilityCopy.introduction}
        </p>
        <PlayerDataResetActions
          customValueCount={customValueCount}
          isBusy={isBusy}
          onRequestReset={handleRequestReset}
        />
      </div>
      <div className="flex w-full max-w-5xl shrink-0 flex-wrap gap-3 pt-3 pb-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isNavigationBlocked}
          onClick={onOpenMenu}
          wrap
          className="min-w-0 flex-1 basis-[8em]"
        >
          {PRODUCT_MENU_COPY.openAction}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isNavigationBlocked}
          onClick={onClose}
          wrap
          className="min-w-0 flex-1 basis-[8em]"
        >
          {localizedCopy.interfaceCopy.screen.backToValues}
        </Button>
      </div>
    </MapacheScreen>
  )
}
