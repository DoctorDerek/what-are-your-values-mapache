import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import { createBattleExitResults } from "@game/machines/src/BattleExitResults"
import {
  applyBattleChoice,
  createInitialBattleProfile,
} from "@game/machines/src/BattleProfile"
import { projectBattlePair } from "@game/machines/src/BattleScheduler"
import { describe, expect, it, jest } from "@jest/globals"
import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native"
import { StyleSheet } from "react-native"
import NativeResults from "@/components/NativeResults"

function createResults() {
  const entry = createInitialBattleProfile("native-results-test-seed")
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

describe("Native Battle-exit Results", () => {
  it("expires Saved locally without removing its reserved content or restarting on remount", async () => {
    jest.useFakeTimers()
    try {
      const openedAt = new Date().toISOString()
      const props = {
        results: createResults(),
        openedAt,
        runtimeClipCatalog:
          createSeethingSwarmTypographyOnlyRuntimeClipCatalog(),
        shouldReduceMotion: true,
        isMenuOpen: false,
        onOpenMenu: jest.fn(),
        onSeeValues: jest.fn(),
        onKeepBattling: jest.fn(),
      }
      const { unmount } = await render(<NativeResults {...props} />)
      expect(screen.getByText("✓ Saved locally")).toBeOnTheScreen()
      await act(async () => jest.advanceTimersByTime(5000))
      expect(screen.queryByText("✓ Saved locally")).toBeNull()
      expect(
        screen.getByText("✓ Saved locally", { includeHiddenElements: true }),
      ).toBeTruthy()
      unmount()
      await render(<NativeResults {...props} />)
      expect(screen.queryByText("✓ Saved locally")).toBeNull()
    } finally {
      jest.useRealTimers()
    }
  })
  it("starts in entry order before bringing the canonical reward into the virtualized roster", async () => {
    jest.useFakeTimers()
    try {
      const results = createResults()
      await render(
        <NativeResults
          results={results}
          runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
          shouldReduceMotion={false}
          isMenuOpen={false}
          onOpenMenu={jest.fn()}
          onSeeValues={jest.fn()}
          onKeepBattling={jest.fn()}
        />,
      )
      expect(screen.getByLabelText(/Rank 2, Acceptance/)).toBeOnTheScreen()
      await act(async () => jest.advanceTimersByTime(50))
      const winner = results.values[0]
      const row = screen.getByLabelText(
        `Rank 1, ${getValueDisplayName(winner.definition)}, Level 3, 4 total XP`,
      )
      expect(row).toBeOnTheScreen()
      const cells = screen.container.queryAll(
        (element) =>
          StyleSheet.flatten(element.props.style)?.zIndex ===
            results.values.length &&
          typeof element.props.onLayout === "function" &&
          typeof element.props.onFocusCapture === "function",
      )
      expect(cells.length).toBeGreaterThan(0)
      expect(
        cells.some(
          (cell) =>
            cell.queryAll(
              (element) =>
                element.props.accessibilityLabel ===
                row.props.accessibilityLabel,
            ).length > 0,
        ),
      ).toBe(true)
      expect(screen.getByText("Profile Level 1")).toBeOnTheScreen()
    } finally {
      jest.useRealTimers()
    }
  })

  it("fills through intermediate Levels for 3.7 seconds without blocking actions", async () => {
    jest.useFakeTimers()
    try {
      const onSeeValues = jest.fn()
      await render(
        <NativeResults
          results={createResults()}
          runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
          shouldReduceMotion={false}
          isMenuOpen={false}
          onOpenMenu={jest.fn()}
          onSeeValues={onSeeValues}
          onKeepBattling={jest.fn()}
        />,
      )

      expect(screen.getByText("Profile Level 1")).toBeOnTheScreen()
      await act(async () => jest.advanceTimersByTime(900))
      const profile = screen.getByLabelText(/Profile Level 3, Profile XP 4/)
      const profileFill = profile.queryAll(
        (element) =>
          typeof StyleSheet.flatten(element.props.style)?.flex === "number",
      )[0]!
      expect(StyleSheet.flatten(profileFill.props.style)?.flex).toBeCloseTo(
        73.630387,
      )
      expect(screen.getByText("Profile Level 1")).toBeOnTheScreen()
      await act(async () => jest.advanceTimersByTime(950))
      expect(screen.getByText("Profile Level 2")).toBeOnTheScreen()
      await act(async () => jest.advanceTimersByTime(1_800))
      expect(screen.getByText("Profile Level 2")).toBeOnTheScreen()
      await act(async () => jest.advanceTimersByTime(50))
      expect(screen.getByText("Profile Level 3")).toBeOnTheScreen()
      expect(screen.getByText(/Profile XP 4/)).toBeOnTheScreen()
      await fireEvent.press(
        screen.getByRole("button", { name: "See my values" }),
      )
      expect(onSeeValues).toHaveBeenCalledTimes(1)
    } finally {
      jest.useRealTimers()
    }
  })

  it.each(["scrollBeginDrag", "focus"])(
    "keeps the XP clock running after %s",
    async (interaction) => {
      jest.useFakeTimers()
      try {
        await render(
          <NativeResults
            results={createResults()}
            runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
            shouldReduceMotion={false}
            isMenuOpen={false}
            onOpenMenu={jest.fn()}
            onSeeValues={jest.fn()}
            onKeepBattling={jest.fn()}
          />,
        )
        await act(async () => jest.advanceTimersByTime(900))
        await fireEvent(
          interaction === "focus"
            ? screen.getByRole("button", { name: "See my values" })
            : screen.getByLabelText("Your value results"),
          interaction,
        )
        expect(screen.getByText("Profile Level 1")).toBeOnTheScreen()
        await act(async () => jest.advanceTimersByTime(950))
        expect(screen.getByText("Profile Level 2")).toBeOnTheScreen()
        await act(async () => jest.advanceTimersByTime(1_850))
        expect(screen.getByText("Profile Level 3")).toBeOnTheScreen()
        expect(screen.getByText(/Profile XP 4/)).toBeOnTheScreen()
      } finally {
        jest.useRealTimers()
      }
    },
  )

  it("shows exact profile progress and keeps both safe-area actions available", async () => {
    const user = userEvent.setup()
    const onSeeValues = jest.fn()
    const onKeepBattling = jest.fn()
    await render(
      <NativeResults
        results={createResults()}
        runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
        shouldReduceMotion
        isMenuOpen={false}
        onOpenMenu={jest.fn()}
        onSeeValues={onSeeValues}
        onKeepBattling={onKeepBattling}
      />,
    )

    expect(screen.getByText("Results")).toBeOnTheScreen()
    expect(screen.getByText(/Profile XP 4/)).toBeOnTheScreen()
    await user.press(screen.getByRole("button", { name: "See my values" }))
    await user.press(screen.getByRole("button", { name: "Keep battling" }))
    expect(onSeeValues).toHaveBeenCalledTimes(1)
    expect(onKeepBattling).toHaveBeenCalledTimes(1)
  })
})
