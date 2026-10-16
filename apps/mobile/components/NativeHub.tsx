import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { projectHubValues } from "@game/data/src/HubValueProjection"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { cx } from "classix"
import type { ReactNode } from "react"
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
  notifications,
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
  notifications?: ReactNode
  shouldReduceMotion: boolean
  onAddCustomValue: () => void
  onBrowseAllValues: () => void
  onOpenMenu: () => void
  onStartBattle: () => void
  onCustomize: () => void
  onShare: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const introductionCopy = localizedCopy.introduction
  const DRESSING_ROOM_COPY = localizedCopy.interfaceCopy.dressingRoom
  const PERSONAL_HUB_COPY = localizedCopy.hub
  const presentationLoadingCopy = localizedCopy.interfaceCopy.loading
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu
  const VALUES_CARD_COPY = localizedCopy.card

  const { hasComparisons, topFive } = projectHubValues(rankedValues)
  return (
    <MapacheScreen>
      <ScrollView contentContainerClassName="items-center gap-5 p-3 pb-10 xl:p-6">
        <View className="w-full max-w-7xl flex-row items-center justify-between gap-3">
          <Text
            accessibilityRole="header"
            adjustsFontSizeToFit
            numberOfLines={1}
            className="min-w-0 flex-1 text-2xl leading-tight font-bold tracking-tight text-white"
          >
            {introductionCopy.title}
          </Text>
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
        <View className="border-player-card-frame bg-player-card-background relative w-full max-w-7xl flex-row flex-wrap overflow-hidden border-4">
          <View
            accessible
            accessibilityRole="header"
            accessibilityLabel={
              hasComparisons
                ? PERSONAL_HUB_COPY.rankedTitle
                : PERSONAL_HUB_COPY.unrankedTitle
            }
            className="w-2/3 self-center px-3 py-5 xl:w-full xl:flex-row xl:justify-center xl:gap-x-3"
          >
            {(hasComparisons
              ? PERSONAL_HUB_COPY.rankedTitleLines
              : [PERSONAL_HUB_COPY.unrankedTitle]
            ).map((line) => (
              <Text
                key={line}
                className="text-player-card-ink text-3xl leading-tight font-black xl:text-5xl"
              >
                {line}
              </Text>
            ))}
          </View>
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
          <ScrollView
            pointerEvents="box-none"
            className="absolute inset-x-0 top-0 z-50 max-h-full"
            contentContainerClassName="p-2"
          >
            {notifications}
          </ScrollView>
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
