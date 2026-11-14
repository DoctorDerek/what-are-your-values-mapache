import type { ControllerCommand } from "@game/data/src/ControllerControls"
import {
  buttonTextVariants,
  buttonTypographyVariants,
  buttonVariants,
} from "@game/ui/src/ButtonAppearance"
import type { VariantProps } from "class-variance-authority"
import { cx } from "classix"
import { Slot } from "radix-ui"
import type { ComponentProps } from "react"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  align = "center",
  wrap = false,
  controllerAction,
  typographyClassName,
  textCase = variant === "link" ? "normal-case" : "uppercase",
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    align?: "center" | "start"
    wrap?: boolean
    controllerAction?: Extract<ControllerCommand, "menu">
    typographyClassName?: string
    textCase?: "normal-case" | "uppercase"
  }) {
  const Component = asChild ? Slot.Root : "button"
  const resolvedSize = variant === "link" ? "link" : size

  return (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-controller-action={controllerAction}
      className={cx(
        buttonVariants({ variant, size: resolvedSize }),
        buttonTextVariants({ variant }),
        variant !== "ghost" && variant !== "link" && "border-black",
        textCase,
        align === "start" ? "justify-start text-left" : "justify-center",
        wrap ? "max-w-full whitespace-normal" : "whitespace-nowrap",
        typographyClassName ?? buttonTypographyVariants({ size: resolvedSize }),
        className,
      )}
      {...props}
    />
  )
}

export { Button }
