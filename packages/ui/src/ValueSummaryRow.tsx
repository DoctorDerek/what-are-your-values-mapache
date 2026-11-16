import type { SeethingSwarmAnimalPresentationSize } from "@game/data/src/SeethingSwarmAnimalPresentation"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"
import { getWrappableValueDisplayName } from "@game/data/src/ValueNameTypography"
import type { RankedValue } from "@game/data/src/ValueRanking"
import {
  getValueRankPresentation,
  type ValueRankMedalColor,
} from "@game/data/src/ValueRankMedal"
import { getLevelFromXP } from "@game/utils/src/LevelMath"
import { cx } from "classix"
import type { ComponentType, ReactNode } from "react"

type SummaryChildren = { children: ReactNode; className: string }
export type ValueSummaryPresentation = "hub" | "matching"
export type ValueSummaryRowParts = {
  Frame: ComponentType<SummaryChildren>
  Group: ComponentType<SummaryChildren>
  Name: ComponentType<SummaryChildren & { accessibilityLabel: string }>
  Text: ComponentType<SummaryChildren & { accessibilityLabel?: string }>
  Medal: ComponentType<{ color: ValueRankMedalColor }>
}

export default function ValueSummaryRow({
  value,
  hasComparisons,
  presentation = "hub",
  renderAnimal,
  parts,
}: {
  value: RankedValue
  hasComparisons: boolean
  presentation?: ValueSummaryPresentation
  renderAnimal: (size: SeethingSwarmAnimalPresentationSize) => ReactNode
  parts: ValueSummaryRowParts
}) {
  const localization = useLocaleCatalog()
  const { Frame, Group, Name, Text, Medal } = parts
  const isMatching = presentation === "matching"
  const displayName = getValueDisplayName(value.definition, localization.values)
  const definition = getValueDisplayDefinition(
    value.definition,
    localization.values,
  )
  const { medal, accessibleLabel } = getValueRankPresentation(
    value.rank,
    localization.interfaceCopy.rank,
  )

  return (
    <Frame
      className={cx(
        "flex min-w-0 flex-row flex-wrap items-center",
        isMatching
          ? "gap-x-3 gap-y-1 border-t border-black/20 py-3 xl:gap-x-4"
          : "border-player-card-frame gap-1.5 border-b px-2 py-2 xl:gap-3 xl:px-4",
      )}
    >
      {!isMatching && (
        <Group className="flex min-w-7 shrink-0 flex-col items-center gap-1 text-sm tabular-nums xl:text-lg">
          {hasComparisons && (
            <>
              <Text
                accessibilityLabel={accessibleLabel}
                className={cx(
                  "text-player-card-ink min-w-full text-center text-sm whitespace-nowrap tabular-nums xl:text-lg",
                  value.rank <= 5 && "bg-player-card-rank",
                )}
              >
                #{value.rank}
              </Text>
              {medal && <Medal color={medal.color} />}
            </>
          )}
        </Group>
      )}
      <Group className="shrink-0">
        {renderAnimal(isMatching ? "miniature" : "standard")}
      </Group>
      <Group
        className={
          isMatching
            ? "contents"
            : "min-w-0 shrink grow basis-32 [overflow-wrap:anywhere]"
        }
      >
        <Group
          className={cx(
            "flex min-w-0 flex-row flex-wrap items-baseline gap-x-3 gap-y-1",
            isMatching && "shrink grow basis-32 xl:grow-0 xl:basis-auto",
          )}
        >
          <Name
            accessibilityLabel={displayName}
            className={
              isMatching
                ? "text-mapache-vivid-dark min-w-0 shrink text-base leading-snug font-black wrap-anywhere hyphens-manual"
                : "text-player-card-ink min-w-0 shrink text-lg leading-tight font-black xl:text-2xl"
            }
          >
            {isMatching
              ? getWrappableValueDisplayName(
                  value.definition,
                  localization.values,
                  localization.metadata.languageTag,
                )
              : displayName}
          </Name>
          {!isMatching && (
            <Text className="text-player-card-muted text-xs xl:text-sm">
              {localization.hub.level(getLevelFromXP(value.progress.totalXp))}
            </Text>
          )}
        </Group>
        <Text
          className={
            isMatching
              ? "text-mapache-vivid-dark mt-1 w-full basis-full text-base leading-relaxed wrap-anywhere xl:mt-0 xl:w-auto xl:min-w-0 xl:shrink xl:grow xl:basis-0"
              : "text-player-card-muted mt-1 text-xs leading-snug xl:text-base"
          }
        >
          {isMatching ? `“${definition}”` : definition}
        </Text>
      </Group>
    </Frame>
  )
}
