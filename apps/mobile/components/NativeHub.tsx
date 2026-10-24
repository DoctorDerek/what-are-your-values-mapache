import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { projectHubValues } from "@game/data/src/HubValueProjection"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { CustomValueAuthoringOptions } from "@game/data/src/useCustomValueAuthoring"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { ValueId } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { cx } from "classix"
import { useCallback, useState, type ReactNode } from "react"
import { ScrollView, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeCustomValueInvitation from "@/components/NativeCustomValueInvitation"
import NativeHeroes99Hero from "@/components/NativeHeroes99Hero"
import NativeHubValueRow from "@/components/NativeHubValueRow"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeHub({
  customValueInvitation,
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
  customValueInvitation?: Omit<
    CustomValueAuthoringOptions,
    "existingCustomValues" | "onExit"
  > & {
    saveIssue: string | null
    onClosed: () => void
    onOpenMatchingValue: (valueId: ValueId) => void
  }
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
  const [isDraftActive, setIsDraftActive] = useState(false)
  const [menuRequestId, setMenuRequestId] = useState(0)
  const onNavigationBlockedChange =
    customValueInvitation?.onNavigationBlockedChange
  const handleDraftNavigationBlockedChange = useCallback(
    (blocked: boolean) => {
      setIsDraftActive(blocked)
      onNavigationBlockedChange?.(blocked)
    },
    [onNavigationBlockedChange],
  )

  const { hasComparisons, topFive } = projectHubValues(rankedValues)
  return (
    <MapacheScreen>
      <View className="min-h-0 flex-1 items-center gap-4 p-4 xl:gap-5 xl:p-6">
        <View className="w-full max-w-7xl flex-row flex-wrap items-center justify-between gap-3">
          <Text
            accessibilityRole="header"
            android_hyphenationFrequency="normal"
            className="min-w-0 flex-[1_1_10rem] text-base leading-tight font-bold tracking-tight text-white xl:text-2xl"
          >
            {introductionCopy.title}
          </Text>
          <Button
            className="ml-auto"
            size="compact"
            variant="secondary"
            disabled={customValueInvitation?.isSaving}
            onPress={() =>
              isDraftActive ? setMenuRequestId((id) => id + 1) : onOpenMenu()
            }
          >
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
        {customValueInvitation && (
          <NativeCustomValueInvitation
            {...customValueInvitation}
            rankedValues={rankedValues}
            menuRequestId={menuRequestId}
            existingCustomValues={rankedValues.flatMap(({ definition }) =>
              definition.kind === "custom" ? [definition] : [],
            )}
            onNavigationBlockedChange={handleDraftNavigationBlockedChange}
            onExit={(target) => {
              customValueInvitation.onClosed()
              if (target === "menu") onOpenMenu()
              else if (typeof target === "object")
                customValueInvitation.onOpenMatchingValue(target.valueId)
            }}
          />
        )}
        {!isDraftActive && (
          <ScrollView
            className="w-full"
            contentContainerClassName="items-center gap-4 pb-6 xl:gap-5"
          >
            <View className="border-player-card-frame bg-player-card-background relative w-full max-w-7xl flex-row flex-wrap overflow-hidden border-4">
              <View
                accessible
                accessibilityRole="header"
                accessibilityLabel={
                  hasComparisons
                    ? PERSONAL_HUB_COPY.rankedTitle
                    : PERSONAL_HUB_COPY.unrankedTitle
                }
                className="min-w-0 flex-[1_1_10rem] self-center px-3 py-4 xl:w-full xl:flex-auto xl:flex-row xl:justify-center xl:gap-x-3"
              >
                {(hasComparisons
                  ? PERSONAL_HUB_COPY.rankedTitleLines
                  : [PERSONAL_HUB_COPY.unrankedTitle]
                ).map((line) => (
                  <Text
                    key={line}
                    className="text-player-card-ink text-2xl leading-tight font-black xl:text-5xl"
                  >
                    {line}
                  </Text>
                ))}
              </View>
              <View className="xl:bg-player-card-values w-[96px] max-w-full items-center justify-center py-2 pr-2 xl:w-1/3 xl:py-3 xl:pr-0">
                <NativeHeroes99Hero
                  appearance={appearance}
                  shouldReduceMotion={shouldReduceMotion}
                  sizeClassName="h-[112px] w-[80px] xl:h-96 xl:w-64"
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
                className="absolute inset-x-0 bottom-0 z-50 max-h-full"
                contentContainerClassName="p-2"
              >
                {notifications}
              </ScrollView>
            </View>
            <View className="w-full max-w-7xl min-w-0 gap-4">
              <View className="min-w-0 flex-row flex-wrap gap-4">
                <Button
                  className="basis-readable-action max-w-full min-w-0 shrink grow"
                  variant="outline"
                  size="compact"
                  onPress={onAddCustomValue}
                >
                  <Text className="text-center text-base font-black text-black">
                    {PERSONAL_HUB_COPY.add}
                  </Text>
                </Button>
                <Button
                  className="basis-readable-action max-w-full min-w-0 shrink grow-[1.35]"
                  onPress={onStartBattle}
                  accessibilityState={{ busy: isBattlePending }}
                  accessibilityLabel={
                    isBattlePending
                      ? presentationLoadingCopy.cancelBattlePreparation
                      : PERSONAL_HUB_COPY.battle
                  }
                >
                  <View className={cx(isBattlePending && "opacity-0")}>
                    <Text className="text-center text-2xl font-black text-white">
                      {PERSONAL_HUB_COPY.battle}
                    </Text>
                  </View>
                  {isBattlePending && (
                    <View
                      pointerEvents="none"
                      className="absolute inset-0 items-center justify-center"
                    >
                      <Text className="text-center text-lg font-black text-white">
                        {presentationLoadingCopy.preparing}
                      </Text>
                    </View>
                  )}
                </Button>
              </View>
              <View className="min-w-0 gap-4 xl:flex-row">
                <View className="min-w-0 flex-row flex-wrap gap-4 xl:flex-[2]">
                  <Button
                    className="basis-readable-action max-w-full min-w-0 shrink grow"
                    variant="secondary"
                    size="compact"
                    onPress={onCustomize}
                  >
                    <Text
                      android_hyphenationFrequency="normal"
                      className="text-center text-base font-black text-black"
                    >
                      {DRESSING_ROOM_COPY.customize}
                    </Text>
                  </Button>
                  <Button
                    className="basis-readable-action max-w-full min-w-0 shrink grow"
                    variant="secondary"
                    size="compact"
                    onPress={onShare}
                  >
                    <Text
                      android_hyphenationFrequency="normal"
                      className="text-center text-base font-black text-black"
                    >
                      {VALUES_CARD_COPY.title}
                    </Text>
                  </Button>
                </View>
                <Button
                  className="min-w-0 xl:flex-1"
                  variant="outline"
                  size="compact"
                  onPress={onBrowseAllValues}
                >
                  <Text className="text-center text-base font-black text-black">
                    {PERSONAL_HUB_COPY.browse}
                  </Text>
                </Button>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </MapacheScreen>
  )
}
