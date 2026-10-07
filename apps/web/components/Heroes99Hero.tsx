"use client"

import {
  HEROES99_IDLE_FRAME_DURATION_MS,
  type Heroes99Appearance,
} from "@game/data/src/Heroes99Appearance"
import { DRESSING_ROOM_COPY } from "@game/data/src/Heroes99DressingRoom"
import type { Heroes99RuntimeAssets } from "@game/data/src/Heroes99RuntimeAssets"
import { HEROES99_IDLE_FRAME_COUNT } from "@game/data/src/Heroes99SpatialArchitecture"
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

type HeroStrip = Awaited<ReturnType<typeof composeHeroes99>>

export default function Heroes99Hero({
  appearance,
  shouldReduceMotion,
  className,
}: {
  appearance: Heroes99Appearance
  shouldReduceMotion: boolean
  className?: string
}) {
  const [strip, setStrip] = useState<HeroStrip | null>(null)
  const [failed, setFailed] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  useLayoutEffect(() => {
    if (!strip || !canvas.current) return
    const context = canvas.current.getContext("2d")
    if (!context) return
    context.imageSmoothingEnabled = false
    context.clearRect(0, 0, strip.canvas.width, strip.canvas.height)
    context.drawImage(strip.canvas, 0, 0)
  }, [strip, failed])
  useEffect(() => {
    const controller = new AbortController()
    void composeHeroes99(
      appearance,
      HEROES99_ASSETS satisfies Heroes99RuntimeAssets<StaticImageData>,
      controller.signal,
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
  }, [appearance])
  return (
    <div
      role="img"
      aria-label={
        failed ? DRESSING_ROOM_COPY.placeholder : DRESSING_ROOM_COPY.character
      }
      className={cx(
        "[container-type:size] flex shrink-0 items-end justify-center",
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
            ref={canvas}
            aria-hidden="true"
            width={strip.width * HEROES99_IDLE_FRAME_COUNT}
            height={strip.height}
            className={cx(
              "absolute top-0 left-0 h-full max-w-none [image-rendering:pixelated]",
              !shouldReduceMotion &&
                "animate-heroes99-idle motion-reduce:animate-none",
            )}
            style={
              {
                width: `${HEROES99_IDLE_FRAME_COUNT * 100}%`,
                "--hero-frame-count": HEROES99_IDLE_FRAME_COUNT,
                "--hero-idle-duration": `${HEROES99_IDLE_FRAME_DURATION_MS * HEROES99_IDLE_FRAME_COUNT}ms`,
              } as CSSProperties
            }
          />
        </div>
      ) : (
        <span className="text-mapache-vivid-dark max-w-32 text-center text-sm">
          {failed ? DRESSING_ROOM_COPY.placeholder : DRESSING_ROOM_COPY.loading}
        </span>
      )}
    </div>
  )
}
