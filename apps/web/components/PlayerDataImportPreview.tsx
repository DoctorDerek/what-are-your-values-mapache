"use client"

import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import { useEffect, useRef, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

function PreviewFact({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="border-4 border-black bg-white p-4">
      <dt className="text-sm font-black tracking-wide uppercase">{label}</dt>
      <dd className="mt-1 min-w-0 text-lg font-bold [overflow-wrap:anywhere]">
        {children}
      </dd>
    </div>
  )
}

export default function PlayerDataImportPreview({
  confirmLabel,
  isBusy,
  preview,
  title,
  warning,
  onCancel,
  onConfirm,
}: {
  confirmLabel?: string
  isBusy: boolean
  preview: WayvmImportPreview
  title?: string
  warning?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const playerDataPortabilityCopy = localizedCopy.interfaceCopy.portability

  const headingRef = useRef<HTMLHeadingElement>(null)
  const formattedExportTimestamp = createLocaleFormatters(
    localizedCopy.metadata.languageTag,
  ).dateTime(preview.exportedAt)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section
      aria-labelledby="import-preview-heading"
      aria-busy={isBusy}
      className="border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000] sm:p-8"
    >
      <h2
        ref={headingRef}
        id="import-preview-heading"
        tabIndex={-1}
        className="text-mapache-vivid-dark border-b-4 border-black pb-4 text-3xl font-black uppercase outline-none sm:text-4xl"
      >
        {title ?? playerDataPortabilityCopy.importPreviewTitle}
      </h2>

      <dl className="text-mapache-vivid-dark my-6 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <PreviewFact label={playerDataPortabilityCopy.preview.backupCreated}>
          <time dateTime={preview.exportedAt}>{formattedExportTimestamp}</time>
        </PreviewFact>
        <PreviewFact
          label={playerDataPortabilityCopy.preview.sourceApplication}
        >
          {localizedCopy.interfaceCopy.screen.versionNumber(
            preview.sourceAppVersion,
          )}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.sourceBuild}>
          {preview.sourceBuild}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.saveSchema}>
          {localizedCopy.interfaceCopy.screen.versionNumber(
            String(preview.saveSchemaVersion),
          )}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.totalComparisons}>
          {preview.totalComparisons}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.canonicalCatalog}>
          {preview.canonicalCatalogVersion}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.includedValues}>
          {preview.activeValueCount - preview.customValueCount}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.customValues}>
          {preview.customValueCount}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.activeValues}>
          {preview.activeValueCount}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.currentCycle}>
          {preview.currentCycle}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.cyclePairings}>
          {preview.activePairCycleSize}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.deckRevision}>
          {preview.deckRevision}
        </PreviewFact>
        <PreviewFact
          label={playerDataPortabilityCopy.preview.progressGeneration}
        >
          {preview.progressGeneration}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.achievements}>
          {preview.unlockedAchievementCount}
        </PreviewFact>
        <PreviewFact
          label={
            playerDataPortabilityCopy.preview.achievementProgressGeneration
          }
        >
          {preview.achievementProgressGeneration}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.language}>
          {preview.locale}
        </PreviewFact>
        <PreviewFact label={playerDataPortabilityCopy.preview.replacement}>
          {localizedCopy.interfaceCopy.screen.replacesCurrentData}
        </PreviewFact>
      </dl>

      <p className="bg-mapache-vivid-secondary-gold text-mapache-vivid-black border-4 border-black p-4 text-lg font-black">
        {warning ?? playerDataPortabilityCopy.importPreviewWarning}
      </p>

      <div className="mt-6 flex flex-col gap-4 xl:flex-row">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isBusy}
          onClick={onCancel}
          className="flex-1"
        >
          {playerDataPortabilityCopy.importCancelAction}
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={isBusy}
          onClick={onConfirm}
          className="flex-1"
        >
          {confirmLabel ?? playerDataPortabilityCopy.importReplaceAction}
        </Button>
      </div>
    </section>
  )
}
