import {
  resolveValueAnimalPresentation,
  SEETHING_SWARM_ANIMAL_PRESENTATION_SIZES,
  type SeethingSwarmAnimalPresentationSize,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { ActiveValueDefinition } from "@game/data/src/Value"
import { createSeethingSwarmSurfaceGeometry } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { useState } from "react"
import { Pressable } from "react-native"
import { useNativeSeethingSwarmAssetStatus } from "@/components/NativeSeethingSwarmAssetPreparation"
import NativeSeethingSwarmHubAnimal from "@/components/NativeSeethingSwarmHubAnimal"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

export default function NativeValueAnimal({
  definition,
  runtimeClipCatalog,
  shouldReduceMotion,
  testID,
  size = "standard",
}: {
  definition: ActiveValueDefinition
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
  shouldReduceMotion: boolean
  testID?: string
  size?: SeethingSwarmAnimalPresentationSize
}) {
  const presentation = resolveValueAnimalPresentation(
    definition,
    runtimeClipCatalog,
  )
  const imagePath =
    presentation.kind === "animal" ? presentation.clip.relativePath : ""
  const status = useNativeSeethingSwarmAssetStatus(imagePath)
  const [failedPath, setFailedPath] = useState<string | null>(null)
  const { isAttended, attentionHandlers } = useAnimalAttentionInput()
  const geometry =
    presentation.kind === "animal"
      ? createSeethingSwarmSurfaceGeometry(
          presentation.animal,
          "portrait",
          size,
        )
      : null
  const { minimumSize } = SEETHING_SWARM_ANIMAL_PRESENTATION_SIZES[size]

  return (
    <Pressable
      testID={testID}
      {...attentionHandlers}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center"
      style={{
        width: Math.max(minimumSize, geometry?.width ?? 0),
        height: Math.max(minimumSize, geometry?.height ?? 0),
      }}
    >
      {presentation.kind === "animal" &&
        geometry &&
        status !== "failed" &&
        failedPath !== imagePath && (
          <NativeSeethingSwarmHubAnimal
            calmClip={presentation.clip}
            catalog={runtimeClipCatalog}
            geometry={geometry}
            isAttended={isAttended}
            shouldReduceMotion={shouldReduceMotion}
            onLoadError={() => setFailedPath(imagePath)}
          />
        )}
    </Pressable>
  )
}
