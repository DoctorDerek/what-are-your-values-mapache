import SharedHubActions, {
  type HubActionGroupProps,
  type HubActionsProps,
} from "@game/ui/src/HubActions"
import { cx } from "classix"
import { View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

function HubActionGroup({ children, className }: HubActionGroupProps) {
  return <View className={className}>{children}</View>
}

export default function NativeHubActions(props: HubActionsProps) {
  return (
    <SharedHubActions
      {...props}
      Group={HubActionGroup}
      renderAction={({
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
          disabled={disabled}
          onPress={onActivate}
          accessibilityState={{ busy: isPending }}
          accessibilityLabel={accessibilityLabel ?? label}
          variant={variant === "battle" ? "default" : variant}
          size={variant === "battle" ? "default" : "compact"}
          className={className}
        >
          <Text
            android_hyphenationFrequency="normal"
            className={cx(
              "text-center",
              textClassName,
              variant === "battle" ? "text-white" : "text-black",
              isPending && "opacity-0",
            )}
          >
            {label}
          </Text>
          {isPending && (
            <View
              pointerEvents="none"
              className="absolute inset-0 items-center justify-center"
            >
              <Text className="text-center text-lg font-black text-white">
                {pendingLabel}
              </Text>
            </View>
          )}
        </Button>
      )}
    />
  )
}
