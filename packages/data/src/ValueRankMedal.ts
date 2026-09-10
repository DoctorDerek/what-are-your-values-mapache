type ValueRankMedal = Readonly<{
  emoji: string
  color: "gold" | "silver" | "bronze"
}>

const VALUE_RANK_MEDAL_TIERS: readonly Readonly<{
  maximumRank: number
  medal: ValueRankMedal
}>[] = Object.freeze([
  { maximumRank: 5, medal: { emoji: "🥇", color: "gold" } },
  { maximumRank: 10, medal: { emoji: "🥈", color: "silver" } },
  { maximumRank: 15, medal: { emoji: "🥉", color: "bronze" } },
])

export function getValueRankPresentation(rank: number): Readonly<{
  medal: ValueRankMedal | null
  accessibleLabel: string
}> {
  const medal =
    VALUE_RANK_MEDAL_TIERS.find(({ maximumRank }) => rank <= maximumRank)
      ?.medal ?? null

  return {
    medal,
    accessibleLabel: medal
      ? `Rank ${rank}, ${medal.color} medal`
      : `Rank ${rank}`,
  }
}
