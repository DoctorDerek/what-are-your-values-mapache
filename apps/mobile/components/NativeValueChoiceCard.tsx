import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
  type ActiveValueDefinition,
  type ValueId,
} from "@game/data/src/Value"
import { getWrappableValueDisplayName } from "@game/data/src/ValueNameTypography"
import { getValueChoiceAccessibilityLabel } from "@game/machines/src/BattleAccessibilityPresentation"
import type { BattleRewardPresentation } from "@game/machines/src/BattleRewardPresentation"
import { cx } from "classix"
import { forwardRef, useState, type ForwardedRef, type ReactNode } from "react"
import { Pressable, ScrollView, View } from "react-native"
import { Text } from "@/components/ui/text"

type NativeValueChoiceCardProps = {
  position: "first" | "second"
  value: ActiveValueDefinition
  level: number
  controlHint: string | null
  winnerId: ValueId | null
  isEnabled: boolean
  isAnimating: boolean
  combatant?: (isAttended: boolean, reward?: ReactNode) => ReactNode
  combatantHeight: number
  reward?: BattleRewardPresentation | null
  onActivate: (valueId: ValueId) => void
}

function NativeValueChoiceCard(
  {
    position,
    value,
    level,
    controlHint,
    winnerId,
    isEnabled,
    isAnimating,
    combatant,
    combatantHeight,
    reward,
    onActivate,
  }: NativeValueChoiceCardProps,
  ref: ForwardedRef<View>,
) {
  const localizedCopy = useLocaleCatalog()

  const isFirst = position === "first"
  const isWinner = isAnimating && winnerId === value.id
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const displayName = getValueDisplayName(value, localizedCopy.values)
  const displayDefinition = getValueDisplayDefinition(
    value,
    localizedCopy.values,
  )
  const handleActivate = () => onActivate(value.id)

  return (
    <>
      <Pressable
        ref={ref}
        accessibilityHint={displayDefinition}
        accessibilityLabel={getValueChoiceAccessibilityLabel({
          localization: localizedCopy,
          position,
          value,
          level,
        })}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isEnabled, selected: isWinner }}
        className={cx(
          "relative min-h-0 min-w-0 flex-1 flex-col items-center border-black xl:border-4",
          isWinner && "border-white",
          isFirst
            ? "bg-mapache-vivid-primary-cyan"
            : "bg-mapache-vivid-primary-raspberry",
        )}
        style={combatant && { paddingBottom: combatantHeight }}
        disabled={!isEnabled}
        onPress={handleActivate}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      >
        <ScrollView
          className="min-h-0 w-full min-w-0 flex-1"
          contentContainerClassName="grow px-3 pb-3 xl:px-6"
          nestedScrollEnabled
        >
          <View className="max-h-6 min-h-2 shrink grow basis-6 xl:max-h-24 xl:min-h-6 xl:basis-24" />
          <View className="w-full shrink-0 items-center">
            <Text
              accessibilityLabel={displayName}
              variant="h2"
              className="w-full min-w-0 text-center text-2xl leading-8 font-black tracking-tight text-white xl:text-5xl xl:leading-[56px]"
              android_hyphenationFrequency="full"
              lineBreakStrategyIOS="push-out"
              textBreakStrategy="balanced"
            >
              {getWrappableValueDisplayName(
                value,
                localizedCopy.values,
                localizedCopy.metadata.languageTag,
              )}
            </Text>
            <View className="mt-2 w-full min-w-0 flex-row flex-wrap items-center justify-between gap-2 xl:gap-5">
              <Text
                aria-hidden
                className={cx(
                  "w-12 shrink-0 text-center text-sm font-black text-black/50 uppercase xl:w-24 xl:text-xl",
                  !controlHint && "opacity-0",
                )}
              >
                {controlHint}
              </Text>
              <Text className="shrink-0 border-2 border-black bg-white px-2 py-1 text-sm font-black text-black uppercase shadow-[3px_3px_0px_0px_#000000] xl:border-4 xl:px-4 xl:py-2 xl:text-2xl xl:shadow-[5px_5px_0px_0px_#000000]">
                {localizedCopy.interfaceCopy.screen.compactLevel(String(level))}
              </Text>
            </View>
            <Text
              android_hyphenationFrequency="full"
              className="mt-2 w-full border-2 border-white bg-black/50 px-3 py-2 text-center text-lg leading-7 font-bold text-white xl:mt-6 xl:p-6 xl:text-xl xl:leading-8"
            >
              “{displayDefinition}”
            </Text>
          </View>
          <View className="grow" />
        </ScrollView>
        {isWinner ? (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute inset-0 border-4 border-white xl:hidden"
          />
        ) : null}
      </Pressable>
      {combatant ? (
        <Pressable
          accessible={false}
          focusable={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          disabled={!isEnabled}
          onPress={handleActivate}
          onPointerEnter={(event) => {
            if (event.nativeEvent.pointerType !== "touch") setIsHovered(true)
          }}
          onPointerLeave={() => setIsHovered(false)}
          onPointerCancel={() => setIsHovered(false)}
          className={cx(
            "absolute bottom-0 w-1/2 flex-col items-center justify-end border-black px-2 xl:border-x-4 xl:border-b-4 xl:px-4",
            isWinner ? "z-30" : "z-20",
            isFirst
              ? "bg-mapache-vivid-primary-cyan left-0"
              : "bg-mapache-vivid-primary-raspberry right-0",
          )}
          style={{ height: combatantHeight }}
        >
          <View className="w-28 items-center xl:w-56">
            {combatant(
              isEnabled && (isHovered || isFocused),
              reward ? (
                <View className="border-2 border-black bg-white px-1">
                  <Text className="text-center text-xs leading-4 font-black text-black xl:text-base">
                    {reward.label}
                  </Text>
                </View>
              ) : null,
            )}
          </View>
        </Pressable>
      ) : null}
    </>
  )
}

export default forwardRef(NativeValueChoiceCard)
