import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { DRESSING_ROOM_COPY } from "@game/data/src/Heroes99DressingRoom"
import { projectHubValues } from "@game/data/src/HubValueProjection"
import { PERSONAL_HUB_COPY } from "@game/data/src/PersonalHubCopy"
import { presentationLoadingCopy } from "@game/data/src/PresentationLoadingCopy"
import { PRODUCT_MENU_COPY } from "@game/data/src/ProductMenu"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { VALUES_CARD_COPY } from "@game/data/src/ValuesCard"
import { cx } from "classix"
import { ScrollView, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeHeroes99Hero from "@/components/NativeHeroes99Hero"
import NativeHubValueRow from "@/components/NativeHubValueRow"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeHub({
  appearance,
  isBattlePending = false,
  rankedValues,
  runtimeClipCatalog,
  dataNotice,
  shouldReduceMotion,
  onAddCustomValue,
  onBrowseAllValues,
  onOpenMenu,
  onStartBattle,
  onCustomize,
  onShare,
}: {
  appearance: Heroes99Appearance
  isBattlePending?: boolean
  rankedValues: readonly RankedValue[]
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
  dataNotice: string | null
  shouldReduceMotion: boolean
  onAddCustomValue: () => void
  onBrowseAllValues: () => void
  onOpenMenu: () => void
  onStartBattle: () => void
  onCustomize: () => void
  onShare: () => void
}) {
  const { hasComparisons, topFive } = projectHubValues(rankedValues)
  return (
    <MapacheScreen>
      <ScrollView contentContainerClassName="items-center gap-5 p-3 pb-10 xl:p-6">
        <View className="w-full max-w-7xl items-end">
          <Button size="compact" variant="secondary" onPress={onOpenMenu}>
            <Text>{PRODUCT_MENU_COPY.openAction}</Text>
          </Button>
        </View>
        {dataNotice && (
          <Text
            accessibilityLiveRegion="polite"
            className="bg-mapache-vivid-secondary-green w-full max-w-7xl border-4 border-black p-4 font-bold text-white"
          >
            {dataNotice}
          </Text>
        )}
        <View className="border-player-card-frame bg-player-card-background w-full max-w-7xl flex-row flex-wrap overflow-hidden border-4">
          <Text
            accessibilityRole="header"
            className="text-player-card-ink w-2/3 self-center px-3 py-5 text-3xl font-black xl:w-full xl:text-center xl:text-5xl"
          >
            {hasComparisons
              ? PERSONAL_HUB_COPY.rankedTitle
              : PERSONAL_HUB_COPY.unrankedTitle}
          </Text>
          <View className="xl:bg-player-card-values w-1/3 items-center justify-center py-3">
            <NativeHeroes99Hero
              appearance={appearance}
              shouldReduceMotion={shouldReduceMotion}
              sizeClassName="h-28 w-20 xl:h-96 xl:w-64"
            />
          </View>
          <View className="bg-player-card-values w-full xl:w-2/3">
            {topFive.map((value) => (
              <NativeHubValueRow
                key={value.definition.id}
                rankedValue={value}
                showRank={hasComparisons}
                shouldReduceMotion={shouldReduceMotion}
                runtimeClipCatalog={runtimeClipCatalog}
              />
            ))}
          </View>
          {!hasComparisons && (
            <Text className="bg-player-card-values text-player-card-muted w-full p-3 text-sm">
              {PERSONAL_HUB_COPY.unrankedNotice}
            </Text>
          )}
        </View>
        <View className="w-full max-w-7xl gap-4">
          <View className="gap-4 xl:flex-row">
            <Button
              className="min-w-0 xl:flex-1"
              size="compact"
              onPress={onStartBattle}
              accessibilityState={{ busy: isBattlePending }}
              accessibilityLabel={
                isBattlePending
                  ? presentationLoadingCopy.cancelBattlePreparation
                  : PERSONAL_HUB_COPY.battle
              }
            >
              <View className={cx(isBattlePending && "opacity-0")}>
                <Text>{PERSONAL_HUB_COPY.battle}</Text>
              </View>
              {isBattlePending && (
                <View
                  pointerEvents="none"
                  className="absolute inset-0 items-center justify-center"
                >
                  <Text>{presentationLoadingCopy.preparing}</Text>
                </View>
              )}
            </Button>
            <View className="flex-row gap-4 xl:flex-[2]">
              <Button
                className="min-w-0 flex-1"
                variant="secondary"
                size="compact"
                onPress={onCustomize}
              >
                <Text>{DRESSING_ROOM_COPY.customize}</Text>
              </Button>
              <Button
                className="min-w-0 flex-1"
                variant="secondary"
                size="compact"
                onPress={onShare}
              >
                <Text>{VALUES_CARD_COPY.title}</Text>
              </Button>
            </View>
          </View>
          <View className="flex-row gap-4">
            <Button
              className="min-w-0 flex-1"
              variant="outline"
              size="compact"
              onPress={onBrowseAllValues}
            >
              <Text>{PERSONAL_HUB_COPY.browse}</Text>
            </Button>
            <Button
              className="min-w-0 flex-1"
              variant="outline"
              size="compact"
              onPress={onAddCustomValue}
            >
              <Text>{PERSONAL_HUB_COPY.add}</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </MapacheScreen>
  )
}
