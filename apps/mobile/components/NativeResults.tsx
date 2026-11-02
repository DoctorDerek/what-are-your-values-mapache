import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import {
  resolveValueAnimalPresentation,
  SEETHING_SWARM_HUB_TILE_SIZE,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import {
  BATTLE_RESULTS_PRESENTATION_TICK_MS,
  projectBattleExitResultsFrame,
  type BattleExitResults,
  type BattleExitResultsFrameValue,
} from "@game/machines/src/BattleExitResults"
import {
  getResultsSaveConfirmationRemainingMs,
  RESULTS_SAVE_CONFIRMATION_FADE_MS,
} from "@game/machines/src/ResultsSaveStatus"
import { createSeethingSwarmSurfaceGeometry } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import usePresentationElapsedTime from "@game/utils/src/usePresentationElapsedTime"
import { cx } from "classix"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { FlatList, Pressable, ScrollView, View } from "react-native"
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import MapacheScreen from "@/components/MapacheScreen"
import NativeRankMedal from "@/components/NativeRankMedal"
import NativeResultsValueCell from "@/components/NativeResultsValueCell"
import NativeSeethingSwarmHubAnimal from "@/components/NativeSeethingSwarmHubAnimal"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

function NativeResultsValueRow({
  frameValue,
  runtimeClipCatalog,
  shouldReduceMotion,
  onFocus,
}: {
  frameValue: BattleExitResultsFrameValue
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
  shouldReduceMotion: boolean
  onFocus: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const { integer } = useMemo(
    () => createLocaleFormatters(localizedCopy.metadata.languageTag),
    [localizedCopy.metadata.languageTag],
  )

  const { value, rank, totalXp } = frameValue
  const { isAttended, attentionHandlers } = useAnimalAttentionInput()
  const { level, earnedXpTowardNextLevel, requiredXpForNextLevel } =
    getLevelProgressFromXP(totalXp)
  const finalLevel = getLevelProgressFromXP(value.exitProgress.totalXp).level
  const valuePresentation = resolveValueAnimalPresentation(
    value.definition,
    runtimeClipCatalog,
  )
  const geometry =
    valuePresentation.kind === "animal"
      ? createSeethingSwarmSurfaceGeometry(valuePresentation.animal, "portrait")
      : null

  return (
    <Pressable
      accessible
      {...attentionHandlers}
      accessibilityLabel={localizedCopy.interfaceCopy.screen.valueResult(
        integer(value.exitRank),
        getValueDisplayName(value.definition, localizedCopy.values),
        integer(finalLevel),
        integer(value.exitProgress.totalXp),
        frameValue.finalMedal
          ? localizedCopy.interfaceCopy.rank.medal(
              value.exitRank,
              localizedCopy.interfaceCopy.rank[frameValue.finalMedal],
            )
          : undefined,
      )}
      onFocus={onFocus}
      className={cx(
        "mb-1 flex-row flex-wrap items-center gap-2 border-2 border-black bg-white p-1 shadow-[3px_3px_0px_0px_#000000]",
        value.exitRank <= 5 &&
          "border-l-mapache-vivid-secondary-gold border-l-8",
      )}
    >
      <View className="shrink-0 items-center gap-0.5">
        <View className="relative">
          <Text className="invisible font-mono text-lg font-black text-black">
            {frameValue.rankLabelPlaceholder}
          </Text>
          <Text className="absolute inset-0 text-center font-mono text-lg font-black text-black">
            #{rank}
          </Text>
        </View>
        <View className="size-6">
          {frameValue.medal && <NativeRankMedal color={frameValue.medal} />}
        </View>
      </View>
      {valuePresentation.kind === "animal" && geometry ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          className="items-center justify-center bg-white"
          style={{
            width: Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry.width),
            height: Math.max(SEETHING_SWARM_HUB_TILE_SIZE, geometry.height),
          }}
        >
          <NativeSeethingSwarmHubAnimal
            calmClip={valuePresentation.clip}
            catalog={runtimeClipCatalog}
            isAttended={isAttended}
            geometry={geometry}
            shouldReduceMotion={shouldReduceMotion}
          />
        </View>
      ) : null}
      <View className="min-w-0 flex-1 basis-24">
        <View className="flex-row flex-wrap items-baseline justify-between gap-x-2">
          <Text className="min-w-0 flex-1 text-base font-black text-black">
            {getValueDisplayName(value.definition, localizedCopy.values)}
          </Text>
          <Text className="text-sm font-bold text-black">
            {localizedCopy.interfaceCopy.screen.valueLevel(integer(level))}
          </Text>
        </View>
        <View className="mt-1 h-2 flex-row overflow-hidden border border-black bg-white">
          <View
            className="bg-mapache-vivid-primary-raspberry"
            style={{ flex: frameValue.levelBarPercentage }}
          />
          <View style={{ flex: 100 - frameValue.levelBarPercentage }} />
        </View>
        <Text className="text-xs text-black">
          {localizedCopy.interfaceCopy.screen.xpFraction(
            integer(earnedXpTowardNextLevel),
            integer(requiredXpForNextLevel),
          )}
        </Text>
      </View>
    </Pressable>
  )
}

