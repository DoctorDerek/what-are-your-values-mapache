"use client"

import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { getHeroes99PresentationFrames, HEROES99_IDLE_CLIP, HEROES99_FLOURISHES } from "@game/data/src/Heroes99Presentation"
import type { Heroes99RuntimeAssets } from "@game/data/src/Heroes99RuntimeAssets"
import { heroes99AttentionMachine } from "@game/machines/src/Heroes99AttentionMachine"
import { useMachine } from "@xstate/react"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { HEROES99_ASSETS } from "@/generated/heroes99/Heroes99Assets"
import { composeHeroes99 } from "@/lib/ComposeHeroes99"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

type HeroStrip = Awaited<ReturnType<typeof composeHeroes99>>

export default function Heroes99Hero({
  appearance,
  shouldReduceMotion,
  className,
  interactive = false,
}: {
  appearance: Heroes99Appearance
  shouldReduceMotion: boolean
  className?: string
  interactive?: boolean
}) {
  const localizedCopy = useLocaleCatalog()
  const DRESSING_ROOM_COPY = localizedCopy.interfaceCopy.dressingRoom

  const [strip, setStrip] = useState<HeroStrip | null>(null)
  const [failed, setFailed] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [attention, send] = useMachine(heroes99AttentionMachine)
  const { attentionHandlers, activateAttention } = useAnimalAttentionInput(() => send({ type: "HERO_ATTENTION.ACTIVATE" }))
  const mode = interactive ? "home" : "idle"
  const frameCount = getHeroes99PresentationFrames(mode).length
  const isFlourishing = attention.matches("Flourishing")
  const clip = isFlourishing ? HEROES99_FLOURISHES[attention.context.flourish] : HEROES99_IDLE_CLIP
  const Surface = interactive ? "button" : "div"
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const update = () => setIsActive(document.visibilityState !== "hidden")
    update()
    document.addEventListener("visibilitychange", update)
    return () => document.removeEventListener("visibilitychange", update)
  }, [])
  useEffect(() => {
    send({ type: "HERO_ATTENTION.AVAILABILITY", canAnimate: interactive && !shouldReduceMotion && isActive && !!strip && !failed })
  }, [interactive, shouldReduceMotion, isActive, strip, failed, send])
  useLayoutEffect(() => {
    if (!strip || !canvas.current) return
    const context = canvas.current.getContext("2d")
    if (!context) return
    context.imageSmoothingEnabled = false
    context.clearRect(0, 0, strip.canvas.width, strip.canvas.height)
    context.drawImage(strip.canvas, 0, 0)
  }, [strip, failed, clip.name, attention.context.generation])
  useEffect(() => {
    const controller = new AbortController()
    void composeHeroes99(
      appearance,
      HEROES99_ASSETS satisfies Heroes99RuntimeAssets<StaticImageData>,
      controller.signal,
      mode,
    )
      .then((result) => {
        if (controller.signal.aborted) return
        setStrip(result)
        setFailed(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [appearance, mode])
  return (
    <Surface
      type={interactive ? "button" : undefined}
      role={interactive ? undefined : "img"}
      {...(interactive && attentionHandlers)}
      onClick={interactive ? activateAttention : undefined}
      aria-label={
        failed ? DRESSING_ROOM_COPY.placeholder : DRESSING_ROOM_COPY.character
      }
      className={cx(
        "[container-type:size] relative flex shrink-0 items-end justify-center",
        interactive && "cursor-pointer touch-pan-y focus-visible:outline-4 focus-visible:-outline-offset-4",
        className,
      )}
    >
      {strip && !failed ? (
        <div
          className="relative aspect-(--hero-aspect) w-[min(100cqw,calc(100cqh*var(--hero-aspect)))] overflow-hidden"
          style={
            { "--hero-aspect": strip.width / strip.height } as CSSProperties
          }
        >
          <canvas
            key={`${clip.name}-${attention.context.generation}`}
            ref={canvas}
            aria-hidden="true"
            width={strip.width * frameCount}
            height={strip.height}
            className={cx(
              "absolute top-0 left-0 h-full max-w-none [image-rendering:pixelated]",
              !shouldReduceMotion && isActive &&
                (isFlourishing ? "animate-heroes99-flourish motion-reduce:animate-none" : "animate-heroes99-idle motion-reduce:animate-none"),
            )}
            style={
              {
                width: `${frameCount * 100}%`,
                "--hero-frame-count": clip.frameCount,
                "--hero-duration": `${clip.frameDuration * clip.frameCount}ms`,
                "--hero-start": `${-100 * clip.offset / frameCount}%`,
                "--hero-end": `${-100 * (clip.offset + clip.frameCount) / frameCount}%`,
              } as CSSProperties
            }
            data-hero-clip={clip.name}
            onAnimationEnd={() => send({ type: "HERO_ATTENTION.COMPLETE", generation: attention.context.generation })}
          />
        </div>
      ) : (
        <span className="text-mapache-vivid-dark max-w-32 text-center text-sm">
          {failed ? DRESSING_ROOM_COPY.placeholder : DRESSING_ROOM_COPY.loading}
        </span>
      )}
    </Surface>
  )
}
