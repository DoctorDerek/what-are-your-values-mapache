"use client"

import { ACHIEVEMENT_NOTIFICATION_DURATION_MILLISECONDS } from "@game/machines/src/AchievementNotificationMachine"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { animate, motion, useMotionValue } from "motion/react"
import { useEffect } from "react"

export default function AchievementToast({
  achievement,
  isPaused,
  isDismissalPending,
  shouldReduceMotion,
  onPresented,
  onInteraction,
}: {
  achievement: AchievementPresentation
  isPaused: boolean
  isDismissalPending: boolean
  shouldReduceMotion: boolean
  onPresented: (achievementId: AchievementPresentation["id"]) => void
  onInteraction: (kind: "hover" | "focus" | "touch", isActive: boolean) => void
}) {
  const remainingTime = useMotionValue(1)
  useEffect(() => {
    if (isPaused || isDismissalPending) return
    const countdown = animate(remainingTime, 0, {
      duration:
        (remainingTime.get() * ACHIEVEMENT_NOTIFICATION_DURATION_MILLISECONDS) /
        1000,
      ease: "linear",
      onComplete: () => onPresented(achievement.id),
    })
    return () => countdown.stop()
  }, [achievement.id, isDismissalPending, isPaused, onPresented, remainingTime])

  return (
    <motion.aside
      aria-label="Achievement unlocked"
      initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      className="bg-mapache-vivid-white text-mapache-vivid-black pointer-events-auto relative min-w-0 border-2 border-black shadow-[4px_4px_0px_0px_#000000]"
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") onInteraction("hover", true)
      }}
      onPointerLeave={(event) => {
        onInteraction(event.pointerType === "touch" ? "touch" : "hover", false)
      }}
      onFocusCapture={() => onInteraction("focus", true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          onInteraction("focus", false)
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") onInteraction("touch", true)
      }}
      onPointerUp={() => onInteraction("touch", false)}
      onPointerCancel={() => onInteraction("touch", false)}
    >
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Achievement unlocked: {achievement.title}. {achievement.unlockReason}
      </p>
      <div className="flow-root px-[8px] py-[4px]">
        <button
          type="button"
          aria-label={`Dismiss achievement: ${achievement.title}`}
          disabled={isDismissalPending}
          onClick={() => onPresented(achievement.id)}
          className="float-right mb-[4px] ml-[8px] inline-grid min-h-[44px] min-w-[44px] cursor-pointer place-items-center border-2 border-black bg-white text-[20px] text-black shadow-[4px_4px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-wait disabled:opacity-60"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 20 20"
            className="size-[1em]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m6 6 8 8m0-8-8 8" />
          </svg>
        </button>
        <h2 className="text-sm leading-tight font-black [overflow-wrap:anywhere] uppercase">
          {achievement.title}
        </h2>
        <p className="text-sm leading-tight font-semibold [overflow-wrap:anywhere]">
          {achievement.unlockReason}
        </p>
      </div>
      <motion.div
        aria-hidden="true"
        data-achievement-countdown=""
        className="h-[5px] origin-left bg-[linear-gradient(to_right,#e11d48,#f97316,#facc15,#22c55e,#06b6d4,#6366f1,#c026d3)]"
        style={{ scaleX: remainingTime }}
      />
    </motion.aside>
  )
}
