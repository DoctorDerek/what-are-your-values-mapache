"use client"

import { PRODUCT_MENU_COPY } from "@game/data/src/ProductMenu"
import { RESULTS_COPY } from "@game/data/src/ResultsCopy"
import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import {
  BATTLE_RESULTS_PRESENTATION_TICK_MS,
  BATTLE_RESULTS_REORDER_MOTION_MS,
  projectBattleExitResultsFrame,
  type BattleExitResults,
  type BattleExitResultsFrameValue,
} from "@game/machines/src/BattleExitResults"
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import { motion } from "motion/react"
import type { StaticImageData } from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import ValueAnimalPresentation from "@/components/ValueAnimalPresentation"

function ResultsValueRow({
  frameValue,
  runtimeClipCatalog,
  shouldReduceMotion,
  animatePosition,
  areRowPositionsSettled,
}: {
  frameValue: BattleExitResultsFrameValue
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  animatePosition: boolean
  areRowPositionsSettled: boolean
}) {
  const elementRef = useRef<HTMLLIElement>(null)
  const [isNearViewport, setIsNearViewport] = useState(false)
  const { value, rank, totalXp } = frameValue
  const { level, earnedXpTowardNextLevel, requiredXpForNextLevel } =
    getLevelProgressFromXP(totalXp)
  const finalLevel = getLevelProgressFromXP(value.exitProgress.totalXp).level

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
    <motion.li
      ref={elementRef}
      layout={animatePosition ? "position" : false}
      layoutDependency={`${rank}:${areRowPositionsSettled}`}
      transformTemplate={areRowPositionsSettled ? () => "none" : undefined}
      transition={{
        duration: areRowPositionsSettled
          ? 0
          : BATTLE_RESULTS_REORDER_MOTION_MS / 1_000,
        ease: "linear",
      }}
      className={`min-w-0 border-2 border-black bg-white p-1 shadow-[3px_3px_0_#000] ${rank <= 5 ? "border-l-mapache-vivid-secondary-gold border-l-8" : ""}`}
    >
      <span className="sr-only">
        Rank {value.exitRank}, {getValueDisplayName(value.definition)}, Level{" "}
        {finalLevel},{value.exitProgress.totalXp} total XP.
      </span>
      <div
        aria-hidden="true"
        className="flex min-w-0 flex-wrap items-center gap-2"
      >
        <span className="text-mapache-vivid-dark w-8 shrink-0 text-center text-lg font-black">
          #{rank}
        </span>
        <ValueAnimalPresentation
          rank={rank}
          showRank={false}
          catalog={runtimeClipCatalog}
          isAttended={false}
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
            indicatorClassName={`bg-mapache-vivid-primary-raspberry ${frameValue.didCrossLevel ? "transition-none" : "duration-75"}`}
          />
          <span className="text-mapache-vivid-dark text-xs">
            {earnedXpTowardNextLevel}/{requiredXpForNextLevel} XP
          </span>
        </div>
      </div>
    </motion.li>
  )
}

export default function Results({
  results,
  runtimeClipCatalog,
  shouldReduceMotion,
  isMenuOpen,
  onOpenMenu,
  onSeeValues,
  onKeepBattling,
}: {
  results: BattleExitResults
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  isMenuOpen: boolean
  onOpenMenu: () => void
  onSeeValues: () => void
  onKeepBattling: () => void
}) {
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
          <h1 className="text-mapache-vivid-primary-cyan text-2xl font-black">
            {RESULTS_COPY.heading}
          </h1>
          <Button size="sm" variant="secondary" onClick={onOpenMenu}>
            {PRODUCT_MENU_COPY.openAction}
          </Button>
        </header>
        <p className="sr-only" aria-live="polite">
          {changeSummary}. Profile XP {results.exitProfileXp.toString()},
          {changeLabel}. Profile Level {finalProfileProgress.level.toString()}.
        </p>
        <motion.ol
          layoutScroll
          aria-label={RESULTS_COPY.rosterLabel}
          className="min-h-24 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
          onWheelCapture={settleRowPositions}
          onTouchStartCapture={settleRowPositions}
          onFocusCapture={settleRowPositions}
          onKeyDownCapture={settleRowPositions}
        >
          {frame.values.map((frameValue) => (
            <ResultsValueRow
              key={frameValue.value.definition.id}
              frameValue={frameValue}
              runtimeClipCatalog={runtimeClipCatalog}
              shouldReduceMotion={shouldReduceMotion}
              animatePosition={!shouldReduceMotion && !areRowPositionsSettled}
              areRowPositionsSettled={
                areRowPositionsSettled || shouldReduceMotion
              }
            />
          ))}
        </motion.ol>
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
            className="mt-1 h-3 border border-black"
            indicatorClassName={`bg-mapache-vivid-primary-raspberry ${frame.profileDidCrossLevel ? "transition-none" : "duration-75"}`}
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
            className="min-w-0 text-center leading-tight [overflow-wrap:anywhere] whitespace-normal"
            onClick={onSeeValues}
          >
            {RESULTS_COPY.seeValuesAction}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-w-0 text-center leading-tight [overflow-wrap:anywhere] whitespace-normal"
            onClick={onKeepBattling}
          >
            {RESULTS_COPY.keepBattlingAction}
          </Button>
        </nav>
      </div>
    </MapacheScreen>
  )
}
