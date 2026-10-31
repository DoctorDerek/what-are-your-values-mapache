import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import {
  getHeroes99PresentationFrames,
  HEROES99_FLOURISHES,
  HEROES99_IDLE_CLIP,
} from "@game/data/src/Heroes99Presentation"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { heroes99AttentionMachine } from "@game/machines/src/Heroes99AttentionMachine"
import { useMachine } from "@xstate/react"
import { useEffect, useState } from "react"
import { AppState, Image, Pressable, View } from "react-native"
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { useResolveClassNames } from "uniwind"
import { Text } from "@/components/ui/text"
import { HEROES99_ASSETS } from "@/generated/heroes99/Heroes99Assets"
import { composeNativeHeroes99 } from "@/lib/ComposeNativeHeroes99"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

type HeroStrip = Awaited<ReturnType<typeof composeNativeHeroes99>>

export default function NativeHeroes99Hero({
  appearance,
  shouldReduceMotion,
  sizeClassName = "h-40",
  interactive = false,
}: {
  appearance: Heroes99Appearance
  shouldReduceMotion: boolean
  sizeClassName?: string
  interactive?: boolean
}) {
  const localizedCopy = useLocaleCatalog()
  const DRESSING_ROOM_COPY = localizedCopy.interfaceCopy.dressingRoom

  const sizing = useResolveClassNames(sizeClassName)
  const height = typeof sizing.height === "number" ? sizing.height : 160
  const stageWidth = typeof sizing.width === "number" ? sizing.width : height
  const [strip, setStrip] = useState<HeroStrip | null>(null)
  const [failed, setFailed] = useState(false)
  const [readySource, setReadySource] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(AppState.currentState === "active")
  const [attention, send] = useMachine(heroes99AttentionMachine)
  const { attentionHandlers } = useAnimalAttentionInput(() =>
    send({ type: "HERO_ATTENTION.ACTIVATE" }),
  )
  const mode = interactive ? "home" : "idle"
  const frameCount = getHeroes99PresentationFrames(mode).length
  const isFlourishing = attention.matches("Flourishing")
  const clip = isFlourishing
    ? HEROES99_FLOURISHES[attention.context.flourish]
    : HEROES99_IDLE_CLIP
  const Surface = interactive ? Pressable : View
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
          -(
            clip.offset +
            Math.min(clip.frameCount - 1, Math.floor(progress.get()))
          ) * width,
      },
    ],
  }))
  useEffect(() => {
    send({
      type: "HERO_ATTENTION.AVAILABILITY",
      canAnimate:
        interactive &&
        !shouldReduceMotion &&
        isActive &&
        !!strip &&
        strip.source.uri === readySource &&
        !failed,
    })
  }, [
    interactive,
    shouldReduceMotion,
    isActive,
    strip,
    readySource,
    failed,
    send,
  ])
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) =>
      setIsActive(state === "active"),
    )
    return () => listener.remove()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void composeNativeHeroes99(
      appearance,
      HEROES99_ASSETS,
      controller.signal,
      mode,
    )
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
  }, [appearance, mode])
  useEffect(() => {
    cancelAnimation(progress)
    progress.set(0)
    if (!shouldReduceMotion && isActive && strip?.source.uri === readySource) {
      const generation = attention.context.generation
      const complete = () =>
        send({ type: "HERO_ATTENTION.COMPLETE", generation })
      const animation = withTiming(
        clip.frameCount,
        {
          duration: clip.frameDuration * clip.frameCount,
          easing: Easing.linear,
          reduceMotion: ReduceMotion.Never,
        },
        (finished) => {
          if (finished && isFlourishing) scheduleOnRN(complete)
        },
      )
      progress.set(
        isFlourishing
          ? animation
          : withRepeat(animation, -1, false, undefined, ReduceMotion.Never),
      )
    }
    return () => cancelAnimation(progress)
  }, [
    isActive,
    progress,
    readySource,
    shouldReduceMotion,
    strip,
    clip,
    isFlourishing,
    attention.context.generation,
    send,
  ])
  return (
    <Surface
      {...(interactive && attentionHandlers)}
      accessible
      accessibilityRole={interactive ? "button" : "image"}
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
            style={[{ width: width * frameCount, height: imageHeight }, motion]}
          >
            <Image
              alt=""
              aria-hidden
              testID="heroes99-idle-image"
              fadeDuration={0}
              source={strip.source}
              resizeMode="stretch"
              style={{
                width: width * frameCount,
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
    </Surface>
  )
}
