import {
  FIRST_ARRIVAL_PRESENTATION,
  resolveFirstArrivalRaccoon,
} from "@game/data/src/FirstArrivalPresentation"
import { SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS } from "@game/data/src/SeethingSwarmAnimalPresentation"
import { useCallback, useEffect, useState } from "react"
import { View } from "react-native"
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import NativeSeethingSwarmAnimal from "@/components/NativeSeethingSwarmAnimal"
import { SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG } from "@/generated/seethingswarm/SeethingSwarmRuntimeClipCatalog"

const raccoon = resolveFirstArrivalRaccoon(
  SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG,
)

export default function NativeFirstArrivalRaccoon({
  onComplete,
}: Readonly<{ onComplete: () => void }>) {
  const [isReady, setIsReady] = useState(false)
  const handleReady = useCallback(() => setIsReady(true), [])
  const progress = useSharedValue(0)
  useEffect(() => {
    if (!raccoon) {
      onComplete()
      return
    }
    if (!isReady) return
    progress.value = withDelay(
      FIRST_ARRIVAL_PRESENTATION.raccoonDelayMs,
      withTiming(
        1,
        {
          duration: FIRST_ARRIVAL_PRESENTATION.raccoonTravelMs,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          if (finished) scheduleOnRN(onComplete)
        },
      ),
    )
    return () => cancelAnimation(progress)
  }, [isReady, onComplete, progress])
  const style = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
    transform: [
      { translateX: -(raccoon?.geometry.width ?? 0) * (1 - progress.value) },
    ],
  }))
  if (!raccoon) return null
  return (
    <View
      pointerEvents="none"
      accessible={false}
      className="absolute inset-x-0 bottom-3 overflow-hidden"
      style={{ height: raccoon.geometry.height }}
    >
      <Animated.View style={[style, { width: raccoon.geometry.width }]}>
        <NativeSeethingSwarmAnimal
          clip={raccoon.clip}
          geometry={raccoon.geometry}
          frameDurationMs={SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS}
          shouldReduceMotion={false}
          onReady={handleReady}
          onLoadError={onComplete}
        />
      </Animated.View>
    </View>
  )
}
