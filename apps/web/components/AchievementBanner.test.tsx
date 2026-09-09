import { ACHIEVEMENT_CATALOG } from "@game/machines/src/AchievementCatalog"
import {
  getAchievementEnglishCopy,
  type AchievementPresentation,
} from "@game/machines/src/AchievementPresentation"
import { act, fireEvent, render, screen } from "@testing-library/react"
import type { HTMLAttributes, PropsWithChildren } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import AchievementBanner from "./AchievementBanner"

type MotionAsideProps = PropsWithChildren<
  HTMLAttributes<HTMLElement> & {
    readonly initial: unknown
    readonly animate: unknown
    readonly transition: unknown
  }
>

vi.mock("motion/react", () => ({
  motion: {
    aside: ({
      children,
      initial,
      animate,
      transition,
      ...props
    }: MotionAsideProps) => (
      <aside
        {...props}
        data-motion-initial={JSON.stringify(initial)}
        data-motion-animate={JSON.stringify(animate)}
        data-motion-transition={JSON.stringify(transition)}
      >
        {children}
      </aside>
    ),
  },
}))

const firstAchievement = ACHIEVEMENT_CATALOG[0]
const firstAchievementPresentation = Object.freeze({
  id: firstAchievement.id,
  title: "First Battle",
  unlockReason: "First pair compared.",
  requirement: "Compare your first pair of values.",
  status: "unlocked",
  progress: null,
  unlockedAt: "2026-08-07T12:34:56.000Z",
  unlockedDate: "Aug 7, 2026",
}) satisfies AchievementPresentation

