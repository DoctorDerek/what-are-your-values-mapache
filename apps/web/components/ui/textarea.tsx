import { textareaVariants } from "@game/ui/src/TextFieldAppearance"
import type { VariantProps } from "class-variance-authority"
import { cx } from "classix"
import type { ComponentProps } from "react"

function Textarea({
  className,
  variant,
  ...props
}: ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cx(textareaVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Textarea }
