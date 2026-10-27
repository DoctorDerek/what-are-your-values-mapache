"use client"

import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { type PlayerDataResetReview as PlayerDataResetReviewState } from "@game/machines/src/PlayerDataReset"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

export default function PlayerDataResetReview({
  children,
  isBusy,
  review,
  onCancel,
  onConfirm,
  onExport,
}: {
  children?: ReactNode
  isBusy: boolean
  review: PlayerDataResetReviewState
  onCancel: () => void
  onConfirm: (review: PlayerDataResetReviewState) => void
  onExport: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const playerDataResetCopy = localizedCopy.interfaceCopy.resets

  const headingRef = useRef<HTMLHeadingElement>(null)
  const [acknowledgedCompleteErasure, setAcknowledgedCompleteErasure] =
    useState(false)
  const copy = playerDataResetCopy[review.resetKind]
  const requiresCompleteErasureAcknowledgment =
    review.resetKind === "delete-all-data"

  useEffect(() => {
    headingRef.current?.focus()
  }, [review.confirmationId])

  return (
    <section
      aria-labelledby="player-data-reset-review-heading"
      className="border-mapache-vivid-primary-orange flex min-h-0 flex-1 flex-col overflow-hidden border-8 bg-white [overflow-wrap:anywhere] hyphens-auto shadow-[10px_10px_0px_0px_#000000]"
    >
      <div
        data-controller-scroll
        tabIndex={0}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 xl:p-8"
      >
        {children}
        <h2
          ref={headingRef}
          id="player-data-reset-review-heading"
          tabIndex={-1}
          className="text-mapache-vivid-dark border-b-4 border-black pb-4 text-3xl font-black uppercase outline-none xl:text-5xl"
        >
          {copy.confirmationTitle}
        </h2>

        <div className="text-mapache-vivid-dark flex flex-col gap-4 text-lg font-bold xl:text-xl">
          {copy.confirmationBody.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {requiresCompleteErasureAcknowledgment ? (
          <label className="text-mapache-vivid-dark bg-mapache-vivid-light flex min-h-14 cursor-pointer items-start gap-4 border-4 border-black p-4 text-lg font-black xl:text-xl">
            <input
              type="checkbox"
              checked={acknowledgedCompleteErasure}
              disabled={isBusy}
              onChange={(event) =>
                setAcknowledgedCompleteErasure(event.currentTarget.checked)
              }
              className="mt-1 size-6 shrink-0 accent-black"
            />
            <span>
              {localizedCopy.interfaceCopy.screen.deleteAllDataAcknowledgment}
            </span>
          </label>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          size="default"
          disabled={isBusy}
          onClick={onExport}
          wrap
          className="min-w-0 flex-1 basis-[8em]"
        >
          {localizedCopy.interfaceCopy.screen.exportData}
        </Button>
      </div>
      <div className="flex shrink-0 flex-wrap gap-[12px] border-t-4 border-black p-[12px] pb-[20px] xl:p-4">
        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={isBusy}
          onClick={onCancel}
          wrap
          typographyClassName="text-base leading-tight xl:text-lg"
          className="min-w-0 flex-1 basis-[8em]"
        >
          {localizedCopy.interfaceCopy.screen.cancel}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="default"
          disabled={
            isBusy ||
            (requiresCompleteErasureAcknowledgment &&
              !acknowledgedCompleteErasure)
          }
          onClick={() => onConfirm(review)}
          wrap
          typographyClassName="text-base leading-tight xl:text-lg"
          className="min-w-0 flex-1 basis-[8em]"
        >
          {copy.actionLabel}
        </Button>
      </div>
    </section>
  )
}
