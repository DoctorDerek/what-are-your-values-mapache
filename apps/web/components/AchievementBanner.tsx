"use client"

import { achievementNotificationMachine } from "@game/machines/src/AchievementNotificationMachine"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import useRecoverableActorSnapshot from "@game/utils/src/useRecoverableActorSnapshot"
import { useActorRef } from "@xstate/react"
import { cx } from "classix"
import { useCallback, useEffect } from "react"
import AchievementToast from "@/components/AchievementToast"

export default function AchievementBanner({
  achievements,
  isAcknowledgementPending,
  placement = "content",
  shouldReduceMotion,
  onPresented,
}: {
  achievements: readonly AchievementPresentation[]
  isAcknowledgementPending: boolean
  placement?: "battle" | "content"
  shouldReduceMotion: boolean
  onPresented: (achievementId: AchievementPresentation["id"]) => void
}) {
  const actor = useActorRef(achievementNotificationMachine, {
    input: { achievements, onPresented },
  })
  const state = useRecoverableActorSnapshot(actor)
  const send = actor.send
  useEffect(() => {
    send({ type: "NOTIFICATION.SYNC", achievements })
  }, [achievements, send])
  useEffect(() => {
    const updateActivity = () =>
      send({
        type: "NOTIFICATION.APP_ACTIVITY",
        isActive: document.visibilityState !== "hidden" && document.hasFocus(),
      })
    const pause = () =>
      send({ type: "NOTIFICATION.APP_ACTIVITY", isActive: false })
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
  const handlePresented = useCallback(
    (achievementId: AchievementPresentation["id"]) => {
      send({ type: "NOTIFICATION.DISMISS", achievementId })
    },
    [send],
  )
  const isPaused =
    isAcknowledgementPending ||
    !state.context.isAppActive ||
    state.context.interactions.length > 0
  if (state.context.visible.length === 0) return null

  const stack = (
    <div
      className={cx(
        "pointer-events-none relative mx-auto flex w-80 max-w-[calc(100%-8px)] min-w-0 flex-col gap-2 [overflow-anchor:none]",
        placement === "battle" &&
          "max-h-full overflow-y-auto overscroll-contain p-1",
      )}
    >
      {state.context.visible.map((achievement) => (
        <AchievementToast
          key={achievement.id}
          achievement={achievement}
          isPaused={isPaused}
          isDismissalPending={
            isAcknowledgementPending ||
            state.context.requestedIds.includes(achievement.id)
          }
          shouldReduceMotion={shouldReduceMotion}
          onPresented={handlePresented}
          onInteraction={(kind, isActive) =>
            send({
              type: "NOTIFICATION.INTERACTION",
              interaction: { achievementId: achievement.id, kind },
              isActive,
            })
          }
        />
      ))}
    </div>
  )
  return placement === "battle" ? stack : (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 max-h-full overflow-y-auto overscroll-contain p-2">
      {stack}
    </div>
  )
}
