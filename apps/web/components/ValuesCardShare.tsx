"use client"

import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValuesCardDeliveryMessage,
  VALUES_CARD_SIZE,
  type ValuesCardModel,
} from "@game/data/src/ValuesCard"
import { valuesCardShareMachine } from "@game/machines/src/ValuesCardShareMachine"
import { useMachine } from "@xstate/react"
import Image, { type StaticImageData } from "next/image"
import { useEffect, type ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { prepareWebValuesCard } from "@/lib/ValuesCardExport"

export default function ValuesCardShare({
  model,
  shouldReduceMotion,
  onClose,
  onCloseAutoFocus,
}: {
  readonly model: ValuesCardModel<StaticImageData>
  readonly shouldReduceMotion: boolean
  readonly onClose: () => void
  readonly onCloseAutoFocus?: ComponentProps<
    typeof DialogContent
  >["onCloseAutoFocus"]
}) {
  const localizedCopy = useLocaleCatalog()
  const { copy } = model
  const [state, send, actor] = useMachine(valuesCardShareMachine, {
    input: { prepare: (options) => prepareWebValuesCard(model, options) },
  })
  useEffect(
    () => () => {
      actor.getSnapshot().context.artifact?.dispose()
    },
    [actor],
  )
  const { artifact, format, includeHero, includeLevels, error, outcome } = state.context
  const isDelivering = state.matches("Delivering")
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        variant="panel"
        aria-describedby={undefined}
        onCloseAutoFocus={onCloseAutoFocus}
        className="bg-mapache-vivid-dark flex min-h-0 max-w-[45rem] flex-col gap-2 border-4 border-black p-2 text-center xl:gap-4 xl:p-6"
      >
        <div
          data-controller-scroll
          tabIndex={0}
          className="flex min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain p-1 xl:gap-4"
        >
          <header>
            <DialogTitle className="text-mapache-vivid-primary-cyan text-xl leading-tight font-black xl:text-3xl">
              {copy.title}
            </DialogTitle>
          </header>
          <div
            role="group"
            aria-label={copy.format}
            className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,7rem),1fr))] gap-2 xl:w-80 xl:self-center"
          >
            {(["gif", "png"] as const).map((option) => (
              <Button
                key={option}
                size="sm"
                wrap
                textCase="normal-case"
                className="relative min-w-0"
                variant={format === option ? "secondary" : "outline"}
                aria-label={`${copy[option].name} · ${copy[option].description}`}
                aria-pressed={format === option}
                disabled={isDelivering}
                onClick={() =>
                  send({ type: "CARD_SHARE.FORMAT", format: option })
                }
              >
                {format === option && (
                  <span aria-hidden="true" className="absolute top-2 left-2">
                    ✓
                  </span>
                )}
                <span className="grid min-w-0 gap-0.5 px-3">
                  <span>{copy[option].name}</span>
                  <span className="text-sm">{copy[option].description}</span>
                </span>
              </Button>
            ))}
          </div>
          <div className="bg-player-card-background aspect-video w-full shrink-0">
            {artifact ? (
              <Image
                unoptimized
                src={
                  shouldReduceMotion
                    ? artifact.stillPreviewUri
                    : artifact.previewUri
                }
                width={VALUES_CARD_SIZE.width}
                height={VALUES_CARD_SIZE.height}
                alt={localizedCopy.interfaceCopy.screen.cardPreview(
                  model.title,
                  model.values.map((value) => value.name),
                )}
                className="h-auto w-full"
              />
            ) : (
              <div
                role="status"
                className="text-player-card-ink grid h-full place-items-center p-4 text-center font-bold"
              >
                {state.matches("Preparing") ? copy.preparing : copy.failure}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-left font-bold text-white">
            <input
              type="checkbox"
              checked={includeHero}
              disabled={isDelivering}
              className="size-6 accent-cyan-400"
              onChange={(event) =>
                send({
                  type: "CARD_SHARE.HERO",
                  includeHero: event.target.checked,
                })
              }
            />
            {copy.includeHero}
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-left font-bold text-white">
            <input
              type="checkbox"
              checked={includeLevels}
              disabled={isDelivering}
              className="size-6 accent-cyan-400"
              onChange={(event) =>
                send({ type: "CARD_SHARE.LEVELS", includeLevels: event.target.checked })
              }
            />
            {copy.includeLevels}
          </label>
          </div>
          {error && (
            <div
              role="alert"
              className="border-4 border-black bg-white p-3 text-left text-black"
            >
              <p className="font-bold">
                {artifact ? copy.deliveryFailure : copy.failure}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer">{copy.details}</summary>
                <p className="break-words">{error}</p>
              </details>
            </div>
          )}
          {artifact && !artifact.canShare && (
            <p className="text-sm text-white">{copy.unsupportedShare}</p>
          )}
          <p
            role="status"
            className="text-sm font-medium text-white empty:sr-only"
          >
            {isDelivering
              ? copy.delivering
              : getValuesCardDeliveryMessage(outcome, copy)}
          </p>
        </div>
        <footer className="flex shrink-0 flex-wrap gap-2 [overflow-wrap:anywhere] hyphens-auto">
          <Button
            size="sm"
            wrap
            variant="outline"
            className="min-w-0 flex-1 basis-[8em]"
            typographyClassName="text-base leading-tight"
            onClick={onClose}
          >
            {copy.back}
          </Button>
          {state.matches("Failed") ? (
            <Button
              size="sm"
              wrap
              className="min-w-0 flex-1 basis-[8em]"
              typographyClassName="text-base leading-tight"
              onClick={() => send({ type: "CARD_SHARE.RETRY" })}
            >
              {copy.retry}
            </Button>
          ) : (
            <Button
              size="sm"
              wrap
              className="min-w-0 flex-1 basis-[8em]"
              typographyClassName="text-base leading-tight"
              disabled={!artifact || isDelivering}
              onClick={() =>
                send({ type: "CARD_SHARE.DELIVER", delivery: "save" })
              }
            >
              {copy.save(format)}
            </Button>
          )}
          {!state.matches("Failed") && (
            <Button
              size="sm"
              wrap
              className="min-w-0 basis-full"
              typographyClassName="text-base leading-tight"
              variant="secondary"
              disabled={!artifact?.canShare || isDelivering}
              onClick={() =>
                send({ type: "CARD_SHARE.DELIVER", delivery: "share" })
              }
            >
              {copy.share(format)}
            </Button>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  )
}
