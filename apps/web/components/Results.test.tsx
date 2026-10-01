import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import { createBattleExitResults } from "@game/machines/src/BattleExitResults"
import {
  applyBattleChoice,
  createInitialBattleProfile,
} from "@game/machines/src/BattleProfile"
import { projectBattlePair } from "@game/machines/src/BattleScheduler"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
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
  it("mounts the promoted reward in the first visible slot without a decorative focus stop", () => {
    const results = createResults()
    render(
      <Results
        results={results}
        runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
        shouldReduceMotion={false}
        isMenuOpen={false}
        onOpenMenu={vi.fn()}
        onSeeValues={vi.fn()}
        onKeepBattling={vi.fn()}
      />,
    )
    const roster = screen.getByRole("list", { name: "Your value results" })
    const firstRow = within(roster).getAllByRole("listitem")[0]
    expect(firstRow).toHaveTextContent(
      `Rank 1, ${getValueDisplayName(results.values[0].definition)}`,
    )
    expect(firstRow).toHaveTextContent("Level 1")
    expect(firstRow).not.toHaveAttribute("tabindex")
    expect(within(roster).queryAllByRole("button")).toHaveLength(0)
  })

  it("visibly fills and resets the Profile bar across two Levels on one clock", () => {
    vi.useFakeTimers()
    try {
      const results = createResults()
      const onKeepBattling = vi.fn()
      render(
        <Results
          results={results}
          runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
          shouldReduceMotion={false}
          isMenuOpen={false}
          onOpenMenu={vi.fn()}
          onSeeValues={vi.fn()}
          onKeepBattling={onKeepBattling}
        />,
      )
      const profile = screen.getByRole("region", { name: "Profile progress" })
      const bar = within(profile).getByRole("progressbar")
      expect(bar).toHaveAttribute("aria-valuenow", "0")
      expect(results.presentationDurationMs).toBe(3_700)
      fireEvent.click(screen.getByRole("button", { name: "Keep battling" }))
      expect(onKeepBattling).toHaveBeenCalledOnce()
      act(() => vi.advanceTimersByTime(900))
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThan(40)
      expect(profile).toHaveTextContent("Profile Level 1")
      act(() => vi.advanceTimersByTime(50))
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThan(50)
      expect(profile).toHaveTextContent("Profile Level 1")
      act(() => vi.advanceTimersByTime(900))
      expect(bar).toHaveAttribute("aria-valuenow", "0")
      expect(profile).toHaveTextContent("Profile Level 2")
      act(() => vi.advanceTimersByTime(900))
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThan(45)
      act(() => vi.advanceTimersByTime(900))
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThan(95)
      act(() => vi.advanceTimersByTime(50))
      expect(profile).toHaveTextContent("Profile Level 3")
      expect(profile).toHaveTextContent("Profile XP 4")
      expect(bar).toHaveAttribute("aria-valuenow", "0")
    } finally {
      vi.useRealTimers()
    }
  })

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

  it.each(["keyboard", "wheel", "touch", "focus"])(
    "settles row positions for %s while value and Profile fills continue",
    (interaction) => {
      vi.useFakeTimers()
      try {
        const onSeeValues = vi.fn()
        const results = createResults()
        render(
          <Results
            results={results}
            runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
            shouldReduceMotion={false}
            isMenuOpen={false}
            onOpenMenu={vi.fn()}
            onSeeValues={onSeeValues}
            onKeepBattling={vi.fn()}
          />,
        )

        const roster = screen.getByRole("list", { name: "Your value results" })
        const profile = screen.getByRole("region", { name: "Profile progress" })
        act(() => vi.advanceTimersByTime(900))
        const before = within(profile)
          .getByRole("progressbar")
          .getAttribute("aria-valuenow")
        if (interaction === "keyboard")
          fireEvent.keyDown(window, { key: "Tab" })
        else if (interaction === "wheel") fireEvent.wheel(roster)
        else if (interaction === "touch") fireEvent.touchStart(roster)
        else fireEvent.focus(roster)
        expect(within(profile).getByRole("progressbar")).toHaveAttribute(
          "aria-valuenow",
          before,
        )
        expect(profile).toHaveTextContent("Profile Level 1")
        const firstRow = within(roster).getAllByRole("listitem")[0]
        expect(firstRow).toHaveTextContent(
          `Rank 1, ${getValueDisplayName(results.values[0].definition)}`,
        )
        const valueBar = firstRow.querySelector(
          '[data-slot="progress-indicator"]',
        )
        expect(valueBar).toHaveAttribute(
          "style",
          expect.stringContaining("translateX(-51"),
        )
        act(() => vi.advanceTimersByTime(950))
        expect(profile).toHaveTextContent("Profile Level 2")
        expect(valueBar).toHaveAttribute(
          "style",
          expect.stringContaining("translateX(-100%)"),
        )
        act(() => vi.advanceTimersByTime(1_850))
        expect(profile).toHaveTextContent("Profile Level 3")
        expect(profile).toHaveTextContent("Profile XP 4")
        fireEvent.keyDown(window, { key: "Escape" })
        expect(onSeeValues).toHaveBeenCalledOnce()
      } finally {
        vi.useRealTimers()
      }
    },
  )
})
