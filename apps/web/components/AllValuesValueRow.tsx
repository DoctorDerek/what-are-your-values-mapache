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
        "text-mapache-vivid-dark @container min-w-0 border-4 border-black bg-white p-[min(--spacing(5),2.5%)] shadow-[8px_8px_0px_0px_#000000] outline-none xl:p-7",
        isHighlighted && "ring-mapache-vivid-primary-cyan ring-8",
      )}
    >
      <div className="flow-root min-w-0 xl:flex xl:items-center xl:gap-5">
        <div
          className={cx(
            "float-left mb-2 flex max-w-full flex-wrap items-baseline gap-2 xl:m-0 xl:min-w-0 xl:flex-1",
            hasComparisons ? "w-fit min-w-[min(100%,--spacing(56))]" : "w-full",
          )}
        >
          {heading}
        </div>
        {hasComparisons && (
          <span className="float-right mb-2 flex shrink-0 items-center gap-0.5 xl:m-0">
            <span className="sr-only">{accessibleLabel}</span>
            <span
              aria-hidden="true"
              className="bg-mapache-vivid-secondary-purple px-1 py-1 text-sm leading-none font-black text-white tabular-nums"
            >
              #{rank}
            </span>
            {medal && <RankMedal color={medal.color} />}
          </span>
        )}
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
