import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { projectHubValues } from "@game/data/src/HubValueProjection"
import type { ImportConfirmation } from "@game/data/src/ImportConfirmation"
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
  importConfirmation = null,
  notifications,
  shouldReduceMotion,
  onAddCustomValue,
  onBrowseAllValues,
  onOpenAchievements,
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
  importConfirmation?: ImportConfirmation | null
  notifications?: ReactNode
  shouldReduceMotion: boolean
  onAddCustomValue: () => void
  onBrowseAllValues: () => void
  onOpenAchievements: () => void
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

  const { hasComparisons, visibleValues, topFive, remainingValues } =
    projectHubValues(rankedValues)
  const renderValue = (value: RankedValue) => (
    <NativeHubValueRow
      key={value.definition.id}
      rankedValue={value}
      showRank={hasComparisons}
      shouldReduceMotion={shouldReduceMotion}
      runtimeClipCatalog={runtimeClipCatalog}
    />
  )
  const header = (
    <>
      <View className="w-full max-w-7xl flex-row flex-wrap items-center justify-between gap-3 pr-2">
        <View className="relative min-w-0 flex-[1_1_10rem] justify-center">
          <Text
            accessibilityRole="header"
            android_hyphenationFrequency="normal"
            className={cx(
              "ios:font-[AvenirNextCondensed-Heavy] android:font-[sans-serif-condensed] web:font-home-title web:font-normal text-lg leading-tight font-black tracking-normal text-white xl:text-[32px]",
              importConfirmation && "opacity-0",
            )}
          >
            {introductionCopy.title}
          </Text>
          {importConfirmation && (
            <View className="absolute inset-0 justify-center">
              <Text
                accessibilityLiveRegion="polite"
                accessibilityLabel={importConfirmation.message}
                className="text-sm leading-tight font-bold text-white xl:text-2xl"
              >
                <Text className="text-green-300">✓</Text>{" "}
                {importConfirmation.summary}
              </Text>
            </View>
          )}
        </View>
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
    </>
  )

  return (
    <MapacheScreen>
      <View className="min-h-0 flex-1 items-center gap-4 p-4 xl:gap-5 xl:p-6">
        {customValueInvitation && (
          <NativeCustomValueInvitation
            {...customValueInvitation}
            header={header}
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
          <>
            <ScrollView
              bounces={false}
              overScrollMode="never"
              className="-mt-2 min-h-[50%] w-full flex-1"
              contentContainerClassName="grow items-center gap-4 pt-2 xl:gap-5"
            >
              {header}
              <View className="border-player-card-frame bg-player-card-background relative min-h-48 w-full max-w-7xl flex-1 overflow-hidden border-4 xl:flex-row xl:flex-wrap">
                <View className="flex-row flex-wrap items-center xl:contents">
                  <View
                    accessible
                    accessibilityRole="header"
                    accessibilityLabel={
                      hasComparisons
                        ? PERSONAL_HUB_COPY.rankedTitle
                        : PERSONAL_HUB_COPY.unrankedTitle
                    }
                    className="min-w-0 flex-[1_1_8.5rem] self-center px-3 py-[min(1rem,max(0.25rem,calc(100vh-37rem)))] xl:w-full xl:flex-auto xl:flex-row xl:justify-center xl:gap-x-3 xl:py-4"
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
                    {!hasComparisons && (
                      <Text className="text-player-card-muted mt-2 text-sm">
                        {PERSONAL_HUB_COPY.unrankedNotice}
                      </Text>
                    )}
                  </View>
                  <View className="xl:bg-player-card-values ml-auto max-w-full items-center justify-center p-2 xl:ml-0 xl:w-1/3 xl:p-3">
                    <NativeHeroes99Hero
                      appearance={appearance}
                      shouldReduceMotion={shouldReduceMotion}
                      interactive
                      sizeClassName="h-24 w-[min(10rem,max(4rem,calc(45vw-2rem)))] xl:h-32 xl:w-52"
                    />
                  </View>
                </View>
                <ScrollView
                  nestedScrollEnabled
                  bounces={false}
                  overScrollMode="never"
                  accessibilityLabel={
                    hasComparisons
                      ? PERSONAL_HUB_COPY.rankedList
                      : PERSONAL_HUB_COPY.unrankedList
                  }
                  className="bg-player-card-values min-h-12 w-full flex-1 xl:w-2/3 xl:flex-auto"
                >
                  {(hasComparisons ? topFive : visibleValues).map(renderValue)}
                  {hasComparisons && remainingValues.length > 0 && (
                    <>
                      <Text className="border-player-card-frame bg-player-card-rank text-player-card-ink border-y-2 px-3 py-2 font-bold">
                        {PERSONAL_HUB_COPY.remainingValues}
                      </Text>
                      {remainingValues.map(renderValue)}
                    </>
                  )}
                </ScrollView>
                <ScrollView
                  pointerEvents="box-none"
                  className="absolute inset-x-0 bottom-0 z-50 max-h-full"
                  contentContainerClassName="p-2"
                >
                  {notifications}
                </ScrollView>
              </View>
            </ScrollView>
            <ScrollView
              bounces={false}
              overScrollMode="never"
              className="max-h-[60%] min-h-0 w-full shrink grow-0"
              contentContainerClassName="items-center pr-2 pb-3"
            >
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
                  <View className="min-w-0 flex-row flex-wrap gap-4 xl:flex-1">
                    <Button
                      className="min-w-0 flex-[1.4_1_5rem]"
                      variant="outline"
                      size="compact"
                      onPress={onBrowseAllValues}
                    >
                      <Text
                        android_hyphenationFrequency="normal"
                        className="text-center text-base font-black text-black"
                      >
                        {PERSONAL_HUB_COPY.browse}
                      </Text>
                    </Button>
                    <Button
                      className="min-w-0 flex-auto"
                      variant="outline"
                      size="compact"
                      onPress={onOpenAchievements}
                    >
                      <Text
                        android_hyphenationFrequency="normal"
                        className="text-center text-base font-black text-black"
                      >
                        {localizedCopy.interfaceCopy.screen.achievements}
                      </Text>
                    </Button>
                  </View>
                </View>
              </View>
            </ScrollView>
          </>
        )}
      </View>
    </MapacheScreen>
  )
}
