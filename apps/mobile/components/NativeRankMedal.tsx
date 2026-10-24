import type { ValueRankMedalColor } from "@game/data/src/ValueRankMedal"
import { Image } from "react-native"
import { FLUENT_MEDAL_ARTWORK } from "@/lib/FluentMedalArtwork"

export default function NativeRankMedal({
  color,
}: {
  color: ValueRankMedalColor
}) {
  return (
    <Image
      source={FLUENT_MEDAL_ARTWORK[color]}
      alt=""
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      resizeMode="contain"
      className="size-6 shrink-0"
    />
  )
}
