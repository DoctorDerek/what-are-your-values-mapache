"use client"

import { cx } from "classix"
import { Progress as ProgressPrimitive } from "radix-ui"
import type { ComponentProps, CSSProperties } from "react"

function Progress({
  className,
  indicatorClassName,
  value,
  max = 100,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string
}) {
  const progressPercentage = ((value ?? 0) / max) * 100

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cx(
        "relative w-full overflow-hidden",
        className ?? "border-border bg-card h-4 border-2",
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cx(
          "h-full w-full translate-x-(--progress-offset)",
          indicatorClassName ?? "bg-primary transition-transform",
        )}
        style={
          {
            "--progress-offset": `${progressPercentage - 100}%`,
          } as CSSProperties
        }
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
