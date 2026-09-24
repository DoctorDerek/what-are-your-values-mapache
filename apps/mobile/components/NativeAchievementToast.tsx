import { ACHIEVEMENT_NOTIFICATION_DURATION_MILLISECONDS } from "@game/machines/src/AchievementNotificationMachine"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { useEffect } from "react"
import { View } from "react-native"
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeAchievementToast({
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
  const remainingTime = useSharedValue(1)
  const countdownStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: remainingTime.get() }],
  }))
  useEffect(() => {
    if (isPaused || isDismissalPending) return
    remainingTime.set(
      withTiming(
        0,
        {
          duration:
            remainingTime.get() *
            ACHIEVEMENT_NOTIFICATION_DURATION_MILLISECONDS,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          if (finished) scheduleOnRN(onPresented, achievement.id)
        },
      ),
    )
    return () => cancelAnimation(remainingTime)
  }, [achievement.id, isDismissalPending, isPaused, onPresented, remainingTime])

  return (
    <Animated.View
      accessibilityLabel={`Achievement unlocked: ${achievement.title}. ${achievement.unlockReason}`}
      accessibilityLiveRegion="polite"
      entering={shouldReduceMotion ? undefined : FadeIn}
      className="bg-mapache-vivid-white w-full max-w-80 border-2 border-black shadow-[4px_4px_0px_0px_#000000]"
      onTouchStart={() => onInteraction("touch", true)}
      onTouchEnd={() => onInteraction("touch", false)}
      onTouchCancel={() => onInteraction("touch", false)}
    >
      <View className="flex-row items-start gap-2 px-2 py-1">
        <View className="min-w-0 flex-1">
          <Text
            accessibilityRole="header"
            className="text-mapache-vivid-black text-sm leading-tight font-black uppercase"
          >
            {achievement.title}
          </Text>
          <Text className="text-mapache-vivid-black text-sm leading-tight font-semibold">
            {achievement.unlockReason}
          </Text>
        </View>
        <Button
          accessibilityLabel={`Dismiss achievement: ${achievement.title}`}
          disabled={isDismissalPending}
          variant="outline"
          size="compact"
          className="min-h-[44px] min-w-[44px] border-2 px-2 py-0"
          onPress={() => onPresented(achievement.id)}
          onFocus={() => onInteraction("focus", true)}
          onBlur={() => onInteraction("focus", false)}
          onHoverIn={() => onInteraction("hover", true)}
          onHoverOut={() => onInteraction("hover", false)}
        >
          <Text>×</Text>
        </Button>
      </View>
      <Animated.View
        accessible={false}
        testID={`achievement-countdown-${achievement.id}`}
        className="h-[5px] origin-left bg-[linear-gradient(to_right,#e11d48,#f97316,#facc15,#22c55e,#06b6d4,#6366f1,#c026d3)]"
        style={countdownStyle}
      />
    </Animated.View>
  )
}
