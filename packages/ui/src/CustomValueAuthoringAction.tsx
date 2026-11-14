import {
  buttonTextVariants,
  buttonTypographyVariants,
  buttonVariants,
} from "@game/ui/src/ButtonAppearance"
import type {
  AuthoringActionControlProps,
  AuthoringActionProps,
} from "@game/ui/src/CustomValueInvitationParts"
import { cx } from "classix"
import type { ComponentType } from "react"

export default function CustomValueAuthoringAction({
  Control,
  variant,
  location,
  ...props
}: AuthoringActionProps & {
  Control: ComponentType<AuthoringActionControlProps>
}) {
  const size =
    location === "discard"
      ? "confirmation"
      : location === "decision"
        ? "default"
        : "sm"
  const resolvedSize = variant === "link" ? "link" : size
  return (
    <Control
      {...props}
      variant={variant}
      size={size}
      className={cx(
        buttonVariants({ variant, size: resolvedSize }),
        variant !== "link" && "border-black",
        location === "matching" ? "justify-start" : "justify-center",
        "max-w-full whitespace-normal",
        location === "footer" && "basis-readable-action min-w-0 grow",
        location === "discard" && "w-full",
        location === "decision" && "basis-readable-decision min-w-0 flex-1",
      )}
      textClassName={cx(
        buttonTextVariants({ variant }),
        variant === "link" ? "normal-case" : "uppercase",
        location === "matching" ? "text-left" : "text-center",
        location === "decision"
          ? "text-base leading-tight xl:text-lg"
          : buttonTypographyVariants({ size: resolvedSize }),
      )}
    />
  )
}
