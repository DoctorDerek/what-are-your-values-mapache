import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import ValueSummaryRow, {
  type ValueSummaryPresentation,
  type ValueSummaryRowParts,
} from "@game/ui/src/ValueSummaryRow"
import { View } from "react-native"
import NativeRankMedal from "@/components/NativeRankMedal"
import NativeValueAnimal from "@/components/NativeValueAnimal"
import { Text } from "@/components/ui/text"

const Group: ValueSummaryRowParts["Group"] = ({ children, className }) => (
  <View className={className}>{children}</View>
)

const parts: ValueSummaryRowParts = {
  Frame: Group,
  Group,
  Name: ({ children, className, accessibilityLabel }) => (
    <Text
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel}
      android_hyphenationFrequency="normal"
      className={className}
    >
      {children}
    </Text>
  ),
  Text,
  Medal: NativeRankMedal,
}

export default function NativeHubValueRow({
  rankedValue,
  showRank,
  shouldReduceMotion,
  runtimeClipCatalog,
  presentation = "hub",
}: {
  rankedValue: RankedValue
  showRank: boolean
  shouldReduceMotion: boolean
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
  presentation?: ValueSummaryPresentation
}) {
  return (
    <ValueSummaryRow
      value={rankedValue}
      hasComparisons={showRank}
      presentation={presentation}
      parts={parts}
      animal={
        <NativeValueAnimal
          testID={`${presentation === "hub" ? "hub" : "matching"}-animal-${rankedValue.definition.id}`}
          definition={rankedValue.definition}
          runtimeClipCatalog={runtimeClipCatalog}
          shouldReduceMotion={shouldReduceMotion}
        />
      }
    />
  )
}
