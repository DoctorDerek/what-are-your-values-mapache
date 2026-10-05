import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "classix"
import type { ComponentProps } from "react"

const textareaVariants = cva(
  "border-input bg-card text-card-foreground placeholder:text-card-foreground/60 focus-visible:ring-ring focus-visible:ring-offset-card aria-invalid:border-destructive aria-invalid:ring-destructive field-sizing-content w-full outline-none focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "min-h-24 border-4 px-4 py-3 text-lg font-bold focus-visible:ring-4",
        emphasized:
          "min-h-24 border-4 px-4 py-3 text-xl font-bold focus-visible:ring-8",
        compact:
          "min-h-16 border-2 px-3 py-2 text-base font-normal focus-visible:ring-4",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

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
