export type ValueRankMedalColor = "gold" | "silver" | "bronze"

export const FLUENT_MEDAL_SOURCE_SIZE = Object.freeze({
  width: 256,
  height: 256,
})

export type ValueRankMedalArtwork<Asset> = Readonly<
  Record<ValueRankMedalColor, Asset>
>

type ValueRankMedal = Readonly<{
  color: ValueRankMedalColor
}>

const VALUE_RANK_MEDAL_TIERS: readonly Readonly<{
  maximumRank: number
  medal: ValueRankMedal
}>[] = Object.freeze([
  { maximumRank: 5, medal: { color: "gold" } },
  { maximumRank: 10, medal: { color: "silver" } },
  { maximumRank: 15, medal: { color: "bronze" } },
])

export const VALUE_RANK_COPY = Object.freeze({
  gold: "gold",
  silver: "silver",
  bronze: "bronze",
  rank: (rank: number) => `Rank ${rank}`,
  medal: (rank: number, color: string) => `Rank ${rank}, ${color} medal`,
})

export function getValueRankPresentation(
  rank: number,
  copy: {
    readonly gold: string
    readonly silver: string
    readonly bronze: string
    readonly rank: (rank: number) => string
    readonly medal: (rank: number, color: string) => string
  } = VALUE_RANK_COPY,
): Readonly<{
  medal: ValueRankMedal | null
  accessibleLabel: string
}> {
  const medal =
    VALUE_RANK_MEDAL_TIERS.find(({ maximumRank }) => rank <= maximumRank)
      ?.medal ?? null

  return {
    medal,
    accessibleLabel: medal
      ? copy.medal(rank, copy[medal.color])
      : copy.rank(rank),
  }
}
