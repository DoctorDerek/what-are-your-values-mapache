import { cva } from "class-variance-authority"

export const inputVariants = cva(
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

export const textareaVariants = cva(
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
