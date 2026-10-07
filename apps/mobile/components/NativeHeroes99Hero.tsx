import {
  HEROES99_IDLE_FRAME_DURATION_MS,
  type Heroes99Appearance,
} from "@game/data/src/Heroes99Appearance"
import { DRESSING_ROOM_COPY } from "@game/data/src/Heroes99DressingRoom"
import { HEROES99_IDLE_FRAME_COUNT } from "@game/data/src/Heroes99SpatialArchitecture"
import { useEffect, useState } from "react"
import { AppState, Image, View } from "react-native"
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import { useResolveClassNames } from "uniwind"
import { Text } from "@/components/ui/text"
import { HEROES99_ASSETS } from "@/generated/heroes99/Heroes99Assets"
import { composeNativeHeroes99 } from "@/lib/ComposeNativeHeroes99"

type HeroStrip = Awaited<ReturnType<typeof composeNativeHeroes99>>

export default function NativeHeroes99Hero({
  appearance,
  shouldReduceMotion,
  sizeClassName = "h-40",
}: {
  appearance: Heroes99Appearance
  shouldReduceMotion: boolean
  sizeClassName?: string
}) {
  const sizing = useResolveClassNames(sizeClassName)
  const height = typeof sizing.height === "number" ? sizing.height : 160
  const stageWidth = typeof sizing.width === "number" ? sizing.width : height
  const [strip, setStrip] = useState<HeroStrip | null>(null)
  const [failed, setFailed] = useState(false)
  const [readySource, setReadySource] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(AppState.currentState === "active")
  const progress = useSharedValue(0)
  const scale = strip
    ? Math.min(stageWidth / strip.width, height / strip.height)
    : 1
  const width = strip ? strip.width * scale : stageWidth
  const imageHeight = strip ? strip.height * scale : height
  const motion = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -Math.min(HEROES99_IDLE_FRAME_COUNT - 1, Math.floor(progress.get())) *
          width,
      },
    ],
  }))
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) =>
      setIsActive(state === "active"),
    )
    return () => listener.remove()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void composeNativeHeroes99(appearance, HEROES99_ASSETS, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setStrip(result)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [appearance])
  useEffect(() => {
    cancelAnimation(progress)
    progress.set(0)
    if (!shouldReduceMotion && isActive && strip?.source.uri === readySource)
      progress.set(
        withRepeat(
          withTiming(HEROES99_IDLE_FRAME_COUNT, {
            duration:
              HEROES99_IDLE_FRAME_DURATION_MS * HEROES99_IDLE_FRAME_COUNT,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          }),
          -1,
          false,
          undefined,
          ReduceMotion.Never,
        ),
      )
    return () => cancelAnimation(progress)
  }, [isActive, progress, readySource, shouldReduceMotion, strip])
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        failed ? DRESSING_ROOM_COPY.placeholder : DRESSING_ROOM_COPY.character
      }
      className="items-center justify-end overflow-hidden"
      style={{ width: stageWidth, height }}
    >
      {strip && !failed ? (
        <View
          testID="heroes99-frame-viewport"
          className="relative overflow-hidden"
          style={{ width, height: imageHeight }}
        >
          <Animated.View
            testID="heroes99-idle-strip"
            className="absolute top-0 left-0"
            style={[
              { width: width * HEROES99_IDLE_FRAME_COUNT, height: imageHeight },
              motion,
            ]}
          >
            <Image
              alt=""
              aria-hidden
              testID="heroes99-idle-image"
              fadeDuration={0}
              source={strip.source}
              resizeMode="stretch"
              style={{
                width: width * HEROES99_IDLE_FRAME_COUNT,
                height: imageHeight,
              }}
              onLoad={() => setReadySource(strip.source.uri)}
              onError={() => setFailed(true)}
            />
          </Animated.View>
        </View>
      ) : (
        <Text className="text-center text-sm text-black">
          {failed ? DRESSING_ROOM_COPY.placeholder : DRESSING_ROOM_COPY.loading}
        </Text>
      )}
    </View>
  )
}
