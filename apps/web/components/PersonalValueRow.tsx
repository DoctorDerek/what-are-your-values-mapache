"use client"

import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { RankedValue } from "@game/data/src/ValueRanking"
import ValueSummaryRow, {
  type ValueSummaryPresentation,
  type ValueSummaryRowParts,
} from "@game/ui/src/ValueSummaryRow"
import type { StaticImageData } from "next/image"
import RankMedal from "@/components/RankMedal"
import ValueAnimalPresentation from "@/components/ValueAnimalPresentation"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

const Group: ValueSummaryRowParts["Group"] = ({ children, className }) => (
  <div className={className}>{children}</div>
)

const parts: ValueSummaryRowParts = {
  Frame: Group,
  Group,
  Name: ({ children, className, accessibilityLabel }) => (
    <h3 className={className} aria-label={accessibilityLabel}>
      {children}
    </h3>
  ),
  Text: ({ children, className, accessibilityLabel }) => (
    <p className={className} aria-label={accessibilityLabel}>
      {children}
    </p>
  ),
  Medal: RankMedal,
}

export default function PersonalValueRow({
  value,
  hasComparisons,
  catalog,
  shouldReduceMotion,
  presentation = "hub",
}: {
  value: RankedValue
  hasComparisons: boolean
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  presentation?: ValueSummaryPresentation
}) {
  const { isAttended, attentionHandlers, tapRequest } = useAnimalAttentionInput(
    undefined,
    "row",
  )
  const rowId = `${presentation === "hub" ? "hub" : "matching"}-value-${value.definition.id}`
  return (
    <li
      {...attentionHandlers}
      tabIndex={-1}
      data-value-row="true"
      className="focus-visible:outline-4 focus-visible:-outline-offset-4 last:[&>div]:border-b-0"
      id={rowId}
    >
      <ValueSummaryRow
        value={value}
        hasComparisons={hasComparisons}
        presentation={presentation}
        parts={parts}
        animal={
          <span className="block" id={`${rowId}-presentation`}>
            <ValueAnimalPresentation
              surface="card"
              catalog={catalog}
              isAttended={isAttended}
              tapRequest={tapRequest}
              valuePresentation={resolveValueAnimalPresentation(
                value.definition,
                catalog,
              )}
              shouldReduceMotion={shouldReduceMotion}
            />
          </span>
        }
      />
    </li>
  )
}
