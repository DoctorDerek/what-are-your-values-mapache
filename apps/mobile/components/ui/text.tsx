import { Slot } from "@rn-primitives/slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cx } from "classix"
import {
  createContext,
  useContext,
  type ComponentProps,
  type RefAttributes,
} from "react"
import { Platform, Text as ReactNativeText, type Role } from "react-native"

const textVariants = cva("", {
  variants: {
    variant: {
      default: "text-base text-foreground",
      h1: "text-center text-4xl font-black tracking-tight text-foreground",
      h2: "border-b border-border pb-2 text-3xl font-black tracking-tight text-foreground",
      h3: "text-2xl font-black tracking-tight text-foreground",
      h4: "text-xl font-black tracking-tight text-foreground",
      p: "mt-3 text-base text-foreground leading-7 sm:mt-6",
      blockquote:
        "mt-4 border-l-2 pl-3 text-base text-foreground italic sm:mt-6 sm:pl-6",
      code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground",
      lead: "text-xl text-muted-foreground",
      large: "text-lg font-semibold text-foreground",
      small: "text-sm leading-none font-medium text-foreground",
      muted: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

type TextVariantProps = VariantProps<typeof textVariants>
type TextVariant = NonNullable<TextVariantProps["variant"]>

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  blockquote: Platform.select({ web: "blockquote" as Role }),
  code: Platform.select({ web: "code" as Role }),
}

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: "1",
  h2: "2",
  h3: "3",
  h4: "4",
}

const TextClassContext = createContext<string | undefined>(undefined)

function Text({
  className,
  asChild = false,
  variant = "default",
  ...props
}: ComponentProps<typeof ReactNativeText> &
  RefAttributes<typeof ReactNativeText> &
  TextVariantProps & {
    asChild?: boolean
  }) {
  const inheritedTextClassName = useContext(TextClassContext)
  const Component = asChild ? Slot : ReactNativeText

  return (
    <Component
      className={cx(
        Platform.select({
          web: cx(
            "select-text",
            (variant === "h1" ||
              variant === "h2" ||
              variant === "h3" ||
              variant === "h4") &&
              "scroll-m-20",
            variant === "h1" && "text-balance",
            variant === "h2" && "first:mt-0",
          ),
        }),
        className ??
          inheritedTextClassName ??
          textVariants({ variant: variant ?? "default" }),
      )}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  )
}

export { Text, TextClassContext }
