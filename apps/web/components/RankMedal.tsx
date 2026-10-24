import type { ValueRankMedalColor } from "@game/data/src/ValueRankMedal"
import Image from "next/image"
import { FLUENT_MEDAL_ARTWORK } from "@/lib/FluentMedalArtwork"

export default function RankMedal({ color }: { color: ValueRankMedalColor }) {
  return (
    <Image
      src={FLUENT_MEDAL_ARTWORK[color]}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      unoptimized
      className="inline-block size-6 shrink-0 object-contain align-middle"
    />
  )
}
