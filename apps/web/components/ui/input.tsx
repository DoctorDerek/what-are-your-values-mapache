import { inputVariants } from "@game/ui/src/TextFieldAppearance"
import type { VariantProps } from "class-variance-authority"
import { cx } from "classix"
import type { ComponentProps } from "react"

function Input({
  className,
  type,
  variant,
  ...props
}: ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cx(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input }