describe("AchievementBanner Integration", () => {
  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it("presents exact milestone copy accessibly and dismisses only its canonical ID", () => {
    const onPresented = vi.fn()

    render(
      <AchievementBanner
        achievement={firstAchievementPresentation}
        isAcknowledgementPending={false}
        shouldReduceMotion={false}
        onPresented={onPresented}
      />,
    )

    const banner = screen.getByRole("complementary", {
      name: "Achievement unlocked",
    })
    expect(banner).toHaveAttribute(
      "data-motion-initial",
      JSON.stringify({ opacity: 0, y: 24 }),
    )
    const announcement = screen.getByRole("status")
    expect(announcement).toHaveAttribute("aria-live", "polite")
    expect(announcement).toHaveAttribute("aria-atomic", "true")
    expect(announcement).toHaveTextContent(
      "Achievement unlocked: First Battle.",
    )
    expect(
      screen.getByRole("heading", { name: "First Battle" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Compare your first pair of values."),
    ).toBeInTheDocument()
    expect(
      screen.queryByText("First pair compared.", { exact: true }),
    ).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Dismiss achievement" }))

    expect(onPresented).toHaveBeenCalledExactlyOnceWith(firstAchievement.id)
  })

  it("explains a battle unlock visually and through its polite announcement", () => {
    render(
      <AchievementBanner
        achievement={firstAchievementPresentation}
        isAcknowledgementPending={false}
        placement="battle"
        shouldReduceMotion={false}
        onPresented={vi.fn()}
      />,
    )

    const banner = screen.getByRole("complementary", {
      name: "Achievement unlocked",
    })
    expect(banner).toHaveClass("relative")
    expect(banner).not.toHaveClass("fixed")
    expect(banner).toHaveAttribute(
      "data-motion-initial",
      JSON.stringify({ opacity: 0, y: 0 }),
    )
    expect(screen.queryByText("Compare your first pair of values.")).toBeNull()
    expect(
      screen.getByText("First pair compared.", { exact: true }),
    ).toBeVisible()
    expect(screen.getByRole("heading", { name: "First Battle" })).toBeVisible()
    expect(screen.getByRole("status")).toHaveTextContent(
      "Achievement unlocked: First Battle. First pair compared.",
    )
    expect(
      screen.getByRole("button", { name: "Dismiss achievement" }),
    ).toBeEnabled()
  })

  it("keeps the longer Top Five title and concise reason readable until dismissal", () => {
    const onPresented = vi.fn()
    const topFiveAchievement = ACHIEVEMENT_CATALOG.find(
      ({ id }) => id === "topFive.first",
    )!
    render(
      <AchievementBanner
        achievement={{
          ...firstAchievementPresentation,
          ...getAchievementEnglishCopy(topFiveAchievement),
          id: topFiveAchievement.id,
        }}
        isAcknowledgementPending={false}
        placement="battle"
        shouldReduceMotion={false}
        onPresented={onPresented}
      />,
    )

    expect(
      screen.getByRole("heading", { name: "Reveal Your Top Five" }),
    ).toBeVisible()
    expect(
      screen.getByText("Five values earned XP.", { exact: true }),
    ).toBeVisible()
    expect(screen.getByRole("status")).toHaveTextContent(
      "Achievement unlocked: Reveal Your Top Five. Five values earned XP.",
    )
    expect(
      screen.queryByText(
        getAchievementEnglishCopy(topFiveAchievement).requirement,
      ),
    ).toBeNull()
    const dismissButton = screen.getByRole("button", {
      name: "Dismiss achievement",
    })
    expect(dismissButton).toBeEnabled()
    fireEvent.click(dismissButton)
    expect(onPresented).toHaveBeenCalledExactlyOnceWith(topFiveAchievement.id)
  })

  it("uses canonical opaque Vivid contrast tokens for battle feedback", () => {
    render(
      <AchievementBanner
        achievement={firstAchievementPresentation}
        isAcknowledgementPending={false}
        placement="battle"
        shouldReduceMotion={false}
        onPresented={vi.fn()}
      />,
    )

    const achievementPanel = screen.getByRole("heading", {
      name: "First Battle",
    }).parentElement?.parentElement
    expect(achievementPanel).toHaveClass(
      "bg-mapache-vivid-white",
      "text-mapache-vivid-black",
    )
    expect(achievementPanel).not.toHaveClass("bg-mapache-vivid-primary-yellow")
  })

  it.each([false, true])(
    "keeps an eight-second dwell across updates with Reduced Motion %s",
    (shouldReduceMotion) => {
      vi.useFakeTimers()
      const onPresented = vi.fn()
      const props = {
        achievement: firstAchievementPresentation,
        isAcknowledgementPending: false,
        shouldReduceMotion,
        onPresented,
      }
      const { rerender } = render(<AchievementBanner {...props} />)

      act(() => vi.advanceTimersByTime(4000))
      rerender(
        <AchievementBanner
          {...props}
          achievement={{ ...firstAchievementPresentation }}
        />,
      )
      act(() => vi.advanceTimersByTime(3999))
      expect(onPresented).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(1))
      expect(onPresented).toHaveBeenCalledExactlyOnceWith(firstAchievement.id)
    },
  )

  it("cancels the old dwell when the queued milestone changes or unmounts", () => {
    vi.useFakeTimers()
    const onPresented = vi.fn()
    const props = {
      achievement: firstAchievementPresentation,
      isAcknowledgementPending: false,
      shouldReduceMotion: true,
      onPresented,
    }
    const { rerender, unmount } = render(<AchievementBanner {...props} />)
    act(() => vi.advanceTimersByTime(4000))
    const nextAchievement = {
      ...firstAchievementPresentation,
      id: ACHIEVEMENT_CATALOG[1].id,
    }
    rerender(<AchievementBanner {...props} achievement={nextAchievement} />)
    act(() => vi.advanceTimersByTime(4000))
    expect(onPresented).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(4000))
    expect(onPresented).toHaveBeenCalledExactlyOnceWith(nextAchievement.id)

    rerender(<AchievementBanner {...props} />)
    unmount()
    act(() => vi.advanceTimersByTime(8000))
    expect(onPresented).toHaveBeenCalledTimes(1)
  })

  it("removes movement under Reduced Motion while preserving readable dwell time", () => {
    render(
      <AchievementBanner
        achievement={firstAchievementPresentation}
        isAcknowledgementPending={false}
        shouldReduceMotion
        onPresented={vi.fn()}
      />,
    )

    const banner = screen.getByRole("complementary", {
      name: "Achievement unlocked",
    })
    expect(banner).toHaveAttribute(
      "data-motion-initial",
      JSON.stringify({ opacity: 1 }),
    )
    expect(banner).toHaveAttribute(
      "data-motion-animate",
      JSON.stringify({ opacity: [1, 1] }),
    )
    expect(banner).toHaveAttribute(
      "data-motion-transition",
      JSON.stringify({ duration: 8 }),
    )
  })

  it("prevents duplicate explicit dismissal while durable acknowledgement is pending", () => {
    vi.useFakeTimers()
    const onPresented = vi.fn()
    render(
      <AchievementBanner
        achievement={firstAchievementPresentation}
        isAcknowledgementPending
        shouldReduceMotion={false}
        onPresented={onPresented}
      />,
    )

    expect(
      screen.getByRole("button", { name: "Dismiss achievement" }),
    ).toBeDisabled()
    act(() => vi.advanceTimersByTime(8000))
    expect(onPresented).not.toHaveBeenCalled()
  })

  it("renders nothing without a pending milestone", () => {
    render(
      <AchievementBanner
        achievement={null}
        isAcknowledgementPending={false}
        shouldReduceMotion={false}
        onPresented={vi.fn()}
      />,
    )

    expect(
      screen.queryByRole("complementary", { name: "Achievement unlocked" }),
    ).not.toBeInTheDocument()
  })
})
