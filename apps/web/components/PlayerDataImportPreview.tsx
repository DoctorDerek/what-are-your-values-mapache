"use client"

import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { WayvmImportPreview } from "@game/machines/src/WayvmImportPreview"
import { presentWayvmImportPreview } from "@game/machines/src/WayvmImportPreviewPresentation"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

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
  const localization = useLocaleCatalog()
  const copy = localization.interfaceCopy.portability
  const facts = presentWayvmImportPreview(preview, localization)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <section
      aria-labelledby="import-preview-heading"
      aria-busy={isBusy}
      className="text-mapache-vivid-dark flex max-h-[85dvh] min-h-[min(32rem,85dvh)] min-w-0 flex-1 flex-col border-4 border-black bg-white wrap-anywhere shadow-[8px_8px_0px_0px_#000000]"
    >
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-controller-scroll
      >
        <h2
          ref={headingRef}
          id="import-preview-heading"
          tabIndex={-1}
          className="border-b-4 border-black p-[12px] text-2xl font-black uppercase outline-none xl:p-5 xl:text-3xl"
        >
          {title ?? copy.importPreviewTitle}
        </h2>
        <div className="p-3 xl:p-5">
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] gap-3">
            {facts.summary.map(({ key, label, value }) => (
              <div
                key={key}
                className="min-w-0 border-b-2 border-black/20 py-2"
              >
                <dt className="text-sm font-black">{label}</dt>
                <dd className="mt-1 text-lg font-bold wrap-anywhere">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <details className="mt-4 border-t-4 border-black pt-3">
            <summary className="min-h-11 cursor-pointer font-black focus-visible:outline-4">
              {copy.technicalDetails}
            </summary>
            <dl className="grid gap-3 xl:grid-cols-2">
              {facts.details.map(({ key, label, value }) => (
                <div
                  key={key}
                  className="min-w-0 border-b border-black/20 py-2"
                >
                  <dt className="text-sm font-bold">{label}</dt>
                  <dd className="wrap-anywhere">{value}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      </div>
      <footer className="max-h-1/2 shrink-0 overflow-y-auto border-t-4 border-black p-[12px] pb-[20px] xl:p-5">
        <p className="bg-mapache-vivid-secondary-gold border-2 border-black p-2 text-sm font-bold">
          {warning ?? copy.importPreviewWarning}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            size="sm"
            wrap
            variant="outline"
            disabled={isBusy}
            onClick={onCancel}
            className="min-w-0 flex-[1_1_8rem] wrap-anywhere max-xl:px-[12px] max-xl:py-[8px]"
          >
            {copy.importCancelAction}
          </Button>
          <Button
            size="sm"
            wrap
            disabled={isBusy}
            onClick={onConfirm}
            className="min-w-0 flex-[1_1_8rem] wrap-anywhere max-xl:px-[12px] max-xl:py-[8px]"
          >
            {confirmLabel ?? copy.importReplaceAction}
          </Button>
        </div>
      </footer>
    </section>
  )
}
