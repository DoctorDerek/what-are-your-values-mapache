"use client"

import { cx } from "classix"
import { Dialog as DialogPrimitive } from "radix-ui"
import type { ComponentProps } from "react"

function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogContent({
  className,
  variant = "framed",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  variant?: "framed" | "panel"
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className="fixed inset-0 z-50 bg-black/75"
      />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cx(
          "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden text-black outline-none",
          variant === "panel"
            ? "h-[calc(100dvh-2rem)] max-w-4xl border-0 bg-transparent p-0 shadow-none xl:max-w-4xl"
            : "max-w-2xl border-4 border-black bg-white shadow-[12px_12px_0px_0px_#000000] xl:max-w-3xl",
          className,
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
