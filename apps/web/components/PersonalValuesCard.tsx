"use client"

import type { Heroes99Appearance } from "@game/data/src/Heroes99Appearance"
import { projectHubValues } from "@game/data/src/HubValueProjection"
import { PERSONAL_HUB_COPY } from "@game/data/src/PersonalHubCopy"
import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getLevelFromXP } from "@game/utils/src/LevelMath"
import type { StaticImageData } from "next/image"
import Heroes99Hero from "@/components/Heroes99Hero"
import ValueAnimalPresentation from "@/components/ValueAnimalPresentation"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

function PersonalValueRow({
  value,
  hasComparisons,
  catalog,
  shouldReduceMotion,
}: {
  value: RankedValue
  hasComparisons: boolean
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
}) {
  const { isAttended, attentionHandlers } = useAnimalAttentionInput()
  return (
    <li
      {...attentionHandlers}
      tabIndex={0}
      data-value-row="true"
      className="border-player-card-frame grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2 border-b-2 px-2 py-3 last:border-0 focus-visible:outline-4 focus-visible:-outline-offset-4 xl:grid-cols-[auto_auto_minmax(0,1fr)_auto] xl:gap-5 xl:px-6"
      id={`hub-value-${value.definition.id}`}
    >
      <span className="bg-player-card-rank text-player-card-ink min-w-8 text-center text-xl tabular-nums xl:min-w-12 xl:text-3xl">
        {hasComparisons && `#${value.rank}`}
      </span>
      <span
        id={`hub-value-${value.definition.id}-presentation`}
      >
        <ValueAnimalPresentation
          rank={value.rank}
          showRank={false}
          surface="card"
          catalog={catalog}
          isAttended={isAttended}
          valuePresentation={resolveValueAnimalPresentation(
            value.definition,
            catalog,
          )}
          shouldReduceMotion={shouldReduceMotion}
        />
      </span>
      <div className="min-w-0">
        <h2 className="text-player-card-ink text-lg leading-tight font-black [overflow-wrap:anywhere] xl:text-3xl">
          {getValueDisplayName(value.definition)}
        </h2>
        <p className="text-player-card-muted mt-1 text-sm leading-snug [overflow-wrap:anywhere] xl:text-base">
          {getValueDisplayDefinition(value.definition)}
        </p>
        <p className="text-player-card-muted mt-1 text-sm xl:hidden">
          {PERSONAL_HUB_COPY.level(getLevelFromXP(value.progress.totalXp))}
        </p>
      </div>
      <span className="text-player-card-muted hidden text-lg whitespace-nowrap xl:block">
        {PERSONAL_HUB_COPY.level(getLevelFromXP(value.progress.totalXp))}
      </span>
    </li>
  )
}

export default function PersonalValuesCard({
  appearance,
  rankedValues,
  catalog,
  shouldReduceMotion,
  inert,
}: {
  appearance: Heroes99Appearance
  rankedValues: readonly RankedValue[]
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  inert?: boolean
}) {
  const { hasComparisons, topFive } = projectHubValues(rankedValues)
  return (
    <section
      inert={inert}
      aria-labelledby="your-values-heading"
      className="border-player-card-frame bg-player-card-background grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_6rem] overflow-hidden border-4 inert:opacity-50 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
    >
      <h1
        id="your-values-heading"
        className="text-player-card-ink col-start-1 row-start-1 self-center px-4 py-5 text-3xl leading-tight font-black xl:col-span-2 xl:text-center xl:text-5xl"
      >
        {hasComparisons
          ? PERSONAL_HUB_COPY.rankedTitle
          : PERSONAL_HUB_COPY.unrankedTitle}
      </h1>
      <div className="xl:bg-player-card-values col-start-2 row-start-1 flex items-center justify-center py-3 pr-2 xl:col-start-1 xl:row-start-2 xl:p-6">
        <Heroes99Hero
          appearance={appearance}
          shouldReduceMotion={shouldReduceMotion}
          className="h-28 w-full xl:h-96"
        />
      </div>
      <ol
        aria-label={
          hasComparisons
            ? PERSONAL_HUB_COPY.rankedList
            : PERSONAL_HUB_COPY.unrankedList
        }
        className="bg-player-card-values col-span-2 row-start-2 min-w-0 xl:col-span-1 xl:col-start-2"
      >
        {topFive.map((value) => (
          <PersonalValueRow
            key={value.definition.id}
            value={value}
            hasComparisons={hasComparisons}
            catalog={catalog}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </ol>
      {!hasComparisons && (
        <p className="text-player-card-muted bg-player-card-values col-span-2 px-4 py-3 text-sm">
          {PERSONAL_HUB_COPY.unrankedNotice}
        </p>
      )}
    </section>
  )
}
