"use client"

import { PERSONAL_HUB_COPY } from "@game/data/src/PersonalHubCopy"
import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { getValueDisplayDefinition, getValueDisplayName } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import { getLevelFromXP } from "@game/utils/src/LevelMath"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import ValueAnimalPresentation from "@/components/ValueAnimalPresentation"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

export default function PersonalValueRow({
  value, hasComparisons, catalog, shouldReduceMotion,
}: {
  value: RankedValue
  hasComparisons: boolean
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
}) {
  const { isAttended, attentionHandlers } = useAnimalAttentionInput()
  const { medal, accessibleLabel } = getValueRankPresentation(value.rank)
  return (
    <li
      {...attentionHandlers}
      tabIndex={0}
      data-value-row="true"
      className="border-player-card-frame grid grid-cols-[minmax(1.75rem,max-content)_auto_minmax(0,1fr)] items-center gap-1.5 border-b px-2 py-2 last:border-0 focus-visible:outline-4 focus-visible:-outline-offset-4 xl:gap-3 xl:px-4"
      id={`hub-value-${value.definition.id}`}
    >
      <span className="flex flex-col items-center gap-1 text-sm tabular-nums xl:text-lg">
        {hasComparisons && (
          <>
            <span
              aria-label={accessibleLabel}
              className={cx(
                "text-player-card-ink min-w-full text-center whitespace-nowrap",
                value.rank <= 5 && "bg-player-card-rank",
              )}
            >
              #{value.rank}
            </span>
            {medal && <span aria-hidden="true">{medal.emoji}</span>}
          </>
        )}
      </span>
      <span id={`hub-value-${value.definition.id}-presentation`}>
        <ValueAnimalPresentation
          rank={value.rank}
          showRank={false}
          surface="card"
          catalog={catalog}
          isAttended={isAttended}
          valuePresentation={resolveValueAnimalPresentation(value.definition, catalog)}
          shouldReduceMotion={shouldReduceMotion}
        />
      </span>
      <div className="min-w-0 [overflow-wrap:break-word]">
        <h3 className="text-player-card-ink text-lg leading-tight font-black xl:text-2xl">
          {getValueDisplayName(value.definition)}
        </h3>
        <p className="text-player-card-muted mt-1 text-xs leading-snug xl:text-base">
          {getValueDisplayDefinition(value.definition)}
        </p>
        <p className="text-player-card-muted mt-1 text-xs xl:text-sm">
          {PERSONAL_HUB_COPY.level(getLevelFromXP(value.progress.totalXp))}
        </p>
      </div>
    </li>
  )
}
