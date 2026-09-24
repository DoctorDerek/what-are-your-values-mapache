import {
  type SeethingSwarmBattleExchangeCue,
  type SeethingSwarmBattlePoint,
} from "@game/machines/src/SeethingSwarmBattleExchange"
import { useEffect, useRef, type ReactNode } from "react"
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

export default function NativeSeethingSwarmBattleTraveler({
  cue,
  travel,
  shouldReduceMotion,
  durationMs,
  onTravelComplete,
  children,
}: {
  cue: SeethingSwarmBattleExchangeCue
  travel: SeethingSwarmBattlePoint | null
  shouldReduceMotion: boolean
  durationMs: number
  onTravelComplete: () => void
  children: ReactNode
}) {
  const progress = useSharedValue(0)
  const completeRef = useRef(onTravelComplete)
  useEffect(() => {
    completeRef.current = onTravelComplete
  }, [onTravelComplete])
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.get() * (travel?.x ?? 0) },
      { translateY: progress.get() * (travel?.y ?? 0) },
    ],
  }))

  useEffect(() => {
    let isActive = true
    const finishTravel = () => {
      if (isActive && (cue === "approach" || cue === "recovery"))
        completeRef.current()
    }
    cancelAnimation(progress)
    if (!travel || shouldReduceMotion || cue === "settled") {
      progress.set(0)
      return
    }
    if (cue !== "approach" && cue !== "recovery") return
    progress.set(
      withTiming(
        cue === "recovery" ? 0 : 1,
        {
          duration: durationMs,
          easing: Easing.out(Easing.quad),
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          if (finished) scheduleOnRN(finishTravel)
        },
      ),
    )
    return () => {
      isActive = false
      cancelAnimation(progress)
    }
  }, [cue, durationMs, progress, shouldReduceMotion, travel])

  return (
    <Animated.View
      className="size-28 items-center justify-end xl:size-56"
      style={animatedStyle}
    >
      {children}
    </Animated.View>
  )
}
