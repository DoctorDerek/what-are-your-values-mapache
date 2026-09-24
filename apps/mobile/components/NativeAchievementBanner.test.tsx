import { ACHIEVEMENT_CATALOG } from "@game/machines/src/AchievementCatalog"
import {
  getAchievementEnglishCopy,
  type AchievementPresentation,
} from "@game/machines/src/AchievementPresentation"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { AppState, type AppStateEvent, type AppStateStatus } from "react-native"
import NativeAchievementBanner from "@/components/NativeAchievementBanner"

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

describe("NativeAchievementBanner", () => {
  let activity: Partial<Record<AppStateEvent, (state: AppStateStatus) => void>>
  let remove: ReturnType<typeof jest.fn>
  beforeEach(() => {
    jest.useFakeTimers()
    AppState.currentState = "active"
    activity = {}
    remove = jest.fn()
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((event, listener) => {
        activity[event] = listener
        return { remove }
      })
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })
  const advance = async (milliseconds: number) => {
    await act(async () => {
      jest.advanceTimersByTime(milliseconds)
      await Promise.resolve()
    })
  }
  const props = () => ({
    achievements,
    isAcknowledgementPending: false,
    shouldReduceMotion: true,
    onPresented: jest.fn(),
  })

  it("renders nothing without pending notifications", async () => {
    const { toJSON } = await render(
      <NativeAchievementBanner {...props()} achievements={[]} />,
    )
    expect(toJSON()).toBeNull()
  })

  it.each([false, true])(
    "uses an absolute upper stack and an eight-second functional countdown with reduced motion %s",
    async (shouldReduceMotion) => {
      const settings = props()
      const { unmount } = await render(
        <NativeAchievementBanner
          {...settings}
          placement="battle"
          shouldReduceMotion={shouldReduceMotion}
        />,
      )
      const overlay = screen.getByTestId("achievement-overlay")
      expect(overlay.props.className).toContain("absolute")
      expect(overlay.props.className).toContain("top-0")
      expect(overlay.props.pointerEvents).toBe("box-none")
      expect(
        screen.getAllByRole("header").map((element) => element.props.children),
      ).toEqual(["5 Battles", "First Battle"])
      expect(screen.queryByText("10 Battles")).toBeNull()
      expect(screen.queryByText("Achievement Unlocked")).toBeNull()
      expect(
        screen.getByLabelText(
          "Achievement unlocked: First Battle. First pair compared.",
        ),
      ).toHaveProp("accessibilityLiveRegion", "polite")
      await advance(4_000)
      expect(settings.onPresented).not.toHaveBeenCalled()
      await advance(4_000)
      expect(settings.onPresented).toHaveBeenCalledTimes(2)
      expect(settings.onPresented).toHaveBeenCalledWith(achievements[0].id)
      expect(settings.onPresented).toHaveBeenCalledWith(achievements[1].id)
      await unmount()
      expect(remove).toHaveBeenCalledTimes(3)
    },
  )

  it("retains safe-area screen placement and independently dismisses the newer card", async () => {
    const settings = props()
    const { rerender } = await render(<NativeAchievementBanner {...settings} />)
    expect(screen.getByTestId("achievement-overlay")).toHaveStyle({
      bottom: 12,
    })
    const dismiss = screen.getByRole("button", {
      name: "Dismiss achievement: 5 Battles",
    })
    await fireEvent.press(dismiss)
    await fireEvent.press(dismiss)
    expect(settings.onPresented).toHaveBeenCalledTimes(1)
    expect(settings.onPresented).toHaveBeenCalledWith(achievements[1].id)
    expect(dismiss).toBeDisabled()
    await rerender(
      <NativeAchievementBanner
        {...settings}
        achievements={[achievements[0], achievements[2]]}
      />,
    )
    expect(
      screen.getAllByRole("header").map((element) => element.props.children),
    ).toEqual(["10 Battles", "First Battle"])
  })

  it("pauses touch interaction and resumes the remaining duration rather than restarting", async () => {
    const settings = { ...props(), achievements: achievements.slice(0, 1) }
    await render(<NativeAchievementBanner {...settings} />)
    await advance(2_000)
    const card = screen.getByLabelText(
      "Achievement unlocked: First Battle. First pair compared.",
    )
    await fireEvent(card, "touchStart")
    await advance(10_000)
    expect(settings.onPresented).not.toHaveBeenCalled()
    await fireEvent(card, "touchCancel")
    await advance(6_100)
    expect(settings.onPresented).toHaveBeenCalledTimes(1)
  })

  it("holds new cards while focused or hovered and handles touch release", async () => {
    const settings = { ...props(), achievements: achievements.slice(0, 1) }
    const { rerender } = await render(<NativeAchievementBanner {...settings} />)
    const dismiss = screen.getByRole("button", {
      name: "Dismiss achievement: First Battle",
    })
    await fireEvent(dismiss, "focus")
    await fireEvent(dismiss, "hoverIn")
    await rerender(
      <NativeAchievementBanner {...settings} achievements={achievements} />,
    )
    await fireEvent(dismiss, "blur")
    expect(screen.queryByText("5 Battles")).toBeNull()
    await fireEvent(dismiss, "hoverOut")
    expect(screen.getByText("5 Battles")).toBeOnTheScreen()
    const card = screen.getByLabelText(
      "Achievement unlocked: First Battle. First pair compared.",
    )
    await fireEvent(card, "touchStart")
    await fireEvent(card, "touchEnd")
  })

  it("pauses for application inactivity and Android focus loss without expiring unseen cards", async () => {
    const settings = props()
    const { rerender } = await render(
      <NativeAchievementBanner {...settings} achievements={[]} />,
    )
    await act(async () => activity.change?.("background"))
    await rerender(<NativeAchievementBanner {...settings} />)
    expect(screen.queryByTestId("achievement-overlay")).toBeNull()
    await advance(10_000)
    await act(async () => activity.change?.("active"))
    expect(screen.getAllByRole("header")).toHaveLength(2)
    await advance(2_000)
    await act(async () => activity.blur?.("active"))
    await advance(10_000)
    expect(settings.onPresented).not.toHaveBeenCalled()
    await act(async () => activity.focus?.("active"))
    await advance(6_100)
    expect(settings.onPresented).toHaveBeenCalledTimes(2)
  })

  it("disables dismissal and countdown while acknowledgement is being persisted", async () => {
    const settings = props()
    await render(
      <NativeAchievementBanner {...settings} isAcknowledgementPending />,
    )
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled()
      await fireEvent.press(button)
    }
    await advance(10_000)
    expect(settings.onPresented).not.toHaveBeenCalled()
  })
})
