import { PRODUCT_MENU_COPY } from "@game/data/src/ProductMenu"
import { RESULTS_COPY } from "@game/data/src/ResultsCopy"
import {
  resolveValueAnimalPresentation,
  SEETHING_SWARM_HUB_TILE_SIZE,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import {
  BATTLE_RESULTS_PRESENTATION_TICK_MS,
  projectBattleExitResultsFrame,
  type BattleExitResults,
  type BattleExitResultsFrameValue,
} from "@game/machines/src/BattleExitResults"
import {
  getResultsSaveConfirmationRemainingMs,
  RESULTS_SAVE_CONFIRMATION_COPY,
  RESULTS_SAVE_CONFIRMATION_FADE_MS,
} from "@game/machines/src/ResultsSaveStatus"
import { createSeethingSwarmSurfaceGeometry } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FlatList, Pressable, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import MapacheScreen from "@/components/MapacheScreen"
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
      accessibilityLabel={`Rank ${value.exitRank}, ${getValueDisplayName(value.definition)}, Level ${finalLevel}, ${value.exitProgress.totalXp} total XP`}
      onFocus={onFocus}
      className={`mb-1 flex-row flex-wrap items-center gap-2 border-2 border-black bg-white p-1 shadow-[3px_3px_0px_0px_#000000] ${value.exitRank <= 5 ? "border-l-mapache-vivid-secondary-gold border-l-8" : ""}`}
    >
      <View className="relative shrink-0">
        <Text className="invisible font-mono text-lg font-black text-black">
          {frameValue.rankLabelPlaceholder}
        </Text>
        <Text className="absolute inset-0 text-center font-mono text-lg font-black text-black">
          #{rank}
        </Text>
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
            {getValueDisplayName(value.definition)}
          </Text>
          <Text className="text-sm font-bold text-black">Level {level}</Text>
        </View>
        <View className="mt-1 h-2 flex-row overflow-hidden border border-black bg-white">
          <View
            className="bg-mapache-vivid-primary-raspberry"
            style={{ flex: frameValue.levelBarPercentage }}
          />
          <View style={{ flex: 100 - frameValue.levelBarPercentage }} />
        </View>
        <Text className="text-xs text-black">
          {earnedXpTowardNextLevel}/{requiredXpForNextLevel} XP
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
  isMenuOpen,
  onOpenMenu,
  onSeeValues,
  onKeepBattling,
}: {
  results: BattleExitResults
  openedAt?: string | null
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<number>
  shouldReduceMotion: boolean
  isMenuOpen: boolean
  onOpenMenu: () => void
  onSeeValues: () => void
  onKeepBattling: () => void
}) {
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
    return () => clearTimeout(timeout)
  }, [openedAt, saveConfirmationOpacity, shouldReduceMotion])
  const [presentationTime, setPresentationTime] = useState(() => ({
    elapsedMs: shouldReduceMotion ? results.presentationDurationMs : 0,
    previousElapsedMs: shouldReduceMotion ? results.presentationDurationMs : 0,
  }))
  const [areRowPositionsSettled, setAreRowPositionsSettled] = useState(false)
  const settleRowPositions = useCallback(
    () => setAreRowPositionsSettled(true),
    [],
  )
  const isPresentationComplete =
    presentationTime.elapsedMs >= results.presentationDurationMs
  const displayedElapsedMs = shouldReduceMotion
    ? results.presentationDurationMs
    : presentationTime.elapsedMs
  const displayedPreviousElapsedMs = shouldReduceMotion
    ? results.presentationDurationMs
    : presentationTime.previousElapsedMs

  useEffect(() => {
    if (shouldReduceMotion || isPresentationComplete) return
    const startedAt = Date.now()
    const timer = setInterval(() => {
      const nextElapsedMs = Math.min(
        results.presentationDurationMs,
        Date.now() - startedAt,
      )
      setPresentationTime(({ elapsedMs }) => ({
        elapsedMs: Math.max(elapsedMs, nextElapsedMs),
        previousElapsedMs: elapsedMs,
      }))
    }, BATTLE_RESULTS_PRESENTATION_TICK_MS)
    return () => clearInterval(timer)
  }, [
    isPresentationComplete,
    results.presentationDurationMs,
    shouldReduceMotion,
  ])

  const frame = useMemo(
    () =>
      projectBattleExitResultsFrame(
        results,
        displayedElapsedMs,
        displayedPreviousElapsedMs,
        areRowPositionsSettled,
      ),
    [
      results,
      displayedElapsedMs,
      displayedPreviousElapsedMs,
      areRowPositionsSettled,
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
      ? `+${change}`
      : change < 0n
        ? change.toString()
        : "No XP change"
  const changeSummary = results.values.some(
    (value) => value.entryRank !== value.exitRank,
  )
    ? RESULTS_COPY.rankingChangedSummary
    : RESULTS_COPY.progressChangedSummary

  return (
    <MapacheScreen className="p-3">
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
              className="text-mapache-vivid-secondary-green text-sm font-semibold"
            >
              ✓ {RESULTS_SAVE_CONFIRMATION_COPY}
            </Text>
          </Animated.View>
        </View>
        <Button size="compact" variant="secondary" onPress={onOpenMenu}>
          <Text>{PRODUCT_MENU_COPY.openAction}</Text>
        </Button>
      </View>
      <FlatList
        className="min-h-0 flex-1"
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
      <View
        accessible
        accessibilityLabel={`${changeSummary}. Profile Level ${finalProfileProgress.level}, Profile XP ${results.exitProfileXp}, ${changeLabel}`}
        className="border-2 border-black bg-white p-2"
      >
        <View className="flex-row flex-wrap justify-between gap-x-3">
          <Text className="text-lg font-black text-black">
            {RESULTS_COPY.profileLevelLabel} {profileProgress.level.toString()}
          </Text>
          <Text className="font-semibold text-black">
            {RESULTS_COPY.profileXpLabel} {frame.profileXp.toString()} ·{" "}
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
      <View className="gap-2 pt-2">
        <Button
          size="compact"
          onPress={onSeeValues}
          onFocus={settleRowPositions}
        >
          <Text>{RESULTS_COPY.seeValuesAction}</Text>
        </Button>
        <Button
          size="compact"
          variant="outline"
          onPress={onKeepBattling}
          onFocus={settleRowPositions}
        >
          <Text>{RESULTS_COPY.keepBattlingAction}</Text>
        </Button>
      </View>
    </MapacheScreen>
  )
}
