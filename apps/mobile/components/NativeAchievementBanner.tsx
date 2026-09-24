import { achievementNotificationMachine } from "@game/machines/src/AchievementNotificationMachine"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { useMachine } from "@xstate/react"
import { useCallback, useEffect } from "react"
import { AppState, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import NativeAchievementToast from "@/components/NativeAchievementToast"

export default function NativeAchievementBanner({
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
  const safeAreaInsets = useSafeAreaInsets()
  const [state, send] = useMachine(achievementNotificationMachine, {
    input: { achievements, onPresented },
  })
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

  return (
    <View
      pointerEvents="box-none"
      testID="achievement-overlay"
      className={
        placement === "battle"
          ? "absolute top-0 right-3 left-3 z-50 items-center gap-2"
          : "absolute right-3 left-3 z-50 items-center gap-2"
      }
      style={
        placement === "screen"
          ? { bottom: safeAreaInsets.bottom + 12 }
          : undefined
      }
    >
      {state.context.visible.map((achievement) => (
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
      ))}
    </View>
  )
}
