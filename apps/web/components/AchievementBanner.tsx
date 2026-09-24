"use client"

import { achievementNotificationMachine } from "@game/machines/src/AchievementNotificationMachine"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { useMachine } from "@xstate/react"
import { useCallback, useEffect } from "react"
import AchievementToast from "@/components/AchievementToast"

export default function AchievementBanner({
  achievements,
  isAcknowledgementPending,
  placement = "screen",
  shouldReduceMotion,
  onPresented,
}: {
  achievements: readonly AchievementPresentation[]
  isAcknowledgementPending: boolean
  placement?: "battle" | "screen"
  shouldReduceMotion: boolean
  onPresented: (achievementId: AchievementPresentation["id"]) => void
}) {
  const [state, send] = useMachine(achievementNotificationMachine, {
    input: { achievements, onPresented },
  })
  useEffect(() => {
    send({ type: "NOTIFICATION.SYNC", achievements })
  }, [achievements, send])
  useEffect(() => {
    const updateActivity = () => send({
      type: "NOTIFICATION.APP_ACTIVITY",
      isActive: document.visibilityState !== "hidden" && document.hasFocus(),
    })
    const pause = () => send({ type: "NOTIFICATION.APP_ACTIVITY", isActive: false })
    updateActivity()
    document.addEventListener("visibilitychange", updateActivity)
    window.addEventListener("focus", updateActivity)
    window.addEventListener("blur", pause)
    return () => {
      document.removeEventListener("visibilitychange", updateActivity)
      window.removeEventListener("focus", updateActivity)
      window.removeEventListener("blur", pause)
    }
  }, [send])
  const handlePresented = useCallback((achievementId: AchievementPresentation["id"]) => {
    send({ type: "NOTIFICATION.DISMISS", achievementId })
  }, [send])
  const isPaused = isAcknowledgementPending || !state.context.isAppActive || state.context.interactions.length > 0
  if (state.context.visible.length === 0) return null

  return (
    <div className={placement === "battle"
      ? "pointer-events-none relative mx-auto flex w-80 max-w-[calc(100%-8px)] min-w-0 flex-col gap-2 [overflow-anchor:none]"
      : "pointer-events-none fixed right-[max(0.75rem,env(safe-area-inset-right))] bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] z-[60] mx-auto flex max-w-80 flex-col gap-2 [overflow-anchor:none]"}>
      {state.context.visible.map(achievement => (
        <AchievementToast
          key={achievement.id}
          achievement={achievement}
          isPaused={isPaused}
          isDismissalPending={isAcknowledgementPending || state.context.requestedIds.includes(achievement.id)}
          shouldReduceMotion={shouldReduceMotion}
          onPresented={handlePresented}
          onInteraction={(kind, isActive) => send({
            type: "NOTIFICATION.INTERACTION",
            interaction: { achievementId: achievement.id, kind },
            isActive,
          })}
        />
      ))}
    </div>
  )
}
