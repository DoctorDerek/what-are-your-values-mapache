import bronze from "@game/data/assets/fluent-medals/bronze.png"
import gold from "@game/data/assets/fluent-medals/gold.png"
import silver from "@game/data/assets/fluent-medals/silver.png"
import type { ValueRankMedalArtwork } from "@game/data/src/ValueRankMedal"
import type { StaticImageData } from "next/image"

export const FLUENT_MEDAL_ARTWORK = {
  gold,
  silver,
  bronze,
} as const satisfies ValueRankMedalArtwork<StaticImageData>
