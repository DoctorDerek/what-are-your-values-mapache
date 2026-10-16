import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { type BattleAnimationSpeed } from "@game/machines/src/BattleAnimationSpeed"
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
  const { interfaceCopy } = useLocaleCatalog()
  return (
    <View
      accessibilityLabel={interfaceCopy.battleSpeed.label}
      className="max-w-full grow-2 basis-auto flex-row flex-wrap overflow-hidden rounded-lg border-2 border-[#7899a4]"
    >
      {interfaceCopy.battleSpeed.options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityLabel={option.accessibleLabel}
          accessibilityState={{ selected: speed === option.value, disabled }}
          disabled={disabled}
          onPress={() => onChange(option.value)}
          className={cx(
            "focus:border-mapache-vivid-primary-raspberry min-h-12 min-w-11 shrink-0 grow basis-auto items-center justify-center border-2 border-transparent px-1 py-2 active:shadow-[inset_0_2px_5px_#0006] disabled:opacity-50 xl:px-3",
            speed === option.value ? "bg-[#006d7c]" : "bg-[#dcedf1]",
          )}
        >
          <Text
            className={cx(
              "text-center text-[15px] font-bold xl:text-base",
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
