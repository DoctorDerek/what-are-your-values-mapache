"use client"

import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { projectHubValues } from "@game/data/src/HubValueProjection"
import { PERSONAL_HUB_COPY } from "@game/data/src/PersonalHubCopy"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import type { StaticImageData } from "next/image"
import type { Ref } from "react"
import Heroes99Hero from "@/components/Heroes99Hero"
import PersonalValueRow from "@/components/PersonalValueRow"

export default function PersonalValuesCard({
  appearance,
  rankedValues,
  catalog,
  shouldReduceMotion,
  inert,
  rosterRef,
}: {
  appearance: Heroes99Appearance
  rankedValues: readonly RankedValue[]
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  inert?: boolean
  rosterRef?: Ref<HTMLDivElement>
}) {
  const { hasComparisons, visibleValues, topFive, remainingValues } =
    projectHubValues(rankedValues)
  const renderValue = (value: RankedValue) => (
    <PersonalValueRow
      key={value.definition.id}
      value={value}
      hasComparisons={hasComparisons}
      catalog={catalog}
      shouldReduceMotion={shouldReduceMotion}
    />
  )
  return (
    <section
      inert={inert}
      aria-labelledby="your-values-heading"
      className="border-player-card-frame bg-player-card-background grid min-h-64 w-full max-w-7xl flex-1 grid-cols-[minmax(0,1fr)_6rem] grid-rows-[auto_minmax(8rem,1fr)] overflow-hidden border-4 inert:opacity-50 xl:grid-cols-[minmax(12rem,1fr)_minmax(0,3fr)]"
    >
      <div className="col-start-1 row-start-1 self-center px-3 py-4 xl:col-span-2 xl:text-center">
        <h2
          id="your-values-heading"
          className="text-player-card-ink text-2xl leading-tight font-black xl:text-3xl"
        >
          {hasComparisons
            ? PERSONAL_HUB_COPY.rankedTitleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))
            : PERSONAL_HUB_COPY.unrankedTitle}
        </h2>
        {!hasComparisons && (
          <p className="text-player-card-muted mt-2 text-sm">
            {PERSONAL_HUB_COPY.unrankedNotice}
          </p>
        )}
      </div>
      <div className="xl:bg-player-card-values col-start-2 row-start-1 flex min-h-0 items-center justify-center py-2 pr-2 xl:col-start-1 xl:row-start-2 xl:p-4">
        <Heroes99Hero
          appearance={appearance}
          shouldReduceMotion={shouldReduceMotion}
          className="h-28 w-full xl:h-full xl:max-h-96"
        />
      </div>
      <div
        role="region"
        ref={rosterRef}
        aria-label={
          hasComparisons
            ? PERSONAL_HUB_COPY.rankedList
            : PERSONAL_HUB_COPY.unrankedList
        }
        tabIndex={0}
        className="bg-player-card-values col-span-2 row-start-2 min-h-0 min-w-0 overflow-y-auto overscroll-contain focus-visible:outline-4 focus-visible:-outline-offset-4 xl:col-span-1 xl:col-start-2"
      >
        <ol>{(hasComparisons ? topFive : visibleValues).map(renderValue)}</ol>
        {hasComparisons && remainingValues.length > 0 && (
          <>
            <h3 className="border-player-card-frame bg-player-card-rank text-player-card-ink border-y-2 px-3 py-2 font-bold">
              {PERSONAL_HUB_COPY.remainingValues}
            </h3>
            <ol start={topFive.length + 1}>
              {remainingValues.map(renderValue)}
            </ol>
          </>
        )}
      </div>
    </section>
  )
}
