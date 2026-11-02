"use client"

import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
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
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import usePresentationElapsedTime from "@game/utils/src/usePresentationElapsedTime"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import MapacheScreen from "@/components/MapacheScreen"
import RankMedal from "@/components/RankMedal"
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
  const localizedCopy = useLocaleCatalog()
  const { integer } = useMemo(
    () => createLocaleFormatters(localizedCopy.metadata.languageTag),
    [localizedCopy.metadata.languageTag],
  )

  const elementRef = useRef<HTMLLIElement>(null)
  const { isAttended, attentionHandlers, tapRequest } = useAnimalAttentionInput(
    undefined,
    "row",
  )
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
        {localizedCopy.interfaceCopy.screen.valueResult(
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
      </span>
      <div
        aria-hidden="true"
        className="flex min-w-0 flex-wrap items-center gap-2"
      >
        <span className="flex shrink-0 flex-col items-center gap-0.5">
          <span className="text-mapache-vivid-dark relative text-center font-mono text-lg font-black tabular-nums">
            <span className="invisible">{frameValue.rankLabelPlaceholder}</span>
            <span className="absolute inset-0">#{rank}</span>
          </span>
          <span
            className="size-6"
            data-results-medal={frameValue.medal ?? "none"}
          >
            {frameValue.medal && <RankMedal color={frameValue.medal} />}
          </span>
        </span>
        <ValueAnimalPresentation
          rank={rank}
          showRank={false}
          catalog={runtimeClipCatalog}
          isAttended={isAttended}
          tapRequest={tapRequest}
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
              {getValueDisplayName(value.definition, localizedCopy.values)}
            </span>
            <span className="text-mapache-vivid-dark text-sm font-bold">
              {localizedCopy.interfaceCopy.screen.valueLevel(integer(level))}
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
            {localizedCopy.interfaceCopy.screen.xpFraction(
              integer(earnedXpTowardNextLevel),
              integer(requiredXpForNextLevel),
            )}
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
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  isMenuOpen: boolean
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

  const focusFromRowPointer = useRef(false)
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
      className="overflow-hidden max-xl:[--mapache-screen-spacing:clamp(4px,calc(100vw_-_10rem),16px)]"
    >
      <div
        className="mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col gap-2 overflow-y-auto overscroll-contain"
        data-controller-scroll
        tabIndex={0}
        onScroll={settleRowPositions}
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 grow basis-36 flex-wrap items-center gap-x-2">
            <h1 className="text-mapache-vivid-primary-cyan max-w-full text-2xl font-black [overflow-wrap:anywhere]">
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
              {localizedCopy.interfaceCopy.screen.savedLocally}
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            controllerAction="menu"
            onClick={onOpenMenu}
          >
            {PRODUCT_MENU_COPY.openAction}
          </Button>
        </header>
        <p className="sr-only" aria-live="polite">
          {localizedCopy.interfaceCopy.screen.resultSummary(
            changeSummary,
            integer(results.exitProfileXp),
            integer(finalProfileProgress.level),
            changeLabel,
          )}
        </p>
        <div className="relative isolate min-h-[10rem] flex-[1_0_10rem] overflow-hidden">
          <div
            className="[container-type:size] relative isolate h-full overflow-y-auto overscroll-contain"
            tabIndex={0}
            onWheelCapture={settleRowPositions}
            onScroll={settleRowPositions}
            onPointerDownCapture={(event) => {
              focusFromRowPointer.current = Boolean(
                (event.target as Element).closest("[data-results-value]"),
              )
            }}
            onFocusCapture={(event) => {
              if (
                !focusFromRowPointer.current ||
                event.target.matches(":focus-visible")
              )
                settleRowPositions()
            }}
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
          {notifications}
        </div>
        <nav
          className="noise-bg bg-mapache-vivid-dark sticky bottom-0 z-10 flex shrink-0 flex-wrap gap-2 pr-[8px] pb-[8px]"
          aria-label={localizedCopy.interfaceCopy.screen.resultsActions}
        >
          <Button
            size="sm"
            wrap
            textCase="normal-case"
            className="max-w-full flex-[1_1_0] text-center leading-tight break-normal wrap-break-word max-xl:px-[2px]"
            onClick={onSeeValues}
          >
            {RESULTS_COPY.seeValuesAction}
          </Button>
          <Button
            size="sm"
            variant="outline"
            wrap
            textCase="normal-case"
            className="max-w-full flex-[1_1_0] text-center leading-tight break-normal wrap-break-word max-xl:px-[2px]"
            onClick={onKeepBattling}
          >
            {RESULTS_COPY.keepBattlingAction}
          </Button>
        </nav>
        <section
          className="shrink-0 border-2 border-black bg-white p-2 text-black shadow-[3px_3px_0_#000]"
          aria-label={localizedCopy.interfaceCopy.screen.profileProgress}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-lg font-black">
              {RESULTS_COPY.profileLevel(integer(profileProgress.level))}
            </span>
            <span className="text-sm font-semibold">
              {RESULTS_COPY.profileXp(integer(frame.profileXp))} ·{" "}
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
            aria-label={localizedCopy.interfaceCopy.screen.profileXpTowardLevel(
              integer(profileProgress.level + 1n),
            )}
            aria-valuetext={localizedCopy.interfaceCopy.screen.xpFraction(
              integer(profileProgress.earnedXpTowardNextLevel),
              integer(profileProgress.requiredXpForNextLevel),
            )}
          />
        </section>
      </div>
    </MapacheScreen>
  )
}
