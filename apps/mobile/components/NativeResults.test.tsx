import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
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
      await act(async () => jest.advanceTimersByTime(1_850))
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

  it.each(["scrollBeginDrag", "touchStart", "focus"])(
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
