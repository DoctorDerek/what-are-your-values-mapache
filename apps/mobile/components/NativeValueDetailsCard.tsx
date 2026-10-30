import type { LocalizationCatalog } from "@game/data/src/LocalizationCatalog"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"
import { getWrappableValueDisplayName } from "@game/data/src/ValueNameTypography"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import { cx } from "classix"
import { View } from "react-native"
import NativeRankMedal from "@/components/NativeRankMedal"
import NativeValueAnimal from "@/components/NativeValueAnimal"
import NativeValueLevelProgress from "@/components/NativeValueLevelProgress"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeValueDetailsCard({
  isHighlighted,
  isPersistencePending,
  onDelete,
  onEdit,
  rankedValue,
  showRank,
  runtimeClipCatalog,
  shouldReduceMotion,
  localization: localizationOverride,
}: {
  readonly isHighlighted: boolean
  readonly isPersistencePending: boolean
  readonly onDelete: () => void
  readonly onEdit: () => void
  readonly rankedValue: RankedValue
  readonly showRank: boolean
  readonly runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
  readonly shouldReduceMotion: boolean
  readonly localization?: LocalizationCatalog
}) {
  const localizedCopy = useLocaleCatalog(localizationOverride)
  const localization = localizedCopy

  const { definition, progress, rank } = rankedValue
  const displayName = getValueDisplayName(definition, localization.values)
  const { medal, accessibleLabel } = getValueRankPresentation(
    rank,
    localizedCopy.interfaceCopy.rank,
  )

  return (
    <View
      accessibilityLabel={localizedCopy.interfaceCopy.screen.valueDetails(
        displayName,
      )}
      className={cx(
        "bg-white p-4 shadow-[5px_5px_0px_0px_#000000]",
        isHighlighted
          ? "border-mapache-vivid-primary-cyan border-8"
          : "border-4 border-black",
      )}
    >
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          {showRank ? (
            <View
              accessible
              accessibilityLabel={accessibleLabel}
              className="bg-mapache-vivid-secondary-purple flex-row items-center gap-2 border-2 border-black px-2 py-1"
            >
              <Text className="text-xl font-black text-white">#{rank}</Text>
              {medal && <NativeRankMedal color={medal.color} />}
            </View>
          ) : null}
          <NativeValueAnimal
            testID={`all-values-animal-${definition.id}`}
            definition={definition}
            runtimeClipCatalog={runtimeClipCatalog}
            shouldReduceMotion={shouldReduceMotion}
          />
        </View>
        <View className="contents xl:flex xl:min-w-0 xl:shrink xl:grow xl:basis-96 xl:flex-row-reverse xl:flex-wrap xl:items-center xl:gap-5">
          <NativeValueLevelProgress totalXp={progress.totalXp} />
          <View className="w-full min-w-0 basis-full flex-row flex-wrap items-center gap-2 xl:w-auto xl:shrink xl:grow xl:basis-64">
            <Text
              accessibilityRole="header"
              accessibilityLabel={displayName}
              android_hyphenationFrequency="normal"
              lineBreakStrategyIOS="standard"
              className="min-w-0 shrink grow basis-64 text-2xl font-black text-black uppercase"
            >
              {getWrappableValueDisplayName(
                definition,
                localization.values,
                localization.metadata.languageTag,
              )}
            </Text>
            {definition.kind === "custom" ? (
              <Text className="bg-mapache-vivid-primary-cyan border-2 border-black px-2 py-1 text-sm font-black text-black uppercase">
                {localizedCopy.interfaceCopy.screen.yours}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      <Text className="mt-4 border-t-4 border-black pt-4 text-lg leading-7 font-bold text-black">
        “{getValueDisplayDefinition(definition, localization.values)}”
      </Text>
      {definition.kind === "custom" ? (
        <View className="mt-4 flex-row gap-3">
          <Button
            className="min-w-0 flex-1"
            disabled={isPersistencePending}
            variant="secondary"
            onPress={onEdit}
          >
            <Text>{localizedCopy.interfaceCopy.screen.edit}</Text>
          </Button>
          <Button
            className="min-w-0 flex-1"
            disabled={isPersistencePending}
            variant="destructive"
            onPress={onDelete}
          >
            <Text>{localizedCopy.interfaceCopy.screen.delete}</Text>
          </Button>
        </View>
      ) : null}
    </View>
  )
}
