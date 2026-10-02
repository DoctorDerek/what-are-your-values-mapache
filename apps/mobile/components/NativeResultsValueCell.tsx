import type { BattleExitResultsFrameValue } from "@game/machines/src/BattleExitResults"
import { BATTLE_RESULTS_PRESENTATION_TICK_MS } from "@game/machines/src/BattleExitResults"
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
  const travel = useSharedValue(item.motion.travel)
  const lateralPercentage = useSharedValue(item.motion.lateralPercentage)
  const scale = useSharedValue(item.motion.scale)
  const isPromoted = item.value.exitRank < item.value.entryRank
  const cellCallbacks = { onFocusCapture, onLayout }
  const rankDistance = item.value.entryRank - item.value.exitRank
  const positionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: initialOffset.get() * (1 - travel.get()) },
      { translateX: `${lateralPercentage.get()}%` },
      { scale: scale.get() },
    ],
  }))

  useEffect(() => {
    const timing = {
      duration:
        item.motion.travel === 1 ? 0 : BATTLE_RESULTS_PRESENTATION_TICK_MS,
      easing: Easing.linear,
    }
    travel.set(withTiming(item.motion.travel, timing))
    lateralPercentage.set(withTiming(item.motion.lateralPercentage, timing))
    scale.set(withTiming(item.motion.scale, timing))
    return () => {
      cancelAnimation(travel)
      cancelAnimation(lateralPercentage)
      cancelAnimation(scale)
    }
  }, [item.motion, travel, lateralPercentage, scale])

  const layout = useMemo<LayoutAnimationFunction>(
    () => (values) => {
      "worklet"
      const distance = values.currentOriginY - values.targetOriginY
      const boundedDistance = isPromoted
        ? Math.min(distance, values.windowHeight / 4)
        : distance
      const remainingTravel = 1 - travel.get()
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
    [initialOffset, isPromoted, travel],
  )
  const entering = useMemo(
    () => (values: EntryAnimationsValues) => {
      "worklet"
      initialOffset.set(
        travel.get() > 0 && isPromoted
          ? Math.min(
              rankDistance * values.targetHeight,
              values.windowHeight / 4,
            )
          : 0,
      )
      return { initialValues: { opacity: 1 }, animations: { opacity: 1 } }
    },
    [initialOffset, isPromoted, rankDistance, travel],
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
