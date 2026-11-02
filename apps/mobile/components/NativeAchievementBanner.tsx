import { achievementNotificationMachine } from "@game/machines/src/AchievementNotificationMachine"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import useRecoverableActorSnapshot from "@game/utils/src/useRecoverableActorSnapshot"
import { useActorRef } from "@xstate/react"
import { useCallback, useEffect } from "react"
import { AppState, ScrollView, View } from "react-native"
import NativeAchievementToast from "@/components/NativeAchievementToast"

export default function NativeAchievementBanner({
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
        isActive: AppState.currentState === "active",
      })
    updateActivity()
    const activity = AppState.addEventListener("change", (state) =>
      send({ type: "NOTIFICATION.APP_ACTIVITY", isActive: state === "active" }),
    )
    const focus = AppState.addEventListener("focus", updateActivity)
    const blur = AppState.addEventListener("blur", () =>
      send({ type: "NOTIFICATION.APP_ACTIVITY", isActive: false }),
    )
    return () => {
      activity.remove()
      focus.remove()
      blur.remove()
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

  const cards = state.context.visible.map((achievement) => (
    <NativeAchievementToast
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
  ))

  if (placement === "content")
    return (
      <ScrollView
        testID="achievement-overlay"
        pointerEvents="box-none"
        className="absolute inset-x-0 bottom-0 z-50 max-h-full"
        contentContainerClassName="items-center gap-2 p-2"
      >
        {cards}
      </ScrollView>
    )

  return (
    <View
      pointerEvents="box-none"
      testID="achievement-overlay"
      className="absolute top-0 right-3 bottom-2 left-3 z-50 items-center justify-end gap-2"
    >
      <ScrollView
        pointerEvents="box-none"
        className="max-h-full w-full grow-0"
        contentContainerClassName="items-center gap-2 p-1"
      >
        {cards}
      </ScrollView>
    </View>
  )
}
