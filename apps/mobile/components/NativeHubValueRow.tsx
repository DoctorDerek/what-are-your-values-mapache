import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import { getLevelFromXP } from "@game/utils/src/LevelMath"
import { View } from "react-native"
import NativeRankMedal from "@/components/NativeRankMedal"
import NativeValueAnimal from "@/components/NativeValueAnimal"
import { Text } from "@/components/ui/text"

export default function NativeHubValueRow({
  rankedValue,
  showRank,
  shouldReduceMotion,
  runtimeClipCatalog,
}: {
  rankedValue: RankedValue
  showRank: boolean
  shouldReduceMotion: boolean
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
}) {
  const localizedCopy = useLocaleCatalog()
  const PERSONAL_HUB_COPY = localizedCopy.hub

  const { definition, progress, rank } = rankedValue
  const { medal, accessibleLabel } = getValueRankPresentation(
    rank,
    localizedCopy.interfaceCopy.rank,
  )
  return (
    <View className="border-player-card-frame flex-row items-center gap-2 border-b-2 px-2 py-3 xl:gap-5 xl:px-6">
      {showRank && (
        <View
          accessible
          accessibilityLabel={accessibleLabel}
          className="items-center gap-1"
        >
          <Text className="bg-player-card-rank text-player-card-ink min-w-8 text-center text-xl tabular-nums">
            #{rank}
          </Text>
          {medal && <NativeRankMedal color={medal.color} />}
        </View>
      )}
      <NativeValueAnimal
        testID={`hub-animal-${definition.id}`}
        definition={definition}
        runtimeClipCatalog={runtimeClipCatalog}
        shouldReduceMotion={shouldReduceMotion}
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
          <Text className="text-player-card-ink shrink text-lg font-black xl:text-3xl">
            {getValueDisplayName(definition, localizedCopy.values)}
          </Text>
          <Text className="text-player-card-muted text-sm">
            {PERSONAL_HUB_COPY.level(getLevelFromXP(progress.totalXp))}
          </Text>
        </View>
        <Text className="text-player-card-muted mt-1 text-sm">
          {getValueDisplayDefinition(definition, localizedCopy.values)}
        </Text>
      </View>
    </View>
  )
}
