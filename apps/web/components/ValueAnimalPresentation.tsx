"use client"

import {
  SEETHING_SWARM_HUB_TILE_SIZE,
  type ValueAnimalPresentation as ValueAnimalPresentationData,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import { createSeethingSwarmSurfaceGeometry } from "@game/machines/src/SeethingSwarmBattleChoreography"
import type { StaticImageData } from "next/image"
import { useState, type CSSProperties } from "react"
import { useSeethingSwarmAssetStatus } from "@/components/SeethingSwarmAssetPreparation"
import SeethingSwarmHubAnimal from "@/components/SeethingSwarmHubAnimal"

export default function ValueAnimalPresentation({
  rank,
  showRank,
  catalog,
  isAttended,
  valuePresentation,
  shouldReduceMotion,
}: {
  rank: number
  showRank: boolean
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  isAttended: boolean
  valuePresentation: ValueAnimalPresentationData<StaticImageData> | undefined
  shouldReduceMotion: boolean
}) {
  const imagePath =
    valuePresentation?.kind === "animal"
      ? valuePresentation.clip.relativePath
      : null
  const preparedStatus = useSeethingSwarmAssetStatus(imagePath ?? "")
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null)
  const hasImageFailed =
    imagePath !== null &&
    (preparedStatus === "failed" || failedImagePath === imagePath)
  const { medal } = getValueRankPresentation(rank)
  const geometry =
    valuePresentation?.kind === "animal"
      ? createSeethingSwarmSurfaceGeometry(valuePresentation.animal, "portrait")
      : null
  const portraitStyle: CSSProperties & {
    "--portrait-width": string
    "--portrait-height": string
  } = {
    "--portrait-width": `${Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry?.width ?? 0)}px`,
    "--portrait-height": `${Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry?.height ?? 0)}px`,
  }
  if (
    !showRank &&
    (!valuePresentation || valuePresentation.kind === "typography-only")
  )
    return null
  if (!valuePresentation || valuePresentation.kind === "typography-only")
    return (
      <span
        aria-hidden="true"
        data-value-presentation="typography-only"
        className="bg-mapache-vivid-secondary-purple flex flex-none items-center gap-2 border-4 border-black px-3 py-2 text-2xl font-black text-white uppercase"
      >
        {showRank ? <span>#{rank}</span> : null}
        {showRank && medal ? <span>{medal.emoji}</span> : null}
      </span>
    )

  return (
    <span aria-hidden="true" className="flex flex-none items-center gap-2">
      <span
        aria-hidden="true"
        data-value-presentation={valuePresentation.kind}
        className="relative flex flex-none flex-col items-center bg-white shadow-[inset_0_0_0_4px_#000000]"
      >
        {showRank ? (
          <span className="bg-mapache-vivid-secondary-purple self-start border-r-4 border-b-4 border-black px-1.5 py-1 text-sm leading-none font-black text-white uppercase">
            #{rank}
          </span>
        ) : null}
        <span
          className="m-1 flex h-(--portrait-height) w-(--portrait-width) items-center justify-center"
          style={portraitStyle}
        >
          {valuePresentation.kind === "animal" &&
          geometry &&
          !hasImageFailed ? (
            <span style={{ width: geometry.width, height: geometry.height }}>
              <SeethingSwarmHubAnimal
                calmClip={valuePresentation.clip}
                geometry={geometry}
                catalog={catalog}
                isAttended={isAttended}
                onLoadError={() => setFailedImagePath(imagePath)}
                shouldReduceMotion={shouldReduceMotion}
              />
            </span>
          ) : (
            <span className="text-mapache-vivid-secondary-purple text-4xl font-black uppercase">
              {valuePresentation.kind === "custom-initial"
                ? valuePresentation.initial
                : null}
            </span>
          )}
        </span>
      </span>
      {showRank && medal ? (
        <span className="text-2xl">{medal.emoji}</span>
      ) : null}
    </span>
  )
}
