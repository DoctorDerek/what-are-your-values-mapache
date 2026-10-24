import { readAchievementId } from "@game/machines/src/AchievementCatalog"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, userEvent } from "@testing-library/react-native"
import NativeAchievements from "@/components/NativeAchievements"

const lockedAchievement = Object.freeze({
  id: readAchievementId("battle.first", "Native achievement test ID"),
  title: "First Battle",
  unlockReason: "First pair compared.",
  requirement: "Compare your first pair of values.",
  status: "locked",
  progress: Object.freeze({
    kind: "numeric",
    current: 0,
    target: 1,
    label: "0 of 1 comparisons",
  }),
  unlockedAt: null,
  unlockedDate: null,
} satisfies AchievementPresentation)

const unlockedAchievement = Object.freeze({
  id: readAchievementId("battle.5", "Native achievement test ID"),
  title: "5 Battles",
  unlockReason: "5 pairs compared.",
  requirement: "Compare 5 pairs of values.",
  status: "unlocked",
  progress: null,
  unlockedAt: "2026-08-28T12:00:00.000Z",
  unlockedDate: "Aug 28, 2026",
} satisfies AchievementPresentation)

describe("NativeAchievements", () => {
  it("offers one non-destructive return action without interactive milestone rows", async () => {
    const onClose = jest.fn()
    const user = userEvent.setup()
    await render(
      <NativeAchievements
        achievements={[lockedAchievement]}
        canClose
        onClose={onClose}
      />,
    )

    const close = screen.getByRole("button", { name: "Back" })
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(screen.queryByText("Local Milestones")).toBeNull()
    expect(close).toBeEnabled()

    await user.press(close)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("keeps navigation inert while achievement acknowledgement is pending", async () => {
    const onClose = jest.fn()
    const user = userEvent.setup()
    await render(
      <NativeAchievements
        achievements={[lockedAchievement]}
        canClose={false}
        onClose={onClose}
      />,
    )

    const close = screen.getByRole("button", { name: "Back" })
    expect(close).toBeDisabled()

    await user.press(close)

    expect(onClose).not.toHaveBeenCalled()
  })

  it("distinguishes locked progress from completed milestone dates", async () => {
    await render(
      <NativeAchievements
        achievements={[lockedAchievement, unlockedAchievement]}
        canClose
        onClose={jest.fn()}
      />,
    )

    expect(screen.getByText("1 of 2 unlocked")).toBeOnTheScreen()
    expect(screen.getByText("Not unlocked")).toBeOnTheScreen()
    expect(screen.getByText("0 of 1 comparisons")).toBeOnTheScreen()
    expect(screen.getByText("Unlocked")).toBeOnTheScreen()
    expect(screen.getByText("Unlocked Aug 28, 2026")).toBeOnTheScreen()
  })
})
