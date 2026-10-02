import {
  SEETHING_SWARM_HUB_TILE_SIZE,
  type ValueAnimalPresentation,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import { createSeethingSwarmSurfaceGeometry } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { useState } from "react"
import { Pressable, View } from "react-native"
import { useNativeSeethingSwarmAssetStatus } from "@/components/NativeSeethingSwarmAssetPreparation"
import NativeSeethingSwarmHubAnimal from "@/components/NativeSeethingSwarmHubAnimal"
import NativeValueLevelProgress from "@/components/NativeValueLevelProgress"
import { Text } from "@/components/ui/text"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"
import { cn } from "@/lib/utils"

function NativeValueRankPresentation({
  rank,
  valuePresentation,
  shouldReduceMotion,
  runtimeClipCatalog,
  isAttended,
}: {
  rank: number
  valuePresentation: ValueAnimalPresentation<number> | undefined
  shouldReduceMotion: boolean
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
  isAttended: boolean
}) {
  const imagePath =
    valuePresentation?.kind === "animal"
      ? valuePresentation.clip.relativePath
      : null
  const preparedStatus = useNativeSeethingSwarmAssetStatus(imagePath ?? "")
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null)
  const hasImageFailed =
    imagePath !== null &&
    (preparedStatus === "failed" || failedImagePath === imagePath)
  const { medal } = getValueRankPresentation(rank)
  const geometry =
    valuePresentation?.kind === "animal"
      ? createSeethingSwarmSurfaceGeometry(valuePresentation.animal, "portrait")
      : null
  if (!valuePresentation || valuePresentation.kind === "typography-only")
    return (
      <Text
        accessibilityElementsHidden
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        className="bg-mapache-vivid-secondary-purple border-4 border-black px-3 py-2 text-xl font-black text-white uppercase"
      >
        #{rank}
        {medal ? ` ${medal.emoji}` : ""}
      </Text>
    )

  return (
    <View
      accessibilityElementsHidden
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      className="flex-row items-center gap-2"
    >
      <View
        className="relative flex-none items-center justify-center bg-white"
        testID={`hub-top-five-rank-${rank}-presentation`}
      >
        <Text className="bg-mapache-vivid-secondary-purple self-start border-r-4 border-b-4 border-black px-1.5 py-1 text-sm leading-none font-black text-white uppercase">
          #{rank}
        </Text>
        <View
          className="m-1 items-center justify-center"
          style={{
            width: Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry?.width ?? 0),
            height: Math.max(
              SEETHING_SWARM_HUB_TILE_SIZE,
              geometry?.height ?? 0,
            ),
          }}
        >
          {valuePresentation.kind === "animal" &&
          geometry &&
          !hasImageFailed ? (
            <NativeSeethingSwarmHubAnimal
              calmClip={valuePresentation.clip}
              catalog={runtimeClipCatalog}
              isAttended={isAttended}
              geometry={geometry}
              onLoadError={() => setFailedImagePath(imagePath)}
              shouldReduceMotion={shouldReduceMotion}
            />
          ) : null}
        </View>
      </View>
      {medal ? <Text className="text-2xl">{medal.emoji}</Text> : null}
    </View>
  )
}

export default function NativeHubValueRow({
  rankedValue,
  showRank,
  isTopFive,
  valuePresentation,
  shouldReduceMotion,
  runtimeClipCatalog,
}: {
  rankedValue: RankedValue
  showRank: boolean
  isTopFive: boolean
  valuePresentation?: ValueAnimalPresentation<number>
  shouldReduceMotion: boolean
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
}) {
  const { definition, progress, rank } = rankedValue
  const displayName = getValueDisplayName(definition)
  const { accessibleLabel } = getValueRankPresentation(rank)
  const { isAttended, attentionHandlers } = useAnimalAttentionInput()

  return (
    <Pressable
      accessibilityLabel={
        showRank ? `${accessibleLabel}. ${displayName}` : displayName
      }
      accessible
      className={cn(
        "mb-4 border-4 border-black p-4 shadow-[5px_5px_0px_0px_#000000]",
        isTopFive ? "bg-mapache-vivid-secondary-gold" : "bg-white",
      )}
      {...attentionHandlers}
    >
      <View className="flex-row items-center gap-3">
        {showRank ? (
          <NativeValueRankPresentation
            rank={rank}
            valuePresentation={valuePresentation}
            shouldReduceMotion={shouldReduceMotion}
            runtimeClipCatalog={runtimeClipCatalog}
            isAttended={isAttended}
          />
        ) : null}
        <Text
          className={cn(
            "min-w-0 flex-1 text-2xl font-black uppercase",
            isTopFive ? "text-white" : "text-black",
          )}
        >
          {displayName}
        </Text>
      </View>
      <NativeValueLevelProgress totalXp={progress.totalXp} />
    </Pressable>
  )
}
