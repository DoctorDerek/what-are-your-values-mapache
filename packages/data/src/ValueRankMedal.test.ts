import { describe, expect, it } from "vitest"
import { getValueRankPresentation } from "./ValueRankMedal"

describe("current rank medal presentation", () => {
  it.each([
    [1, "🥇", "gold"],
    [5, "🥇", "gold"],
    [6, "🥈", "silver"],
    [10, "🥈", "silver"],
    [11, "🥉", "bronze"],
    [15, "🥉", "bronze"],
  ] as const)(
    "presents rank %i with its medal color, not podium place",
    (rank, emoji, color) => {
      expect(getValueRankPresentation(rank)).toEqual({
        medal: { emoji, color },
        accessibleLabel: `Rank ${rank}, ${color} medal`,
      })
    },
  )

  it.each([16, 100, 101])("keeps rank %i numbered without a medal", (rank) => {
    expect(getValueRankPresentation(rank)).toEqual({
      medal: null,
      accessibleLabel: `Rank ${rank}`,
    })
  })
})
