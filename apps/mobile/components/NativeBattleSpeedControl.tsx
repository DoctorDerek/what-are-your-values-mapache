import {
  BATTLE_ANIMATION_SPEED_GROUP_LABEL,
  BATTLE_ANIMATION_SPEED_OPTIONS,
  type BattleAnimationSpeed,
} from "@game/machines/src/BattleAnimationSpeed"
import { Pressable, View } from "react-native"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

export default function NativeBattleSpeedControl({ speed, disabled, onChange }: {
  speed: BattleAnimationSpeed
  disabled: boolean
  onChange: (speed: BattleAnimationSpeed) => void
}) {
  return (
    <View accessibilityLabel={BATTLE_ANIMATION_SPEED_GROUP_LABEL}
      className="max-w-full flex-row flex-wrap self-center overflow-hidden rounded-lg border-2 border-[#7899a4]">
      {BATTLE_ANIMATION_SPEED_OPTIONS.map((option) => (
        <Pressable key={option.value} accessibilityRole="button"
          accessibilityLabel={option.accessibleLabel}
          accessibilityState={{ selected: speed === option.value, disabled }}
          disabled={disabled} onPress={() => onChange(option.value)}
          className={cn(
            "min-h-12 min-w-13 flex-1 items-center justify-center px-3 py-2 focus-visible:border-mapache-vivid-primary-raspberry active:shadow-[inset_0_2px_5px_#0006] disabled:opacity-50",
            speed === option.value ? "bg-[#006d7c] hover:bg-[#005867]" : "bg-[#dcedf1] hover:bg-[#b9e6ec]",
          )}>
          <Text className={cn("text-center text-base font-bold", speed === option.value ? "text-white underline" : "text-[#153844]")}>{option.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}
