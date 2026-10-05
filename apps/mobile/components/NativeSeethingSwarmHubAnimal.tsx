import {
  SEETHING_SWARM_CALM_FRAME_DURATION_MS,
  type SeethingSwarmAnimalPresentationGeometry,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type {
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  createSeethingSwarmAttentionState,
  updateSeethingSwarmAttention,
} from "@game/machines/src/SeethingSwarmAttention"
import { createSeethingSwarmAttentionAlternatives } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { createSeethingSwarmAttentionPlayback } from "@game/machines/src/SeethingSwarmBattlePlayback"
import { useMemo, useState } from "react"
import { View } from "react-native"
import NativeSeethingSwarmAnimal from "@/components/NativeSeethingSwarmAnimal"
import { useNativeSeethingSwarmPreparedAssets } from "@/components/NativeSeethingSwarmAssetPreparation"
import { cn } from "@/lib/utils"

export default function NativeSeethingSwarmHubAnimal({
  calmClip,
  geometry,
  catalog,
  isAttended,
  shouldReduceMotion,
  onLoadError,
}: {
  calmClip: SeethingSwarmRuntimeCharacterClip<number>
  geometry: SeethingSwarmAnimalPresentationGeometry
  catalog: SeethingSwarmRuntimeClipCatalog<number>
  isAttended: boolean
  shouldReduceMotion: boolean
  onLoadError?: () => void
}) {
  const alternatives = useMemo(
    () => createSeethingSwarmAttentionAlternatives(calmClip, catalog),
    [calmClip, catalog],
  )
  const [attention, setAttention] = useState(createSeethingSwarmAttentionState)
  const nextAttention = updateSeethingSwarmAttention(
    attention,
    isAttended,
    !shouldReduceMotion,
    alternatives.length,
  )
  if (nextAttention !== attention) setAttention(nextAttention)
  const steps = useMemo(
    () =>
      createSeethingSwarmAttentionPlayback({
        anticipation: alternatives[nextAttention.alternativeIndex]!,
        rest: {
          role: "rest",
          semanticFamily: "rest",
          clip: calmClip,
          sequence: [calmClip],
        },
      }),
    [calmClip, alternatives, nextAttention.alternativeIndex],
  )
  const [retainedClip, setRetainedClip] = useState(calmClip)
  const clips = useMemo(
    () => [
      ...new Map(
        [calmClip, retainedClip, ...steps.map(({ clip }) => clip)].map(
          (clip) => [clip.relativePath, clip],
        ),
      ).values(),
    ],
    [calmClip, retainedClip, steps],
  )
  const preparedAssets = useNativeSeethingSwarmPreparedAssets()
  const [loadedPaths, setLoadedPaths] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [failedPaths, setFailedPaths] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [playback, setPlayback] = useState({
    index: 0,
    generation: nextAttention.generation,
  })
  if (playback.generation !== nextAttention.generation)
    setPlayback({ index: 0, generation: nextAttention.generation })
  const index =
    playback.generation === nextAttention.generation ? playback.index : 0
  const step = steps[Math.min(index, steps.length - 1)]!
  const isFailed = (path: string) =>
    failedPaths.has(path) || preparedAssets?.get(path)?.status === "failed"
  const isReady = (path: string) =>
    !isFailed(path) &&
    (loadedPaths.has(path) || preparedAssets?.get(path)?.status === "ready")
  const recipeFailed = steps.some(({ clip }) => isFailed(clip.relativePath))
  const recipeReady = steps.every(({ clip }) => isReady(clip.relativePath))
  const attended = nextAttention.isActive
  const requestedClip = attended && !recipeFailed ? step.clip : calmClip
  const requestedReady =
    isReady(requestedClip.relativePath) &&
    (!attended || recipeFailed || recipeReady)
  if (requestedReady && retainedClip !== requestedClip)
    setRetainedClip(requestedClip)
  const visibleClip = requestedReady ? requestedClip : retainedClip

  return (
    <View
      pointerEvents="none"
      className="relative"
      style={{ width: geometry.width, height: geometry.height }}
    >
      {clips.map((clip) => {
        const visible = clip.relativePath === visibleClip.relativePath
        return (
          <View
            key={clip.relativePath}
            className={cn(
              "absolute inset-0",
              visible ? "opacity-100" : "opacity-0",
            )}
          >
            <NativeSeethingSwarmAnimal
              clip={clip}
              geometry={geometry}
              frameDurationMs={
                attended && !recipeFailed
                  ? step.frameDurationMs
                  : SEETHING_SWARM_CALM_FRAME_DURATION_MS
              }
              playbackIdentity={`${nextAttention.generation}:${index}:${attended}`}
              playbackMode={
                !visible || shouldReduceMotion
                  ? "static"
                  : !requestedReady
                    ? "hold-final-frame"
                    : attended && !recipeFailed
                      ? step.playbackMode
                      : "loop"
              }
              shouldReduceMotion={shouldReduceMotion}
              onReady={() =>
                setLoadedPaths((previous) =>
                  previous.has(clip.relativePath)
                    ? previous
                    : new Set([...previous, clip.relativePath]),
                )
              }
              onLoadError={() => {
                setFailedPaths(
                  (previous) => new Set([...previous, clip.relativePath]),
                )
                if (clip.relativePath === calmClip.relativePath) onLoadError?.()
              }}
              onPlaybackComplete={
                visible &&
                requestedReady &&
                attended &&
                !recipeFailed &&
                index < steps.length - 1
                  ? () =>
                      setPlayback((previous) =>
                        previous.generation === nextAttention.generation &&
                        previous.index === index
                          ? { ...previous, index: index + 1 }
                          : previous,
                      )
                  : undefined
              }
            />
          </View>
        )
      })}
    </View>
  )
}
