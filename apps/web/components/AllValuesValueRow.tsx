"use client"

import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import type { StaticImageData } from "next/image"
import { useState, type ReactNode } from "react"
import ValueAnimalPresentation from "@/components/ValueAnimalPresentation"

export default function AllValuesValueRow({
  rankedValue,
  hasComparisons,
  isHighlighted,
  runtimeClipCatalog,
  shouldReduceMotion,
  heading,
  children,
}: {
  rankedValue: RankedValue
  hasComparisons: boolean
  isHighlighted: boolean
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  heading: ReactNode
  children: ReactNode
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const { definition, rank } = rankedValue
  const { accessibleLabel } = getValueRankPresentation(rank)

  return (
    <li
      id={`all-values-row-${definition.id}`}
      tabIndex={-1}
      data-value-row="true"
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setIsHovered(true)
      }}
      onPointerLeave={() => setIsHovered(false)}
      onPointerCancel={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsFocused(false)
      }}
      className={`text-mapache-vivid-dark overflow-x-auto overflow-y-auto border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000000] outline-none xl:p-7 ${isHighlighted ? "ring-mapache-vivid-primary-cyan ring-8" : ""}`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3 xl:gap-5">
        <ValueAnimalPresentation
          rank={rank}
          showRank={hasComparisons}
          catalog={runtimeClipCatalog}
          isAttended={isHovered || isFocused}
          valuePresentation={resolveValueAnimalPresentation(
            definition,
            runtimeClipCatalog,
          )}
          shouldReduceMotion={shouldReduceMotion}
        />
        {hasComparisons ? (
          <span className="sr-only">{accessibleLabel}</span>
        ) : null}
        {heading}
      </div>
      {children}
    </li>
  )
}
