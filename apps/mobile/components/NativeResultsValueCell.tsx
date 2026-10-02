import type { BattleExitResultsFrameValue } from "@game/machines/src/BattleExitResults"
import { BATTLE_RESULTS_PRESENTATION_TICK_MS } from "@game/machines/src/BattleExitResults"
import type { BattleExitResultsMotion } from "@game/machines/src/BattleExitResultsMotion"
import { useEffect, useMemo } from "react"
import type { CellRendererProps } from "react-native"
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type EntryAnimationsValues,
  type LayoutAnimationFunction,
} from "react-native-reanimated"

export default function NativeResultsValueCell({
  children,
  item,
  onFocusCapture,
  onLayout,
  style,
}: CellRendererProps<BattleExitResultsFrameValue>) {
  const initialOffset = useSharedValue(0)
  const motion = useSharedValue<BattleExitResultsMotion>(item.motion)
  const isPromoted = item.value.exitRank < item.value.entryRank
  const cellCallbacks = { onFocusCapture, onLayout }
  const rankDistance = item.value.entryRank - item.value.exitRank
  const positionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: initialOffset.get() * (1 - motion.get().travel) },
      { translateX: `${motion.get().lateralPercentage}%` },
      { scale: motion.get().scale },
    ],
  }))

  useEffect(() => {
    const timing = {
      duration:
        item.motion.travel === 1 ? 0 : BATTLE_RESULTS_PRESENTATION_TICK_MS,
      easing: Easing.linear,
    }
    motion.set(withTiming(item.motion, timing))
    return () => {
      cancelAnimation(motion)
    }
  }, [item.motion, motion])

  const layout = useMemo<LayoutAnimationFunction>(
    () => (values) => {
      "worklet"
      const distance = values.currentOriginY - values.targetOriginY
      const boundedDistance = isPromoted
        ? Math.min(distance, values.windowHeight / 4)
        : distance
      const remainingTravel = 1 - motion.get().travel
      initialOffset.set(
        remainingTravel > 0 ? boundedDistance / remainingTravel : 0,
      )
      return {
        initialValues: { originY: values.targetOriginY },
        animations: {
          originY: withTiming(values.targetOriginY, { duration: 0 }),
        },
      }
    },
    [initialOffset, isPromoted, motion],
  )
  const entering = useMemo(
    () => (values: EntryAnimationsValues) => {
      "worklet"
      initialOffset.set(
        motion.get().travel > 0 && isPromoted
          ? Math.min(
              rankDistance * values.targetHeight,
              values.windowHeight / 4,
            )
          : 0,
      )
      return { initialValues: { opacity: 1 }, animations: { opacity: 1 } }
    },
    [initialOffset, isPromoted, rankDistance, motion],
  )

  return (
    <Animated.View
      {...cellCallbacks}
      layout={layout}
      entering={entering}
      style={[style, { zIndex: item.stackingOrder }, positionStyle]}
    >
      {children}
    </Animated.View>
  )
}
