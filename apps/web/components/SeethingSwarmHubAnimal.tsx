import { createSeethingSwarmAnimalPresentationGeometry } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type {
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createSeethingSwarmHubAttentionSelections } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { createSeethingSwarmAttentionPlayback } from "@game/machines/src/SeethingSwarmBattlePlayback"
import type { StaticImageData } from "next/image"
import { useMemo, useState } from "react"
import SeethingSwarmAnimal from "@/components/SeethingSwarmAnimal"
import { useSeethingSwarmPreparedAssets } from "@/components/SeethingSwarmAssetPreparation"

export default function SeethingSwarmHubAnimal({
  calmClip,
  catalog,
  isAttended,
  shouldReduceMotion,
  onLoadError,
}: {
  calmClip: SeethingSwarmRuntimeCharacterClip<StaticImageData>
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  isAttended: boolean
  shouldReduceMotion: boolean
  onLoadError: () => void
}) {
  const steps = useMemo(
    () =>
      createSeethingSwarmAttentionPlayback(
        createSeethingSwarmHubAttentionSelections(calmClip, catalog),
      ),
    [calmClip, catalog],
  )
  const clips = useMemo(
    () => [
      ...new Map(
        [calmClip, ...steps.map(({ clip }) => clip)].map((clip) => [
          clip.relativePath,
          clip,
        ]),
      ).values(),
    ],
    [calmClip, steps],
  )
  const maximumIntegerScale = useMemo(
    () =>
      Math.min(
        ...clips.map(
          (clip) =>
            createSeethingSwarmAnimalPresentationGeometry(
              clip.frameWidth,
              clip.frameHeight,
              clip.visibleBounds,
            ).integerScale,
        ),
      ),
    [clips],
  )
  const preparedAssets = useSeethingSwarmPreparedAssets()
  const [loadedPaths, setLoadedPaths] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [failedPaths, setFailedPaths] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const attended = isAttended && !shouldReduceMotion
  const [playback, setPlayback] = useState({
    attended,
    index: 0,
    generation: 0,
  })
  if (playback.attended !== attended)
    setPlayback({ attended, index: 0, generation: playback.generation + 1 })
  const index = playback.attended === attended ? playback.index : 0
  const step = steps[Math.min(index, steps.length - 1)]!
  const requestedClip = attended ? step.clip : calmClip
  const [retainedClip, setRetainedClip] = useState(calmClip)
  const isFailed = (path: string) =>
    failedPaths.has(path) || preparedAssets?.get(path)?.status === "failed"
  const isReady = (path: string) =>
    !isFailed(path) &&
    (loadedPaths.has(path) || preparedAssets?.get(path)?.status === "ready")
  const requestedReady = isReady(requestedClip.relativePath)
  if (requestedReady && retainedClip !== requestedClip)
    setRetainedClip(requestedClip)
  if (
    attended &&
    playback.attended === attended &&
    isFailed(requestedClip.relativePath) &&
    index < steps.length - 1
  )
    setPlayback({ ...playback, index: index + 1 })
  const visibleClip = requestedReady ? requestedClip : retainedClip

  return (
    <span className="relative block size-full" aria-hidden="true">
      {clips.map((clip) => {
        const visible = clip.relativePath === visibleClip.relativePath
        return (
          <span
            key={clip.relativePath}
            className={`absolute inset-0 ${visible ? "visible" : "invisible"}`}
            data-hub-active-clip={visible}
          >
            <SeethingSwarmAnimal
              clip={clip}
              maximumIntegerScale={maximumIntegerScale}
              preload
              playbackIdentity={`${playback.generation}:${index}:${attended}`}
              playbackMode={
                !visible || shouldReduceMotion
                  ? "static"
                  : !requestedReady
                    ? "hold-final-frame"
                    : attended
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
                if (clip.relativePath === calmClip.relativePath) onLoadError()
              }}
              onPlaybackComplete={
                visible &&
                requestedReady &&
                attended &&
                index < steps.length - 1
                  ? () =>
                      setPlayback((previous) =>
                        previous.attended &&
                        previous.generation === playback.generation &&
                        previous.index === index
                          ? { ...previous, index: index + 1 }
                          : previous,
                      )
                  : undefined
              }
            />
          </span>
        )
      })}
    </span>
  )
}
