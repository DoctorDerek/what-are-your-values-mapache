import { ACHIEVEMENT_CATALOG } from "@game/machines/src/AchievementCatalog"
import {
  getAchievementEnglishCopy,
  type AchievementPresentation,
} from "@game/machines/src/AchievementPresentation"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import AchievementBanner from "@/components/AchievementBanner"

const achievements = ACHIEVEMENT_CATALOG.slice(0, 3).map(
  (achievement) =>
    ({
      id: achievement.id,
      ...getAchievementEnglishCopy(achievement),
      status: "unlocked",
      progress: null,
      unlockedAt: "2026-09-24T12:00:00.000Z",
      unlockedDate: "Sep 24, 2026",
    }) satisfies AchievementPresentation,
)

describe("Achievement overlay integration", () => {
  beforeEach(() => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("renders nothing without pending unlocks", () => {
    const { container } = render(
      <AchievementBanner
        achievements={[]}
        isAcknowledgementPending={false}
        shouldReduceMotion
        onPresented={vi.fn()}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("shows two newest-on-top compact cards with independent dismissals and FIFO overflow", () => {
    const onPresented = vi.fn()
    const props = {
      achievements,
      isAcknowledgementPending: false,
      shouldReduceMotion: true,
      onPresented,
    }
    const { rerender } = render(<AchievementBanner {...props} />)
    expect(
      screen.getAllByRole("heading").map((element) => element.textContent),
    ).toEqual(["5 Battles", "First Battle"])
    expect(screen.getAllByRole("status")).toHaveLength(2)
    expect(screen.getByText("5 pairs compared.", { exact: true })).toBeVisible()
    expect(
      screen.queryByText("Achievement Unlocked", { exact: true }),
    ).toBeNull()
    expect(screen.queryByText(achievements[1].requirement)).toBeNull()
    expect(screen.queryByText("10 Battles")).toBeNull()
    const close = screen.getByRole("button", {
      name: "Dismiss achievement: 5 Battles",
    })
    fireEvent.click(close)
    fireEvent.click(close)
    expect(onPresented).toHaveBeenCalledExactlyOnceWith(achievements[1].id)
    expect(close).toBeDisabled()
    rerender(
      <AchievementBanner
        {...props}
        achievements={[achievements[0], achievements[2]]}
      />,
    )
    expect(
      screen.getAllByRole("heading").map((element) => element.textContent),
    ).toEqual(["10 Battles", "First Battle"])
    expect(
      screen.queryByRole("button", { name: "Dismiss achievement: 5 Battles" }),
    ).toBeNull()
  })

  it("keeps focus and card order stable when a new unlock arrives during keyboard interaction", () => {
    const props = {
      achievements: achievements.slice(0, 1),
      isAcknowledgementPending: false,
      shouldReduceMotion: true,
      onPresented: vi.fn(),
    }
    const { rerender } = render(<AchievementBanner {...props} />)
    const dismiss = screen.getByRole("button", {
      name: "Dismiss achievement: First Battle",
    })
    act(() => dismiss.focus())
    rerender(<AchievementBanner {...props} achievements={achievements} />)
    expect(dismiss).toHaveFocus()
    expect(screen.queryByText("5 Battles")).toBeNull()
    act(() => dismiss.blur())
    expect(
      screen.getAllByRole("heading").map((element) => element.textContent),
    ).toEqual(["5 Battles", "First Battle"])
  })

  it("retains concise polite announcements and a decorative countdown, not a second control", () => {
    render(
      <AchievementBanner
        achievements={achievements.slice(0, 1)}
        placement="battle"
        isAcknowledgementPending={false}
        shouldReduceMotion
        onPresented={vi.fn()}
      />,
    )
    const card = screen.getByRole("complementary", {
      name: "Achievement unlocked",
    })
    expect(within(card).getByRole("status")).toHaveAttribute(
      "aria-live",
      "polite",
    )
    expect(within(card).getByRole("status")).toHaveTextContent(
      "Achievement unlocked: First Battle. First pair compared.",
    )
    expect(card.querySelector("[data-achievement-countdown]")).toHaveAttribute(
      "aria-hidden",
      "true",
    )
    expect(within(card).getAllByRole("button")).toHaveLength(1)
  })

  it("blocks explicit acknowledgement while its durable write is pending", () => {
    const onPresented = vi.fn()
    render(
      <AchievementBanner
        achievements={achievements}
        isAcknowledgementPending
        shouldReduceMotion
        onPresented={onPresented}
      />,
    )
    screen.getAllByRole("button").forEach((button) => {
      expect(button).toBeDisabled()
      fireEvent.click(button)
    })
    expect(onPresented).not.toHaveBeenCalled()
  })

  it("does not admit a new notification while the window is inactive", () => {
    const props = {
      achievements: [],
      isAcknowledgementPending: false,
      shouldReduceMotion: true,
      onPresented: vi.fn(),
    }
    const { rerender } = render(<AchievementBanner {...props} />)
    fireEvent.blur(window)
    rerender(<AchievementBanner {...props} achievements={achievements} />)
    expect(screen.queryByRole("heading")).toBeNull()
    fireEvent.focus(window)
    expect(screen.getAllByRole("heading")).toHaveLength(2)
  })
})
