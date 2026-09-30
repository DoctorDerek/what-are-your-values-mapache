import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createBattleExitResults } from "@game/machines/src/BattleExitResults"
import {
  applyBattleChoice,
  createInitialBattleProfile,
} from "@game/machines/src/BattleProfile"
import { projectBattlePair } from "@game/machines/src/BattleScheduler"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import Results from "./Results"

function createResults() {
  const entry = createInitialBattleProfile("web-results-test-seed")
  const [winnerId] = projectBattlePair(entry.activeDeck, entry.scheduler)
  const committed = applyBattleChoice({
    profile: entry,
    winnerId,
    expectedScheduler: entry.scheduler,
  })
  const results = createBattleExitResults(entry, committed.profile)
  if (!results) throw new Error("Test Results could not be derived")
  return results
}

describe("Battle-exit Results presentation", () => {
  it("keeps the complete roster scrollable and both exits immediately actionable", () => {
    const onSeeValues = vi.fn()
    const onKeepBattling = vi.fn()
    render(
      <Results
        results={createResults()}
        runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
        shouldReduceMotion
        isMenuOpen={false}
        onOpenMenu={vi.fn()}
        onSeeValues={onSeeValues}
        onKeepBattling={onKeepBattling}
      />,
    )

    expect(screen.getByRole("heading", { name: "Results" })).toBeVisible()
    expect(
      within(
        screen.getByRole("list", { name: "Your value results" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(100)
    expect(
      within(
        screen.getByRole("region", { name: "Profile progress" }),
      ).getByText(/Profile XP 4/),
    ).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "See my values" }))
    fireEvent.click(screen.getByRole("button", { name: "Keep battling" }))
    expect(onSeeValues).toHaveBeenCalledOnce()
    expect(onKeepBattling).toHaveBeenCalledOnce()
  })

  it("settles before keyboard traversal without delaying the exit control", () => {
    const onSeeValues = vi.fn()
    render(
      <Results
        results={createResults()}
        runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
        shouldReduceMotion={false}
        isMenuOpen={false}
        onOpenMenu={vi.fn()}
        onSeeValues={onSeeValues}
        onKeepBattling={vi.fn()}
      />,
    )

    fireEvent.keyDown(window, { key: "Tab" })
    expect(
      within(
        screen.getByRole("region", { name: "Profile progress" }),
      ).getByText(/Profile XP 4/),
    ).toBeVisible()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onSeeValues).toHaveBeenCalledOnce()
  })
})
