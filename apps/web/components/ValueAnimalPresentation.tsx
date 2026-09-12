"use client"

import type { ValueAnimalPresentation as ValueAnimalPresentationData } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import type { StaticImageData } from "next/image"
import { useState } from "react"
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
        className="relative flex h-[72px] w-[72px] flex-none items-center justify-center overflow-hidden bg-white shadow-[inset_0_0_0_4px_#000000]"
      >
        {valuePresentation.kind === "animal" && !hasImageFailed ? (
          <SeethingSwarmHubAnimal
            calmClip={valuePresentation.clip}
            catalog={catalog}
            isAttended={isAttended}
            onLoadError={() => setFailedImagePath(imagePath)}
            shouldReduceMotion={shouldReduceMotion}
          />
        ) : (
          <span className="text-mapache-vivid-secondary-purple text-4xl font-black uppercase">
            {valuePresentation.kind === "custom-initial"
              ? valuePresentation.initial
              : showRank
                ? `#${rank}`
                : null}
          </span>
        )}
        {showRank && !hasImageFailed ? (
          <span className="bg-mapache-vivid-secondary-purple absolute top-0 left-0 z-10 border-r-4 border-b-4 border-black px-1.5 py-1 text-sm leading-none font-black text-white uppercase">
            #{rank}
          </span>
        ) : null}
      </span>
      {showRank && medal ? (
        <span className="text-2xl">{medal.emoji}</span>
      ) : null}
    </span>
  )
}
