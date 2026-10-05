import { Slot } from "@rn-primitives/slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "classix"
import type { ComponentProps } from "react"
import { Pressable } from "react-native"
import { TextClassContext } from "@/components/ui/text"

const buttonVariants = cva(
  "items-center justify-center border-black active:translate-x-[5px] active:translate-y-[5px] active:shadow-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-mapache-vivid-primary-orange",
        secondary: "bg-mapache-vivid-primary-cyan",
        outline: "bg-white",
        destructive: "bg-mapache-vivid-secondary-red",
        achievement: "bg-mapache-vivid-secondary-gold",
      },
      size: {
        default: "min-h-14 border-4 px-5 py-3",
        compact: "min-h-12 border-4 px-4 py-2",
        large: "min-h-16 border-4 px-6 py-4",
        battle: "min-h-12 border-4 px-2 py-2 xl:px-4",
        notification: "min-h-[44px] min-w-[44px] border-2 px-2 py-0",
        icon: "size-12 min-h-12 border-4 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const buttonTextVariants = cva("text-center font-black text-black uppercase", {
  variants: {
    size: {
      default: "text-xl",
      compact: "text-base",
      large: "text-2xl",
      battle: "text-sm xl:text-base",
      notification: "text-base",
      icon: "text-3xl leading-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

function Button({
  asChild = false,
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Component = asChild ? Slot : Pressable

  return (
    <TextClassContext.Provider value={buttonTextVariants({ size })}>
      <Component
        accessibilityRole="button"
        className={cx(
          buttonVariants({ variant, size }),
          size === "icon" ? "shadow-none" : "shadow-[5px_5px_0px_0px_#000000]",
          className,
        )}
        {...props}
      />
    </TextClassContext.Provider>
  )
}

export { Button, buttonTextVariants, buttonVariants }
