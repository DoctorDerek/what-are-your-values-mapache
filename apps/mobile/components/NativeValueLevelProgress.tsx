import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import { View } from "react-native"
import { Text } from "@/components/ui/text"

export default function NativeValueLevelProgress({
  totalXp,
}: {
  totalXp: number
}) {
  const localizedCopy = useLocaleCatalog()

  const { level, earnedXpTowardNextLevel, requiredXpForNextLevel } =
    getLevelProgressFromXP(totalXp)

  return (
    <View className="w-36 max-w-full min-w-0 gap-2 border-4 border-black bg-white px-3 py-2 xl:w-44">
      <Text className="text-mapache-vivid-primary-raspberry text-right text-lg font-black uppercase">
        {localizedCopy.interfaceCopy.screen.valueLevel(String(level))}
      </Text>
      <View
        accessibilityLabel={localizedCopy.interfaceCopy.screen.xpTowardLevel(
          String(level + 1),
        )}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: requiredXpForNextLevel,
          now: earnedXpTowardNextLevel,
        }}
        className="h-3 flex-row overflow-hidden border-2 border-black bg-white"
      >
        <View
          className="bg-mapache-vivid-primary-raspberry"
          style={{ flex: earnedXpTowardNextLevel }}
        />
        <View
          style={{
            flex: requiredXpForNextLevel - earnedXpTowardNextLevel,
          }}
        />
      </View>
      <Text className="text-mapache-vivid-primary-raspberry text-left text-sm font-black uppercase">
        {localizedCopy.interfaceCopy.screen.xpFraction(
          String(earnedXpTowardNextLevel),
          String(requiredXpForNextLevel),
        )}
      </Text>
    </View>
  )
}
