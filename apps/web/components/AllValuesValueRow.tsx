"use client"

import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import type { ReactNode } from "react"
import RankMedal from "@/components/RankMedal"
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
  const { isAttended, attentionHandlers, tapRequest } = useAnimalAttentionInput(
    undefined,
    "row",
  )
  const { definition, rank } = rankedValue
  const { medal, accessibleLabel } = getValueRankPresentation(
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
        "text-mapache-vivid-dark @container/value min-w-0 border-4 border-black bg-white p-[8px] shadow-[8px_8px_0px_0px_#000000] outline-none xl:p-7 @min-[22rem]/catalog:p-5",
        isHighlighted && "ring-mapache-vivid-primary-cyan ring-8",
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-[4px] gap-y-[8px] xl:gap-5 @min-[18rem]/value:gap-3">
        <div className="order-first contents min-w-0 basis-full items-start justify-between gap-2 xl:flex-1 @min-[18rem]/value:flex">
          <div className="order-first flex min-w-0 basis-full flex-wrap items-baseline gap-2 @min-[18rem]/value:basis-auto">
            {heading}
          </div>
          {hasComparisons && (
            <span className="order-1 flex shrink-0 items-center gap-[4px]">
              <span className="sr-only">{accessibleLabel}</span>
              <span
                aria-hidden="true"
                className="bg-mapache-vivid-secondary-purple px-[5px] py-[3px] text-sm leading-none font-black text-white tabular-nums"
              >
                #{rank}
              </span>
              {medal && <RankMedal color={medal.color} />}
            </span>
          )}
        </div>
        <ValueAnimalPresentation
          surface="catalog"
          catalog={runtimeClipCatalog}
          isAttended={isAttended}
          tapRequest={tapRequest}
          valuePresentation={resolveValueAnimalPresentation(
            definition,
            runtimeClipCatalog,
          )}
          shouldReduceMotion={shouldReduceMotion}
        />
        <ValueLevelProgress totalXp={rankedValue.progress.totalXp} />
      </div>
      {actions}
      {children}
    </li>
  )
}
