"use client"

import { PRODUCT_MENU_COPY } from "@game/data/src/ProductMenu"
import { RESULTS_COPY } from "@game/data/src/ResultsCopy"
import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
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
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import ValueAnimalPresentation from "@/components/ValueAnimalPresentation"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

function ResultsValueRow({
  frameValue,
  runtimeClipCatalog,
  shouldReduceMotion,
  areRowPositionsSettled,
}: {
  frameValue: BattleExitResultsFrameValue
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  areRowPositionsSettled: boolean
}) {
  const elementRef = useRef<HTMLLIElement>(null)
  const { isAttended, attentionHandlers } = useAnimalAttentionInput()
  const [isNearViewport, setIsNearViewport] = useState(false)
  const { value, rank, totalXp } = frameValue
  const { level, earnedXpTowardNextLevel, requiredXpForNextLevel } =
    getLevelProgressFromXP(totalXp)
  const finalLevel = getLevelProgressFromXP(value.exitProgress.totalXp).level
  const rowStyle: CSSProperties & {
    "--results-row-stacking-order": number
    "--results-entry-slot": number
    "--results-final-slot": number
    "--results-travel": number
    "--results-lateral": string
    "--results-scale": number
    "--results-tick-duration": string
  } = {
    "--results-row-stacking-order": frameValue.stackingOrder,
    "--results-entry-slot": value.entryRank - 1,
    "--results-final-slot": value.exitRank - 1,
    "--results-travel": frameValue.motion.travel,
    "--results-lateral": `${frameValue.motion.lateralPercentage}%`,
    "--results-scale": frameValue.motion.scale,
    "--results-tick-duration": `${BATTLE_RESULTS_PRESENTATION_TICK_MS}ms`,
    gridRow: value.exitRank,
  }

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    if (typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setIsNearViewport(true), 0)
      return () => window.clearTimeout(timer)
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry.isIntersecting),
      { rootMargin: "96px" },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <li
      ref={elementRef}
      {...attentionHandlers}
      style={rowStyle}
      data-results-value={value.definition.id}
      data-results-promoted={value.exitRank < value.entryRank || undefined}
      data-results-settled={areRowPositionsSettled || undefined}
      className={cx(
        "results-card-motion relative z-(--results-row-stacking-order) min-h-28 min-w-0 content-center border-2 border-black bg-white p-1 shadow-[3px_3px_0_#000]",
        value.exitRank <= 5 &&
          "border-l-mapache-vivid-secondary-gold border-l-8",
      )}
    >
      <span className="sr-only">
        Rank {value.exitRank}, {getValueDisplayName(value.definition)}, Level{" "}
        {finalLevel},{value.exitProgress.totalXp} total XP.
      </span>
      <div
        aria-hidden="true"
        className="flex min-w-0 flex-wrap items-center gap-2"
      >
        <span className="text-mapache-vivid-dark relative shrink-0 text-center font-mono text-lg font-black tabular-nums">
          <span className="invisible">{frameValue.rankLabelPlaceholder}</span>
          <span className="absolute inset-0">#{rank}</span>
        </span>
        <ValueAnimalPresentation
          rank={rank}
          showRank={false}
          catalog={runtimeClipCatalog}
          isAttended={isAttended}
          valuePresentation={resolveValueAnimalPresentation(
            value.definition,
            runtimeClipCatalog,
          )}
          shouldReduceMotion={shouldReduceMotion}
          showAnimal={isNearViewport}
        />
        <div className="min-w-0 flex-1 basis-24 [overflow-wrap:anywhere]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2">
            <span className="text-mapache-vivid-dark min-w-0 font-black">
              {getValueDisplayName(value.definition)}
            </span>
            <span className="text-mapache-vivid-dark text-sm font-bold">
              Level {level}
            </span>
          </div>
          <Progress
            value={frameValue.levelBarPercentage}
            className="mt-1 h-2 border border-black bg-white"
            indicatorClassName={cx(
              "bg-mapache-vivid-primary-raspberry",
              frameValue.didCrossLevel
                ? "transition-none"
                : "transition-transform duration-75",
            )}
          />
          <span className="text-mapache-vivid-dark text-xs">
            {earnedXpTowardNextLevel}/{requiredXpForNextLevel} XP
          </span>
        </div>
      </div>
    </li>
  )
}

