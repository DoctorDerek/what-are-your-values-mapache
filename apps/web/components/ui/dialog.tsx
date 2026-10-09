"use client"

import { cx } from "classix"
import { Dialog as DialogPrimitive } from "radix-ui"
import { createContext, useContext, useId, type ComponentProps } from "react"
import {
  useWebControllerActions,
  useWebControls,
} from "@/components/WebControlsProvider"

const ControllerDialogContext = createContext<string | null>(null)

function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  const controllerDialogId = useId()
  useWebControllerActions(2, (command) => {
    if (!props.open) return false
    const dialogs = document.querySelectorAll<HTMLElement>(
      "[data-controller-dialog]",
    )
    if (
      dialogs.item(dialogs.length - 1)?.dataset.controllerDialog !==
      controllerDialogId
    )
      return false
    if (command === "back" || command === "cancel") props.onOpenChange?.(false)
    return true
  })
  return (
    <ControllerDialogContext value={controllerDialogId}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </ControllerDialogContext>
  )
}

function DialogContent({
  className,
  variant = "framed",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  variant?: "framed" | "panel"
}) {
  const { controller } = useWebControls()
  const controllerDialogId = useContext(ControllerDialogContext)
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="fixed inset-0 z-50 bg-black/75"
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-controller-dialog={controllerDialogId}
        className={cx(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden text-black outline-none",
          variant === "panel"
            ? "h-[calc(100dvh-2rem)] max-w-4xl border-0 bg-transparent p-0 shadow-none xl:max-w-4xl"
            : "max-w-2xl border-4 border-black bg-white shadow-[12px_12px_0px_0px_#000000] xl:max-w-3xl",
          className,
          controller &&
            "[&_:focus]:outline-4 [&_:focus]:outline-offset-2 [&_:focus]:outline-black",
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  )
}

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={
        className ??
        "text-4xl leading-tight font-black [overflow-wrap:anywhere] uppercase xl:text-5xl"
      }
      {...props}
    />
  )
}

export { Dialog, DialogContent, DialogTitle }
