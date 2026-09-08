"use client"

import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { motion } from "motion/react"

const ACHIEVEMENT_BANNER_DURATION_SECONDS = 8

function createAchievementBannerMotion(
  shouldReduceMotion: boolean,
  isBattlePlacement: boolean,
) {
  return shouldReduceMotion
    ? Object.freeze({
        initial: { opacity: 1 },
        animate: { opacity: [1, 1] },
        transition: { duration: ACHIEVEMENT_BANNER_DURATION_SECONDS },
      })
    : Object.freeze({
        initial: { opacity: 0, y: isBattlePlacement ? 0 : 24 },
        animate: { opacity: [0, 1, 1], y: [isBattlePlacement ? 0 : 24, 0, 0] },
        transition: {
          duration: ACHIEVEMENT_BANNER_DURATION_SECONDS,
          times: [0, 0.08, 1],
          ease: "easeOut",
        },
      })
}

export default function AchievementBanner({
  achievement,
  isAcknowledgementPending,
  placement = "screen",
  shouldReduceMotion,
  onPresented,
}: {
  achievement: AchievementPresentation | null
  isAcknowledgementPending: boolean
  placement?: "battle" | "screen"
  shouldReduceMotion: boolean
  onPresented: (achievementId: AchievementPresentation["id"]) => void
}) {
  const isBattlePlacement = placement === "battle"
  const achievementBannerMotion = createAchievementBannerMotion(
    shouldReduceMotion,
    isBattlePlacement,
  )

  if (!achievement) return null

  return (
    <motion.aside
      key={achievement.id}
      aria-label="Achievement unlocked"
      initial={achievementBannerMotion.initial}
      animate={achievementBannerMotion.animate}
      transition={achievementBannerMotion.transition}
      onAnimationComplete={() => onPresented(achievement.id)}
      className={
        isBattlePlacement
          ? "pointer-events-none relative mx-auto w-fit max-w-[calc(100%-8px)] min-w-0"
          : "pointer-events-none fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-[60] mx-auto max-w-2xl"
      }
    >
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Achievement unlocked: {achievement.title}.
      </p>
      <div
        className={`bg-mapache-vivid-white text-mapache-vivid-black relative border-black ${isBattlePlacement ? "flex min-w-0 items-center gap-[8px] border-2 px-[8px] py-[4px] shadow-[4px_4px_0px_0px_#000000]" : "pointer-events-auto max-h-[min(50dvh,16rem)] overflow-y-auto border-4 p-3 shadow-[8px_8px_0px_0px_#000000] xl:p-5"}`}
      >
        {isBattlePlacement ? (
          <span
            aria-hidden="true"
            className="shrink-0 text-[24px] leading-none"
          >
            🏆
          </span>
        ) : null}
        <div className={`min-w-0 ${isBattlePlacement ? "flex-1" : "pr-16"}`}>
          {!isBattlePlacement ? (
            <p className="text-sm font-black uppercase">Achievement Unlocked</p>
          ) : null}
          <h2
            className={`font-black [overflow-wrap:anywhere] uppercase ${isBattlePlacement ? "text-sm leading-tight" : "mt-1 text-2xl xl:mt-1 xl:text-3xl"}`}
          >
            {achievement.title}
          </h2>
        </div>
        {!isBattlePlacement ? (
          <p className="mt-3 text-lg font-bold [overflow-wrap:anywhere]">
            {achievement.requirement}
          </p>
        ) : null}
        <button
          type="button"
          aria-label="Dismiss achievement"
          disabled={isAcknowledgementPending}
          onClick={() => onPresented(achievement.id)}
          className={`pointer-events-auto cursor-pointer border-black bg-white font-black text-black shadow-[4px_4px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-wait disabled:opacity-60 ${isBattlePlacement ? "min-h-[44px] min-w-[44px] shrink-0 border-2 text-[20px]" : "absolute top-4 right-4 min-h-11 min-w-11 border-4 px-3 py-1 text-xl xl:top-5 xl:right-5"}`}
        >
          ×
        </button>
      </div>
    </motion.aside>
  )
}