export default function Results({
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
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  isMenuOpen: boolean
  onOpenMenu: () => void
  onSeeValues: () => void
  onKeepBattling: () => void
}) {
  const [isSaveConfirmationVisible, setIsSaveConfirmationVisible] = useState(
    () => getResultsSaveConfirmationRemainingMs(openedAt, Date.now()) > 0,
  )
  useEffect(() => {
    const remainingMs = getResultsSaveConfirmationRemainingMs(
      openedAt,
      Date.now(),
    )
    if (remainingMs === 0) return
    const timeout = window.setTimeout(
      () => setIsSaveConfirmationVisible(false),
      remainingMs,
    )
    return () => window.clearTimeout(timeout)
  }, [openedAt])
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
    const startedAt = performance.now()
    const timer = window.setInterval(() => {
      const nextElapsedMs = Math.min(
        results.presentationDurationMs,
        performance.now() - startedAt,
      )
      setPresentationTime(({ elapsedMs }) => ({
        elapsedMs: Math.max(elapsedMs, nextElapsedMs),
        previousElapsedMs: elapsedMs,
      }))
    }, BATTLE_RESULTS_PRESENTATION_TICK_MS)
    return () => window.clearInterval(timer)
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isMenuOpen || event.defaultPrevented) return
      if (event.key === "Escape") onSeeValues()
      else if (event.key === "Tab" || event.key.startsWith("Arrow"))
        settleRowPositions()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isMenuOpen, onSeeValues, settleRowPositions])

  return (
    <MapacheScreen
      viewport="fixed"
      spacing="compact"
      className="overflow-x-hidden overflow-y-auto"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-2">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
            <h1 className="text-mapache-vivid-primary-cyan text-2xl font-black">
              {RESULTS_COPY.heading}
            </h1>
            <span
              role="status"
              aria-hidden={!isSaveConfirmationVisible}
              className="pointer-events-none text-sm font-semibold text-white transition-opacity motion-reduce:transition-none"
              style={{
                opacity: isSaveConfirmationVisible ? 1 : 0,
                transitionDuration: `${shouldReduceMotion ? 0 : RESULTS_SAVE_CONFIRMATION_FADE_MS}ms`,
              }}
            >
              <span
                aria-hidden="true"
                className="text-mapache-vivid-secondary-green"
              >
                ✓{" "}
              </span>
              {RESULTS_SAVE_CONFIRMATION_COPY}
            </span>
          </div>
          <Button size="sm" variant="secondary" onClick={onOpenMenu}>
            {PRODUCT_MENU_COPY.openAction}
          </Button>
        </header>
        <p className="sr-only" aria-live="polite">
          {changeSummary}. Profile XP {results.exitProfileXp.toString()},
          {changeLabel}. Profile Level {finalProfileProgress.level.toString()}.
        </p>
        <div
          className="[container-type:size] relative isolate min-h-24 flex-1 overflow-y-auto overscroll-contain"
          onWheelCapture={settleRowPositions}
          onScroll={settleRowPositions}
          onFocusCapture={settleRowPositions}
          onKeyDownCapture={settleRowPositions}
        >
          <ol
            aria-label={RESULTS_COPY.rosterLabel}
            className="mx-[6%] my-2 grid auto-rows-fr grid-cols-1 gap-y-1"
          >
            {frame.values.map((frameValue) => (
              <ResultsValueRow
                key={frameValue.value.definition.id}
                frameValue={frameValue}
                runtimeClipCatalog={runtimeClipCatalog}
                shouldReduceMotion={shouldReduceMotion}
                areRowPositionsSettled={
                  areRowPositionsSettled || shouldReduceMotion
                }
              />
            ))}
          </ol>
        </div>
        <section
          className="border-2 border-black bg-white p-2 text-black shadow-[3px_3px_0_#000]"
          aria-label="Profile progress"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-lg font-black">
              {RESULTS_COPY.profileLevelLabel}{" "}
              {profileProgress.level.toString()}
            </span>
            <span className="text-sm font-semibold">
              {RESULTS_COPY.profileXpLabel} {frame.profileXp.toString()} ·{" "}
              <strong className="text-mapache-vivid-primary-raspberry">
                {changeLabel}
              </strong>
            </span>
          </div>
          <Progress
            value={frame.profileLevelBarPercentage}
            className="bg-card mt-1 h-3 border border-black"
            indicatorClassName={cx(
              "bg-mapache-vivid-primary-raspberry",
              frame.profileDidCrossLevel
                ? "transition-none"
                : "transition-transform duration-75",
            )}
            aria-label={`Profile XP toward Level ${(profileProgress.level + 1n).toString()}`}
            aria-valuetext={`${profileProgress.earnedXpTowardNextLevel}/${profileProgress.requiredXpForNextLevel} XP`}
          />
        </section>
        <nav
          className="grid shrink-0 grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2"
          aria-label="Results actions"
        >
          <Button
            size="sm"
            wrap
            className="min-w-0 text-center leading-tight [overflow-wrap:anywhere]"
            onClick={onSeeValues}
          >
            {RESULTS_COPY.seeValuesAction}
          </Button>
          <Button
            size="sm"
            variant="outline"
            wrap
            className="min-w-0 text-center leading-tight [overflow-wrap:anywhere]"
            onClick={onKeepBattling}
          >
            {RESULTS_COPY.keepBattlingAction}
          </Button>
        </nav>
      </div>
    </MapacheScreen>
  )
}
