"use client"

import {
  getValuesCardDeliveryMessage,
  VALUES_CARD_COPY as copy,
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

export default function ValuesCardShare({ model, shouldReduceMotion, onClose, onCloseAutoFocus }: {
  readonly model: ValuesCardModel<StaticImageData>
  readonly shouldReduceMotion: boolean
  readonly onClose: () => void
  readonly onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"]
}) {
  const [state, send, actor] = useMachine(valuesCardShareMachine, {
    input: { prepare: (options) => prepareWebValuesCard(model, options) },
  })
  useEffect(() => () => { actor.getSnapshot().context.artifact?.dispose() }, [actor])
  const { artifact, format, includeHero, error, outcome } = state.context
  const isDelivering = state.matches("Delivering")
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent variant="panel" aria-describedby={undefined} onCloseAutoFocus={onCloseAutoFocus}>
        <div className="bg-mapache-vivid-dark flex min-h-0 flex-col gap-4 overflow-y-auto border-4 border-black p-3 xl:p-6">
        <header className="flex items-center gap-3">
          <Button onClick={onClose} variant="secondary" size="sm">{copy.back}</Button>
          <DialogTitle className="text-mapache-vivid-primary-cyan min-w-0 text-xl font-black xl:text-3xl">{copy.title}</DialogTitle>
        </header>
        <div role="group" aria-label={copy.format} className="flex flex-wrap gap-3">
          {(["gif", "png"] as const).map((option) => (
            <Button key={option} size="sm" wrap variant={format === option ? "secondary" : "outline"}
              aria-pressed={format === option} disabled={isDelivering}
              onClick={() => send({ type: "CARD_SHARE.FORMAT", format: option })}>
              {format === option && <span aria-hidden="true">✓ </span>}{copy[option]}
            </Button>
          ))}
        </div>
        <div className="bg-player-card-background aspect-video w-full shrink-0">
          {artifact ? <Image unoptimized src={shouldReduceMotion ? artifact.stillPreviewUri : artifact.previewUri}
            width={VALUES_CARD_SIZE.width} height={VALUES_CARD_SIZE.height} alt={`${model.title}: ${model.values.map((value) => value.name).join(", ")}`}
            className="h-auto w-full" /> : <div role="status" className="text-player-card-ink grid h-full place-items-center p-4 text-center font-bold">{state.matches("Preparing") ? copy.preparing : copy.failure}</div>}
        </div>
        <label className="flex min-h-12 cursor-pointer items-center gap-3 font-bold text-white">
          <input type="checkbox" checked={includeHero} disabled={isDelivering} className="size-6 accent-cyan-400"
            onChange={(event) => send({ type: "CARD_SHARE.HERO", includeHero: event.target.checked })} />
          {copy.includeHero}
        </label>
        {error && <div role="alert" className="border-4 border-black bg-white p-3 text-black">
          <p className="font-bold">{artifact ? copy.deliveryFailure : copy.failure}</p>
          <details className="mt-2"><summary className="cursor-pointer">{copy.details}</summary><p className="break-words">{error}</p></details>
        </div>}
        {state.matches("Failed") ? <Button onClick={() => send({ type: "CARD_SHARE.RETRY" })}>{copy.retry}</Button> : (
          <div className="grid grid-cols-2 gap-4">
            <Button disabled={!artifact || isDelivering} wrap onClick={() => send({ type: "CARD_SHARE.DELIVER", delivery: "save" })}>{copy.save(format)}</Button>
            <Button variant="secondary" disabled={!artifact?.canShare || isDelivering} wrap onClick={() => send({ type: "CARD_SHARE.DELIVER", delivery: "share" })}>{copy.share(format)}</Button>
          </div>
        )}
        {artifact && !artifact.canShare && <p className="text-sm text-white">{copy.unsupportedShare}</p>}
        <p role="status" className="min-h-7 font-medium text-white">{isDelivering ? copy.delivering : getValuesCardDeliveryMessage(outcome)}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
