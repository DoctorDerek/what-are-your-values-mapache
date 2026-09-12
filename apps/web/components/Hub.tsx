"use client"

import { projectHubValues } from "@game/data/src/HubValueProjection"
import { presentationLoadingCopy } from "@game/data/src/PresentationLoadingCopy"
import { PRODUCT_MENU_COPY } from "@game/data/src/ProductMenu"
import {
  resolveValueAnimalPresentation,
  type ValueAnimalPresentation,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
  type ValueId,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import type { StaticImageData } from "next/image"
import { useState, type Ref } from "react"
import MapacheScreen from "@/components/MapacheScreen"
import SeethingSwarmAnimal from "@/components/SeethingSwarmAnimal"
import { useSeethingSwarmAssetStatus } from "@/components/SeethingSwarmAssetPreparation"
import { Button } from "@/components/ui/button"
import ValueLevelProgress from "@/components/ValueLevelProgress"

export const HUB_MENU_BUTTON_ID = "hub-menu-button"

function ValueRankPresentation({
  rank,
  showRank,
  valuePresentation,
  shouldReduceMotion,
}: {
  rank: number
  showRank: boolean
  valuePresentation: ValueAnimalPresentation<StaticImageData> | undefined
  shouldReduceMotion: boolean
}) {
  const imagePath =
    valuePresentation?.kind === "animal"
      ? valuePresentation.clip.relativePath
      : null
  const preparedStatus = useSeethingSwarmAssetStatus(imagePath ?? "")
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null)
  const hasImageFailed =
    imagePath !== null &&
    (preparedStatus === "failed" || failedImagePath === imagePath)
  const { medal } = getValueRankPresentation(rank)
  if (
    !showRank &&
    (!valuePresentation || valuePresentation.kind === "typography-only")
  )
    return null
  if (!valuePresentation || valuePresentation.kind === "typography-only")
    return (
      <span
        aria-hidden="true"
        data-value-presentation="typography-only"
        className="bg-mapache-vivid-secondary-purple flex flex-none items-center gap-2 border-4 border-black px-3 py-2 text-2xl font-black text-white uppercase"
      >
        {showRank ? <span>#{rank}</span> : null}
        {showRank && medal ? <span>{medal.emoji}</span> : null}
      </span>
    )

  return (
    <span aria-hidden="true" className="flex flex-none items-center gap-2">
      <span
        aria-hidden="true"
        data-value-presentation={valuePresentation.kind}
        className="relative flex h-[72px] w-[72px] flex-none items-center justify-center overflow-hidden bg-white shadow-[inset_0_0_0_4px_#000000]"
      >
        {valuePresentation.kind === "animal" && !hasImageFailed ? (
          <SeethingSwarmAnimal
            clip={valuePresentation.clip}
            onLoadError={() => setFailedImagePath(imagePath)}
            shouldReduceMotion={shouldReduceMotion}
          />
        ) : (
          <span className="text-mapache-vivid-secondary-purple text-4xl font-black uppercase">
            {valuePresentation.kind === "custom-initial"
              ? valuePresentation.initial
              : showRank
                ? `#${rank}`
                : null}
          </span>
        )}
        {showRank && !hasImageFailed ? (
          <span className="bg-mapache-vivid-secondary-purple absolute top-0 left-0 z-10 border-r-4 border-b-4 border-black px-1.5 py-1 text-sm leading-none font-black text-white uppercase">
            #{rank}
          </span>
        ) : null}
      </span>
      {showRank && medal ? (
        <span className="text-2xl">{medal.emoji}</span>
      ) : null}
    </span>
  )
}

function ValueRow({
  rankedValue,
  hasComparisons,
  valuePresentation,
  shouldReduceMotion,
  onOpenValue,
  showDivider,
}: {
  rankedValue: RankedValue
  hasComparisons: boolean
  valuePresentation?: ValueAnimalPresentation<StaticImageData>
  shouldReduceMotion: boolean
  onOpenValue: (valueId: ValueId, focusTargetId: string) => void
  showDivider: boolean
}) {
  const { definition, progress, rank } = rankedValue
  const displayName = getValueDisplayName(definition)
  const rowId = `hub-value-${definition.id}`
  const { accessibleLabel } = getValueRankPresentation(rank)

  return (
    <li
      id={rowId}
      data-value-row="true"
      className={`text-mapache-vivid-dark border-2 border-black ${hasComparisons && rank <= 5 ? "bg-mapache-vivid-primary-cyan/10" : "bg-white"}`}
    >
      {showDivider ? (
        <h3 className="bg-mapache-vivid-primary-cyan border-b-4 border-black p-3 text-center text-xl font-black uppercase">
          All Other Values
        </h3>
      ) : null}
      <button
        id={`${rowId}-button`}
        type="button"
        onClick={(event) => onOpenValue(definition.id, event.currentTarget.id)}
        className="hover:bg-mapache-vivid-primary-cyan/10 flex w-full min-w-0 cursor-pointer items-center gap-2 p-2 text-left focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-black xl:gap-3"
        aria-label={`Open ${displayName} in All Values`}
        aria-describedby={hasComparisons ? `${rowId}-rank` : undefined}
      >
        <ValueRankPresentation
          rank={rank}
          showRank={hasComparisons}
          valuePresentation={valuePresentation}
          shouldReduceMotion={shouldReduceMotion}
        />
        {hasComparisons ? (
          <span id={`${rowId}-rank`} className="sr-only">
            {accessibleLabel}
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 text-base font-black [overflow-wrap:anywhere] uppercase xl:text-lg">
              {displayName}
            </span>
            <ValueLevelProgress totalXp={progress.totalXp} compact />
          </span>
          <span className="text-sm [overflow-wrap:anywhere]">
            {getValueDisplayDefinition(definition)}
          </span>
        </span>
      </button>
    </li>
  )
}

function ValueActionRail({
  isBattlePending,
  browseAllValuesButtonRef,
  onBrowseAllValues,
  onAddCustomValue,
  onStartBattle,
}: {
  isBattlePending: boolean
  browseAllValuesButtonRef?: Ref<HTMLButtonElement>
  onBrowseAllValues: (focusTargetId: string) => void
  onAddCustomValue: (focusTargetId: string) => void
  onStartBattle: () => void
}) {
  return (
    <nav
      aria-label="Value actions"
      className="mt-4 grid w-full grid-cols-1 gap-3 xl:grid-cols-3"
    >
      <button
        type="button"
        onClick={onStartBattle}
        aria-busy={isBattlePending}
        aria-label={
          isBattlePending
            ? presentationLoadingCopy.cancelBattlePreparation
            : undefined
        }
        className="bg-mapache-vivid-primary-orange relative min-h-16 flex-1 cursor-pointer border-4 border-black px-5 py-5 text-4xl font-black text-white uppercase shadow-[10px_10px_0px_0px_#000000] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-x-[10px] active:translate-y-[10px] active:shadow-none"
      >
        <span className={isBattlePending ? "invisible" : undefined}>
          Battle
        </span>
        {isBattlePending ? (
          <span className="absolute inset-0 flex items-center justify-center text-lg">
            {presentationLoadingCopy.preparing}
          </span>
        ) : null}
      </button>
      <button
        ref={browseAllValuesButtonRef}
        id="hub-browse-all-values-button"
        type="button"
        onClick={(event) => onBrowseAllValues(event.currentTarget.id)}
        className="bg-mapache-vivid-primary-cyan text-mapache-vivid-dark min-h-16 flex-1 cursor-pointer border-4 border-black px-5 py-5 text-2xl font-black uppercase shadow-[8px_8px_0px_0px_#000000] transition-transform hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-x-[8px] active:translate-y-[8px] active:shadow-none"
      >
        Browse All Values
      </button>
      <button
        id="hub-add-custom-value-button"
        type="button"
        onClick={(event) => onAddCustomValue(event.currentTarget.id)}
        className="bg-mapache-vivid-secondary-purple min-h-16 flex-1 cursor-pointer border-4 border-black px-5 py-5 text-2xl font-black text-white uppercase shadow-[8px_8px_0px_0px_#000000] transition-transform hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-x-[8px] active:translate-y-[8px] active:shadow-none"
      >
        Add Custom Value
      </button>
    </nav>
  )
}

export default function Hub({
  isBattlePending = false,
  rankedValues,
  runtimeClipCatalog,
  browseAllValuesButtonRef,
  dataNotice,
  shouldReduceMotion,
  onBrowseAllValues,
  onAddCustomValue,
  onOpenMenu,
  onOpenValue,
  onStartBattle,
}: {
  isBattlePending?: boolean
  rankedValues: readonly RankedValue[]
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  browseAllValuesButtonRef?: Ref<HTMLButtonElement>
  dataNotice: string | null
  shouldReduceMotion: boolean
  onBrowseAllValues: (focusTargetId: string) => void
  onAddCustomValue: (focusTargetId: string) => void
  onOpenMenu: () => void
  onOpenValue: (valueId: ValueId, focusTargetId: string) => void
  onStartBattle: () => void
}) {
  const { hasComparisons, visibleValues } = projectHubValues(rankedValues)

  return (
    <MapacheScreen
      spacing="standard-xl"
      viewport="scrollable"
      className="flex min-w-0 flex-col items-center [overflow-wrap:anywhere]"
    >
      <div className="mb-3 flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
        <h1
          id="your-values-heading"
          className="text-mapache-vivid-primary-cyan text-3xl font-black uppercase xl:text-4xl"
        >
          Your Values
        </h1>
        <Button
          id={HUB_MENU_BUTTON_ID}
          type="button"
          variant="secondary"
          size="lg"
          onClick={onOpenMenu}
        >
          {PRODUCT_MENU_COPY.openAction}
        </Button>
      </div>

      <section
        aria-labelledby="your-values-heading"
        className="flex min-h-0 w-full max-w-7xl min-w-0 flex-col border-4 border-black bg-white p-3 shadow-[6px_6px_0px_0px_#000000] xl:p-4"
      >
        <h2 className="text-mapache-vivid-dark text-xl font-black uppercase">
          {hasComparisons ? "Your Values" : "Included Values"}
        </h2>
        <p role="status" className="text-mapache-vivid-dark pt-1 pb-3 text-sm">
          {hasComparisons
            ? "Your ranking is based on your committed battles."
            : "Not ranked yet. Browse the included values, then battle when you are ready."}
        </p>
        {dataNotice ? (
          <p
            role="status"
            className="bg-mapache-vivid-secondary-green text-mapache-vivid-dark mb-5 border-4 border-black p-4 text-xl font-black shadow-[6px_6px_0px_0px_#000000]"
          >
            {dataNotice}
          </p>
        ) : null}

        <div
          className="h-120 max-h-[55dvh] min-h-48 overflow-y-auto px-1 pb-2"
          tabIndex={0}
          role="region"
          aria-label="Value roster"
        >
          {hasComparisons ? (
            <h3
              id="top-five-heading"
              className="text-mapache-vivid-dark py-3 text-2xl font-black uppercase"
            >
              Top Five
            </h3>
          ) : null}
          <ol className="flex flex-col gap-3">
            {visibleValues.map((rankedValue, index) => (
              <ValueRow
                key={rankedValue.definition.id}
                rankedValue={rankedValue}
                hasComparisons={hasComparisons}
                valuePresentation={resolveValueAnimalPresentation(
                  rankedValue.definition,
                  runtimeClipCatalog,
                )}
                shouldReduceMotion={shouldReduceMotion}
                onOpenValue={onOpenValue}
                showDivider={hasComparisons && index === 5}
              />
            ))}
          </ol>
        </div>
        <ValueActionRail
          isBattlePending={isBattlePending}
          browseAllValuesButtonRef={browseAllValuesButtonRef}
          onBrowseAllValues={onBrowseAllValues}
          onAddCustomValue={onAddCustomValue}
          onStartBattle={onStartBattle}
        />
      </section>
    </MapacheScreen>
  )
}
