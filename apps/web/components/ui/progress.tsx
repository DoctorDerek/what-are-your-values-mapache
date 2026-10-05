"use client"

import { cx } from "classix"
import { Progress as ProgressPrimitive } from "radix-ui"
import * as React from "react"
import { twMerge } from "tailwind-merge"

function Progress({
  className,
  indicatorClassName,
  value,
  max = 100,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
}) {
  const progressPercentage = ((value ?? 0) / max) * 100

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={twMerge(
        cx(
          "border-border bg-card relative h-4 w-full overflow-hidden border-2",
          className,
        ),
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={twMerge(
          cx(
            "bg-primary h-full w-full transition-transform",
            indicatorClassName,
          ),
        )}
        style={{ transform: `translateX(-${100 - progressPercentage}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
