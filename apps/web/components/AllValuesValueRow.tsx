"use client"

import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import type { ReactNode } from "react"
import ValueAnimalPresentation from "@/components/ValueAnimalPresentation"
import ValueLevelProgress from "@/components/ValueLevelProgress"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

export default function AllValuesValueRow({
  rankedValue,
  hasComparisons,
  isHighlighted,
  runtimeClipCatalog,
  shouldReduceMotion,
  heading,
  actions,
  children,
}: {
  rankedValue: RankedValue
  hasComparisons: boolean
  isHighlighted: boolean
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  heading: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  const localization = useLocaleCatalog()
  const { isAttended, attentionHandlers } = useAnimalAttentionInput()
  const { definition, rank } = rankedValue
  const { accessibleLabel } = getValueRankPresentation(
    rank,
    localization.interfaceCopy.rank,
  )

  return (
    <li
      id={`all-values-row-${definition.id}`}
      tabIndex={-1}
      data-value-row="true"
      {...attentionHandlers}
      className={cx(
        "text-mapache-vivid-dark min-w-0 border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000] outline-none xl:p-7",
        isHighlighted && "ring-mapache-vivid-primary-cyan ring-8",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 xl:gap-5">
        <ValueAnimalPresentation
          rank={rank}
          showRank={hasComparisons}
          catalog={runtimeClipCatalog}
          isAttended={isAttended}
          valuePresentation={resolveValueAnimalPresentation(
            definition,
            runtimeClipCatalog,
          )}
          shouldReduceMotion={shouldReduceMotion}
        />
        {hasComparisons ? (
          <span className="sr-only">{accessibleLabel}</span>
        ) : null}
        <div className="contents xl:flex xl:min-w-0 xl:flex-[1_1_24rem] xl:flex-row-reverse xl:flex-wrap xl:items-center xl:gap-5">
          <ValueLevelProgress totalXp={rankedValue.progress.totalXp} />
          <div className="flex w-full min-w-0 basis-full flex-wrap items-center gap-3 xl:w-auto xl:flex-[1_1_16rem] xl:gap-5">
            {heading}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </li>
  )
}