export default function NativeResults({
  results,
  openedAt = null,
  runtimeClipCatalog,
  shouldReduceMotion,
  notifications,
  areRowPositionsSettled,
  isPresentationComplete,
  onSettleRowPositions: settleRowPositions,
  onPresentationCompleted,
  onOpenMenu,
  onSeeValues,
  onKeepBattling,
}: {
  results: BattleExitResults
  openedAt?: string | null
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
  shouldReduceMotion: boolean
  notifications?: ReactNode
  areRowPositionsSettled: boolean
  isPresentationComplete: boolean
  onSettleRowPositions: () => void
  onPresentationCompleted: () => void
  onOpenMenu: () => void
  onSeeValues: () => void
  onKeepBattling: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const { integer } = useMemo(
    () => createLocaleFormatters(localizedCopy.metadata.languageTag),
    [localizedCopy.metadata.languageTag],
  )
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu
  const RESULTS_COPY = localizedCopy.interfaceCopy.results

  const [isSaveConfirmationVisible, setIsSaveConfirmationVisible] = useState(
    () => getResultsSaveConfirmationRemainingMs(openedAt, Date.now()) > 0,
  )
  const saveConfirmationOpacity = useSharedValue(
    isSaveConfirmationVisible ? 1 : 0,
  )
  const saveConfirmationStyle = useAnimatedStyle(() => ({
    opacity: saveConfirmationOpacity.value,
  }))
  useEffect(() => {
    const remainingMs = getResultsSaveConfirmationRemainingMs(
      openedAt,
      Date.now(),
    )
    if (remainingMs === 0) return
    const timeout = setTimeout(() => {
      setIsSaveConfirmationVisible(false)
      saveConfirmationOpacity.set(
        shouldReduceMotion
          ? 0
          : withTiming(0, { duration: RESULTS_SAVE_CONFIRMATION_FADE_MS }),
      )
    }, remainingMs)
    return () => {
      clearTimeout(timeout)
      cancelAnimation(saveConfirmationOpacity)
    }
  }, [openedAt, saveConfirmationOpacity, shouldReduceMotion])
  const {
    elapsedMs: displayedElapsedMs,
    previousElapsedMs: displayedPreviousElapsedMs,
  } = usePresentationElapsedTime({
    openedAt,
    durationMs: results.presentationDurationMs,
    tickMs: BATTLE_RESULTS_PRESENTATION_TICK_MS,
    isComplete: shouldReduceMotion || isPresentationComplete,
  })
  useEffect(() => {
    if (
      !isPresentationComplete &&
      displayedElapsedMs >= results.presentationDurationMs
    )
      onPresentationCompleted()
  }, [
    displayedElapsedMs,
    isPresentationComplete,
    onPresentationCompleted,
    results.presentationDurationMs,
  ])

  const frame = useMemo(
    () =>
      projectBattleExitResultsFrame(
        results,
        displayedElapsedMs,
        displayedPreviousElapsedMs,
        areRowPositionsSettled || shouldReduceMotion,
      ),
    [
      results,
      displayedElapsedMs,
      displayedPreviousElapsedMs,
      areRowPositionsSettled,
      shouldReduceMotion,
    ],
  )
  const finalProfileProgress = useMemo(
    () =>
      projectBattleExitResultsFrame(results, results.presentationDurationMs)
        .profileLevelProgress,
    [results],
  )
  const positionedValues = useMemo(
    () =>
      displayedElapsedMs === 0 && !areRowPositionsSettled
        ? frame.values.toSorted(
            (first, second) => first.value.entryRank - second.value.entryRank,
          )
        : frame.values,
    [areRowPositionsSettled, displayedElapsedMs, frame.values],
  )
  const profileProgress = frame.profileLevelProgress
  const change = results.profileXpChange
  const changeLabel =
    change > 0n
      ? `+${integer(change)}`
      : change < 0n
        ? integer(change)
        : localizedCopy.interfaceCopy.screen.noXpChange
  const changeSummary = results.values.some(
    (value) => value.entryRank !== value.exitRank,
  )
    ? RESULTS_COPY.rankingChangedSummary
    : RESULTS_COPY.progressChangedSummary

  const header = (
    <View className="flex-row flex-wrap items-center justify-between gap-2 pb-2">
      <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-x-2">
        <Text
          accessibilityRole="header"
          className="text-mapache-vivid-primary-cyan text-2xl font-black"
        >
          {RESULTS_COPY.heading}
        </Text>
        <Animated.View
          style={saveConfirmationStyle}
          pointerEvents="none"
          accessibilityElementsHidden={!isSaveConfirmationVisible}
          importantForAccessibility={
            isSaveConfirmationVisible ? "auto" : "no-hide-descendants"
          }
        >
          <Text
            accessibilityLiveRegion="polite"
            className="text-sm font-semibold text-white"
          >
            <Text className="text-mapache-vivid-secondary-green text-base">
              ✓{" "}
            </Text>
            {localizedCopy.interfaceCopy.screen.savedLocally}
          </Text>
        </Animated.View>
      </View>
      <Button size="compact" variant="secondary" onPress={onOpenMenu}>
        <Text>{PRODUCT_MENU_COPY.openAction}</Text>
      </Button>
    </View>
  )

  return (
    <MapacheScreen className="p-3">
      <View className="relative min-h-0 flex-1 overflow-hidden">
        <FlatList
          className="min-h-0 flex-1"
          ListHeaderComponent={header}
          data={positionedValues}
          CellRendererComponent={NativeResultsValueCell}
          keyExtractor={({ value }) => value.definition.id}
          onScrollBeginDrag={settleRowPositions}
          removeClippedSubviews={false}
          accessibilityLabel={RESULTS_COPY.rosterLabel}
          renderItem={({ item }) => (
            <NativeResultsValueRow
              frameValue={item}
              runtimeClipCatalog={runtimeClipCatalog}
              shouldReduceMotion={shouldReduceMotion}
              onFocus={settleRowPositions}
            />
          )}
        />
        {notifications}
      </View>
      <View className="max-h-[65%] min-h-0 shrink-0 flex-col">
        <ScrollView
          className="max-h-[40vh] shrink-0 grow-0"
          contentContainerClassName="flex-row flex-wrap gap-2 pt-2 pb-2"
        >
          <Button
            size="compact"
            className="basis-readable-action min-w-0 flex-1"
            onPress={onSeeValues}
            onFocus={settleRowPositions}
          >
            <Text>{RESULTS_COPY.seeValuesAction}</Text>
          </Button>
          <Button
            size="compact"
            variant="outline"
            className="basis-readable-action min-w-0 flex-1"
            onPress={onKeepBattling}
            onFocus={settleRowPositions}
          >
            <Text>{RESULTS_COPY.keepBattlingAction}</Text>
          </Button>
        </ScrollView>
        <ScrollView className="max-h-[25vh] min-h-0 shrink grow-0">
          <View
            accessible
            accessibilityLabel={localizedCopy.interfaceCopy.screen.resultSummary(
              changeSummary,
              integer(results.exitProfileXp),
              integer(finalProfileProgress.level),
              changeLabel,
            )}
            className="border-2 border-black bg-white p-2"
          >
            <View className="flex-row flex-wrap justify-between gap-x-3">
              <Text className="text-lg font-black text-black">
                {RESULTS_COPY.profileLevel(integer(profileProgress.level))}
              </Text>
              <Text className="text-base font-semibold text-black">
                {RESULTS_COPY.profileXp(integer(frame.profileXp))} ·{" "}
                {changeLabel}
              </Text>
            </View>
            <View className="mt-1 h-3 flex-row overflow-hidden border border-black">
              <View
                className="bg-mapache-vivid-primary-raspberry"
                style={{ flex: frame.profileLevelBarPercentage }}
              />
              <View style={{ flex: 100 - frame.profileLevelBarPercentage }} />
            </View>
          </View>
        </ScrollView>
      </View>
    </MapacheScreen>
  )
}
