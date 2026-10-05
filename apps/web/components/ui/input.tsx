import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "classix"
import type { ComponentProps } from "react"

const inputVariants = cva(
  "border-input bg-card text-card-foreground placeholder:text-card-foreground/60 focus-visible:ring-ring focus-visible:ring-offset-card aria-invalid:border-destructive aria-invalid:ring-destructive min-h-11 w-full min-w-0 outline-none focus-visible:ring-offset-4 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-4 px-4 py-3 text-lg font-bold focus-visible:ring-4",
        emphasized:
          "border-4 px-4 py-3 text-2xl font-bold focus-visible:ring-8",
        search:
          "border-4 px-5 py-4 text-2xl font-bold shadow-[8px_8px_0px_0px_#000000] focus-visible:ring-8",
        compact:
          "border-2 px-3 py-2 text-base font-normal focus-visible:ring-4",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

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
