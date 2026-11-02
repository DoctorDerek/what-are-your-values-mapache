"use client"

import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { getValueRankPresentation } from "@game/data/src/ValueRankMedal"
import { getLevelFromXP } from "@game/utils/src/LevelMath"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import RankMedal from "@/components/RankMedal"
import ValueAnimalPresentation from "@/components/ValueAnimalPresentation"
import useAnimalAttentionInput from "@/lib/useAnimalAttentionInput"

export default function PersonalValueRow({
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
  const localizedCopy = useLocaleCatalog()
  const PERSONAL_HUB_COPY = localizedCopy.hub

  const { isAttended, attentionHandlers, tapRequest } = useAnimalAttentionInput(
    undefined,
    "row",
  )
  const { medal, accessibleLabel } = getValueRankPresentation(
    value.rank,
    localizedCopy.interfaceCopy.rank,
  )
  return (
    <li
      {...attentionHandlers}
      tabIndex={0}
      data-value-row="true"
      className="border-player-card-frame flex flex-wrap items-center gap-1.5 border-b px-2 py-2 last:border-0 focus-visible:outline-4 focus-visible:-outline-offset-4 xl:gap-3 xl:px-4"
      id={`hub-value-${value.definition.id}`}
    >
      <span className="flex min-w-7 shrink-0 flex-col items-center gap-1 text-sm tabular-nums xl:text-lg">
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
            {medal && <RankMedal color={medal.color} />}
          </>
        )}
      </span>
      <span
        className="shrink-0"
        id={`hub-value-${value.definition.id}-presentation`}
      >
        <ValueAnimalPresentation
          rank={value.rank}
          showRank={false}
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
      <div className="min-w-0 flex-[1_1_8rem] [overflow-wrap:anywhere]">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-player-card-ink text-lg leading-tight font-black xl:text-2xl">
            {getValueDisplayName(value.definition, localizedCopy.values)}
          </h3>
          <p className="text-player-card-muted text-xs xl:text-sm">
            {PERSONAL_HUB_COPY.level(getLevelFromXP(value.progress.totalXp))}
          </p>
        </div>
        <p className="text-player-card-muted mt-1 text-xs leading-snug xl:text-base">
          {getValueDisplayDefinition(value.definition, localizedCopy.values)}
        </p>
      </div>
    </li>
  )
}
