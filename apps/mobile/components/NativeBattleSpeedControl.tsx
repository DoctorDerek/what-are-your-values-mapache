import {
  BATTLE_ANIMATION_SPEED_GROUP_LABEL,
  BATTLE_ANIMATION_SPEED_OPTIONS,
  type BattleAnimationSpeed,
} from "@game/machines/src/BattleAnimationSpeed"
import { cx } from "classix"
import { Pressable, View } from "react-native"
import { Text } from "@/components/ui/text"

export default function NativeBattleSpeedControl({
  speed,
  disabled,
  onChange,
}: {
  speed: BattleAnimationSpeed
  disabled: boolean
  onChange: (speed: BattleAnimationSpeed) => void
}) {
  return (
    <View
      accessibilityLabel={BATTLE_ANIMATION_SPEED_GROUP_LABEL}
      className="max-w-full flex-row flex-wrap self-center overflow-hidden rounded-lg border-2 border-[#7899a4]"
    >
      {BATTLE_ANIMATION_SPEED_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityLabel={option.accessibleLabel}
          accessibilityState={{ selected: speed === option.value, disabled }}
          disabled={disabled}
          onPress={() => onChange(option.value)}
          className={cx(
            "focus:border-mapache-vivid-primary-raspberry min-h-12 min-w-13 flex-1 items-center justify-center border-2 border-transparent px-3 py-2 active:shadow-[inset_0_2px_5px_#0006] disabled:opacity-50",
            speed === option.value ? "bg-[#006d7c]" : "bg-[#dcedf1]",
          )}
        >
          <Text
            className={cx(
              "text-center text-base font-bold",
              speed === option.value
                ? "text-white underline"
                : "text-[#153844]",
            )}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
