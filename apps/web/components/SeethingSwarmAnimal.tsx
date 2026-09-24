import {
  SEETHING_SWARM_CALM_FRAME_DURATION_MS,
  type SeethingSwarmAnimalFacingDirection,
  type SeethingSwarmAnimalPlaybackMode,
  type SeethingSwarmAnimalPresentationGeometry,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeCharacterClip } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import Image, { type StaticImageData } from "next/image"
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { useSeethingSwarmAssetStatus } from "@/components/SeethingSwarmAssetPreparation"

type SeethingSwarmAnimalStyle = CSSProperties & {
  "--animal-animation-duration": string
  "--animal-frame-count": number
  "--animal-strip-height": string
  "--animal-strip-final-offset": string
  "--animal-strip-left": string
  "--animal-strip-top": string
  "--animal-strip-travel": string
  "--animal-strip-start-offset": string
  "--animal-strip-width": string
  "--animal-frame-width": string
}

type SeethingSwarmAnimalTileStyle = CSSProperties & {
  "--animal-clearance-width": string
  "--animal-clearance-height": string
}

export default function SeethingSwarmAnimal({
  clip,
  facing = "right",
  frameDurationMs = SEETHING_SWARM_CALM_FRAME_DURATION_MS,
  geometry,
  preload = false,
  playbackMode = "loop",
  playbackIdentity,
  shouldReduceMotion,
  onLoadError,
  onReady,
  onPlaybackComplete,
  startFrame = 0,
  endFrame = clip.frameCount,
}: {
  clip: SeethingSwarmRuntimeCharacterClip<StaticImageData>
  facing?: SeethingSwarmAnimalFacingDirection
  frameDurationMs?: number
  geometry: SeethingSwarmAnimalPresentationGeometry
  preload?: boolean
  playbackMode?: SeethingSwarmAnimalPlaybackMode
  playbackIdentity?: string
  shouldReduceMotion: boolean
  onLoadError?: () => void
  onReady?: () => void
  onPlaybackComplete?: () => void
  startFrame?: number
  endFrame?: number
}) {
  const [loadedAssetSource, setLoadedAssetSource] = useState<string | null>(
    null,
  )
  const preparedStatus = useSeethingSwarmAssetStatus(clip.relativePath)
  const isImageLoaded =
    loadedAssetSource === clip.asset.src || preparedStatus === "ready"
  const imageRef = useRef<HTMLImageElement>(null)
  const handleImageReady = useCallback(() => {
    setLoadedAssetSource(clip.asset.src)
    onReady?.()
  }, [clip.asset.src, onReady])
  useLayoutEffect(() => {
    const image = imageRef.current
    if (!isImageLoaded && image?.complete && image.naturalWidth > 0) {
      handleImageReady()
    }
  }, [clip.asset.src, handleImageReady, isImageLoaded])
  const effectivePlaybackMode =
    shouldReduceMotion &&
    (playbackMode === "loop" || playbackMode === "one-shot")
      ? "static"
      : playbackMode
  useLayoutEffect(() => {
    if (
      !playbackIdentity ||
      !isImageLoaded ||
      (effectivePlaybackMode !== "loop" && effectivePlaybackMode !== "one-shot")
    )
      return
    for (const animation of imageRef.current?.getAnimations?.() ?? []) {
      animation.currentTime = 0
      animation.play()
    }
  }, [
    effectivePlaybackMode,
    frameDurationMs,
    isImageLoaded,
    playbackIdentity,
    startFrame,
    endFrame,
  ])
  const scaledFrameWidth = clip.frameWidth * geometry.integerScale
  const scaledFrameHeight = clip.frameHeight * geometry.integerScale
  const scaledStripWidth = scaledFrameWidth * clip.frameCount
  const stripStyle: SeethingSwarmAnimalStyle = {
    "--animal-animation-duration": `${(endFrame - startFrame) * frameDurationMs}ms`,
    "--animal-frame-count": endFrame - startFrame,
    "--animal-strip-height": `${scaledFrameHeight}px`,
    "--animal-strip-final-offset": `${-scaledFrameWidth * (endFrame - 1)}px`,
    "--animal-strip-left": `${geometry.frameOffsetX}px`,
    "--animal-strip-top": `${geometry.frameOffsetY}px`,
    "--animal-strip-travel": `${-scaledFrameWidth * endFrame}px`,
    "--animal-strip-start-offset": `${-scaledFrameWidth * startFrame}px`,
    "--animal-strip-width": `${scaledStripWidth}px`,
    "--animal-frame-width": `${scaledFrameWidth}px`,
  }
  const tileStyle: SeethingSwarmAnimalTileStyle = {
    "--animal-clearance-width": `${geometry.width}px`,
    "--animal-clearance-height": `${geometry.height}px`,
  }
  const playbackClassName =
    effectivePlaybackMode === "loop"
      ? "animate-seething-swarm-strip [animation-iteration-count:infinite]"
      : effectivePlaybackMode === "one-shot"
        ? "animate-seething-swarm-strip"
        : effectivePlaybackMode === "hold-final-frame"
          ? "animate-none [transform:translate3d(var(--animal-strip-final-offset),0,0)]"
          : "animate-none [transform:translate3d(var(--animal-strip-start-offset),0,0)]"

  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none relative block h-(--animal-clearance-height) w-(--animal-clearance-width) shrink-0 overflow-hidden select-none ${facing === "left" ? "-scale-x-100" : ""}`}
      data-animal-id={clip.animalId}
      data-facing={facing}
      data-frame-count={clip.frameCount}
      data-playback-mode={effectivePlaybackMode}
      data-playback-ready={isImageLoaded}
      data-reduced-motion={shouldReduceMotion}
      style={tileStyle}
    >
      <span
        className="absolute top-(--animal-strip-top) left-(--animal-strip-left) h-(--animal-strip-height) w-(--animal-frame-width) overflow-hidden"
        style={stripStyle}
      >
        <Image
          ref={imageRef}
          alt=""
          className={`absolute top-0 left-0 h-(--animal-strip-height) w-(--animal-strip-width) max-w-none [image-rendering:pixelated] ${playbackClassName} ${isImageLoaded ? "" : "[animation-play-state:paused]"}`}
          draggable={false}
          decoding="sync"
          height={scaledFrameHeight}
          loading={preload || playbackMode === "one-shot" ? "eager" : undefined}
          onAnimationEnd={
            effectivePlaybackMode === "one-shot" && isImageLoaded
              ? onPlaybackComplete
              : undefined
          }
          onError={onLoadError}
          onLoad={handleImageReady}
          src={clip.asset}
          style={stripStyle}
          unoptimized
          width={scaledStripWidth}
        />
      </span>
    </span>
  )
}
