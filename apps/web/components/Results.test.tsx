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
  it("expires the accepted-save status once without removing its geometry or restarting on remount", () => {
    vi.useFakeTimers()
    try {
      const openedAt = new Date().toISOString()
      const props = {
        results: createResults(),
        openedAt,
        runtimeClipCatalog:
          createSeethingSwarmTypographyOnlyRuntimeClipCatalog(),
        shouldReduceMotion: false,
        isMenuOpen: false,
        onOpenMenu: vi.fn(),
        onSeeValues: vi.fn(),
        onKeepBattling: vi.fn(),
      }
      const view = render(<Results {...props} />)
      const status = screen.getByRole("status")
      expect(status).toHaveTextContent("Saved locally")
      act(() => vi.advanceTimersByTime(5_000))
      expect(screen.queryByRole("status")).toBeNull()
      expect(status).toBeInTheDocument()
      expect(status).toHaveStyle({ opacity: "0" })
      view.unmount()
      render(<Results {...props} />)
      expect(screen.queryByRole("status")).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
  it("keeps canonical accessible order while the visual reward starts in its before slot", () => {
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
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeCloseTo(73.630387)
      expect(profile).toHaveTextContent("Profile Level 1")
      act(() => vi.advanceTimersByTime(50))
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeCloseTo(76.33309)
      expect(profile).toHaveTextContent("Profile Level 1")
      act(() => vi.advanceTimersByTime(900))
      expect(bar).toHaveAttribute("aria-valuenow", "0")
      expect(profile).toHaveTextContent("Profile Level 2")
      act(() => vi.advanceTimersByTime(900))
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeCloseTo(73.630387)
      act(() => vi.advanceTimersByTime(900))
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeGreaterThan(95)
      expect(Number(bar.getAttribute("aria-valuenow"))).toBeLessThan(100)
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
    ).toHaveLength(103)
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

  it.each(["keyboard", "wheel", "scroll", "focus"])(
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
        expect(Number(before)).toBeCloseTo(73.630387)
        if (interaction === "keyboard")
          fireEvent.keyDown(window, { key: "Tab" })
        else if (interaction === "wheel") fireEvent.wheel(roster.parentElement!)
        else if (interaction === "scroll")
          fireEvent.scroll(roster.parentElement!)
        else fireEvent.focus(roster)
        expect(within(profile).getByRole("progressbar")).toHaveAttribute(
          "aria-valuenow",
          before,
        )
        expect(profile).toHaveTextContent("Profile Level 1")
        const firstRow = within(roster).getAllByRole("listitem")[0]
        expect(firstRow).toHaveAttribute("data-results-settled", "true")
        expect(firstRow).toHaveTextContent(
          `Rank 1, ${getValueDisplayName(results.values[0].definition)}`,
        )
        const valueBar = firstRow.querySelector(
          '[data-slot="progress-indicator"]',
        )
        expect(valueBar).toHaveAttribute(
          "style",
          expect.stringContaining("translateX(-26.369"),
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

  it("does not settle the deck merely because a touch starts on an animal", () => {
    render(
      <Results
        results={createResults()}
        runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
        shouldReduceMotion={false}
        isMenuOpen={false}
        onOpenMenu={vi.fn()}
        onSeeValues={vi.fn()}
        onKeepBattling={vi.fn()}
      />,
    )
    const roster = screen.getByRole("list", { name: "Your value results" })
    const row = within(roster).getAllByRole("listitem")[0]
    fireEvent.touchStart(row)
    expect(row).not.toHaveAttribute("data-results-settled")
    fireEvent.scroll(roster.parentElement!)
    expect(row).toHaveAttribute("data-results-settled", "true")
  })
})
