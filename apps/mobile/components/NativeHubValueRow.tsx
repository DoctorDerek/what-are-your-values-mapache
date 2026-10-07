import { PERSONAL_HUB_COPY } from "@game/data/src/PersonalHubCopy"
import {
  resolveValueAnimalPresentation,
  SEETHING_SWARM_HUB_TILE_SIZE,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { createSeethingSwarmSurfaceGeometry } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { getLevelFromXP } from "@game/utils/src/LevelMath"
import { useState } from "react"
import { Pressable, View } from "react-native"
import { useNativeSeethingSwarmAssetStatus } from "@/components/NativeSeethingSwarmAssetPreparation"
import NativeSeethingSwarmHubAnimal from "@/components/NativeSeethingSwarmHubAnimal"
import { Text } from "@/components/ui/text"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

export default function NativeHubValueRow({
  rankedValue,
  showRank,
  shouldReduceMotion,
  runtimeClipCatalog,
}: {
  rankedValue: RankedValue
  showRank: boolean
  shouldReduceMotion: boolean
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
}) {
  const { definition, progress, rank } = rankedValue
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
      ? createSeethingSwarmSurfaceGeometry(presentation.animal, "portrait")
      : null
  return (
    <View className="border-player-card-frame flex-row items-center gap-2 border-b-2 px-2 py-3 xl:gap-5 xl:px-6">
      {showRank && (
        <Text className="bg-player-card-rank text-player-card-ink min-w-8 text-center text-xl tabular-nums">
          #{rank}
        </Text>
      )}
      <Pressable
        testID={`hub-animal-${definition.id}`}
        {...attentionHandlers}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="items-center justify-center"
        style={{
          width: Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry?.width ?? 0),
          height: Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry?.height ?? 0),
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
      <View className="min-w-0 flex-1">
        <Text className="text-player-card-ink text-lg font-black xl:text-3xl">
          {getValueDisplayName(definition)}
        </Text>
        <Text className="text-player-card-muted mt-1 text-sm">
          {getValueDisplayDefinition(definition)}
        </Text>
        <Text className="text-player-card-muted mt-1 text-sm">
          {PERSONAL_HUB_COPY.level(getLevelFromXP(progress.totalXp))}
        </Text>
      </View>
    </View>
  )
}
