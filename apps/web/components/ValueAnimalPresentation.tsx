"use client"

import {
  SEETHING_SWARM_HUB_TILE_SIZE,
  type ValueAnimalPresentation as ValueAnimalPresentationData,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createSeethingSwarmSurfaceGeometry } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import { useState, type CSSProperties } from "react"
import { useSeethingSwarmAssetStatus } from "@/components/SeethingSwarmAssetPreparation"
import SeethingSwarmHubAnimal from "@/components/SeethingSwarmHubAnimal"

export default function ValueAnimalPresentation({
  catalog,
  isAttended,
  tapRequest = 0,
  valuePresentation,
  shouldReduceMotion,
  showAnimal = true,
  surface = "tile",
}: {
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  isAttended: boolean
  tapRequest?: number
  valuePresentation: ValueAnimalPresentationData<StaticImageData>
  shouldReduceMotion: boolean
  showAnimal?: boolean
  surface?: "tile" | "card" | "catalog"
}) {
  const imagePath =
    valuePresentation.kind === "animal"
      ? valuePresentation.clip.relativePath
      : null
  const preparedStatus = useSeethingSwarmAssetStatus(imagePath ?? "")
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null)
  const hasImageFailed =
    imagePath !== null &&
    (preparedStatus === "failed" || failedImagePath === imagePath)
  if (valuePresentation.kind === "typography-only") return null
  const geometry = createSeethingSwarmSurfaceGeometry(
    valuePresentation.animal,
    "portrait",
  )
  const portraitStyle: CSSProperties & {
    "--portrait-width": string
    "--portrait-height": string
  } = {
    "--portrait-width": `${Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry.width)}px`,
    "--portrait-height": `${Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry.height)}px`,
  }

  return (
    <span
      aria-hidden="true"
      data-value-presentation={valuePresentation.kind}
      className={cx(
        "relative flex flex-none items-center",
        surface === "tile" && "bg-white shadow-[inset_0_0_0_4px_#000000]",
        surface === "catalog" && "border-4 border-black bg-white",
      )}
    >
      <span
        className={cx(
          "flex h-(--portrait-height) w-(--portrait-width) items-center justify-center",
          surface === "tile" && "m-1",
        )}
        style={portraitStyle}
      >
        {showAnimal && !hasImageFailed ? (
          <span style={{ width: geometry.width, height: geometry.height }}>
            <SeethingSwarmHubAnimal
              calmClip={valuePresentation.clip}
              geometry={geometry}
              catalog={catalog}
              isAttended={isAttended}
              tapRequest={tapRequest}
              onLoadError={() => setFailedImagePath(imagePath)}
              shouldReduceMotion={shouldReduceMotion}
            />
          </span>
        ) : null}
      </span>
    </span>
  )
}
