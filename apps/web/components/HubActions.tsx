import SharedHubActions, {
  hubActionIds,
  type HubActionGroupProps,
  type HubActionsProps,
} from "@game/ui/src/HubActions"
import { cx } from "classix"
import type { Ref } from "react"
import { Button } from "@/components/ui/button"

function HubActionGroup({ children, className }: HubActionGroupProps) {
  return <div className={className}>{children}</div>
}

export default function HubActions({
  browseAllValuesButtonRef,
  ...props
}: HubActionsProps & {
  browseAllValuesButtonRef?: Ref<HTMLButtonElement>
}) {
  return (
    <SharedHubActions
      {...props}
      Group={HubActionGroup}
      renderAction={({
        id,
        label,
        pendingLabel,
        accessibilityLabel,
        isPending,
        disabled,
        onActivate,
        variant,
        className,
        textClassName,
      }) => (
        <Button
          id={id}
          ref={
            id === hubActionIds.browseAllValues
              ? browseAllValuesButtonRef
              : undefined
          }
          disabled={disabled}
          onClick={onActivate}
          aria-busy={isPending}
          aria-label={accessibilityLabel}
          variant={variant}
          size={variant === "battle" ? "tall" : "sm"}
          textCase="normal-case"
          typographyClassName={textClassName}
          wrap
          className={cx(
            className,
            variant === "battle" &&
              "max-xl:basis-32 max-xl:px-[min(0.5rem,2%)]",
            id === hubActionIds.customize && "max-xl:px-1.5",
            id === hubActionIds.share && "max-xl:px-2",
            (id === hubActionIds.browseAllValues ||
              id === hubActionIds.achievements) &&
              "max-xl:px-[min(0.75rem,2%)] max-xl:py-2",
          )}
        >
          <span className={isPending ? "invisible" : undefined}>{label}</span>
          {isPending && (
            <span className="absolute inset-0 flex items-center justify-center text-lg">
              {pendingLabel}
            </span>
          )}
        </Button>
      )}
    />
  )
}
