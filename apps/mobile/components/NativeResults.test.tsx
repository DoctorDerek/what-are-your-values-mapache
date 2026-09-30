import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createBattleExitResults } from "@game/machines/src/BattleExitResults"
import {
  applyBattleChoice,
  createInitialBattleProfile,
} from "@game/machines/src/BattleProfile"
import { projectBattlePair } from "@game/machines/src/BattleScheduler"
import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, userEvent } from "@testing-library/react-native"
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
