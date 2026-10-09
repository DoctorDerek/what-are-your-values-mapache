import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "classix"
import { Slot } from "radix-ui"
import type { ComponentProps } from "react"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center gap-2 font-black transition-[transform,box-shadow,color,background-color] outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        outline:
          "bg-card text-card-foreground shadow-[6px_6px_0px_0px_#000000] hover:bg-secondary hover:text-secondary-foreground active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
        ghost:
          "border-transparent bg-transparent text-foreground hover:border-black hover:bg-accent hover:text-accent-foreground",
        link: "bg-transparent text-mapache-vivid-dark underline underline-offset-4",
        battle: "bg-mapache-vivid-primary-orange text-white",
        accent: "bg-mapache-vivid-secondary-purple text-white",
      },
      size: {
        default: "min-h-11 border-4 px-5 py-3",
        sm: "min-h-10 border-4 px-3 py-2",
        lg: "min-h-14 border-4 px-6 py-4",
        tall: "min-h-14 border-4 px-5 py-3",
        featured: "min-h-16 border-4 px-5 py-3",
        icon: "min-h-11 size-11 border-4 p-0",
        link: "min-h-11 border-0 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    compoundVariants: [
      {
        variant: ["battle", "accent"],
        className:
          "shadow-[6px_6px_0px_0px_#000000] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none",
      },
    ],
  },
)

const buttonTypographyVariants = cva("", {
  variants: {
    size: {
      default: "text-lg",
      sm: "text-base",
      lg: "text-2xl",
      tall: "text-lg",
      featured: "text-3xl",
      icon: "text-3xl leading-none",
      link: "text-base",
    },
  },
})

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  align = "center",
  wrap = false,
  typographyClassName,
  textCase = variant === "link" ? "normal-case" : "uppercase",
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    align?: "center" | "start"
    wrap?: boolean
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
      className={cx(
        buttonVariants({ variant, size: resolvedSize }),
        variant !== "ghost" && variant !== "link" && "border-black",
        textCase,
        align === "start" ? "justify-start text-left" : "justify-center",
        wrap ? "whitespace-normal" : "whitespace-nowrap",
        typographyClassName ?? buttonTypographyVariants({ size: resolvedSize }),
        className,
      )}
      {...props}
    />
  )
}

export { Button, buttonVariants }
