import { getLevelFromXP } from "@game/utils/src/LevelMath"
import type { Heroes99Appearance } from "./Heroes99Appearance"
import { projectHubValues } from "./HubValueProjection"
import { createLocaleFormatters } from "./LocaleFormatters"
import {
  getLocaleCatalog,
  type LocalizationCatalog,
} from "./LocalizationCatalog"
import { resolveValueAnimalPresentation } from "./SeethingSwarmAnimalPresentation"
import type {
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
} from "./SeethingSwarmRuntimeClipCatalog"
import { getValueDisplayName } from "./Value"
import type { RankedValue } from "./ValueRanking"
import {
  getValueRankPresentation,
  type ValueRankMedalColor,
} from "./ValueRankMedal"
import { VALUES_CARD_COPY } from "./ValuesCardCopy"

export const VALUES_CARD_SIZE = Object.freeze({ width: 1600, height: 900 })
export const VALUES_CARD_COLOR_VARIABLES = [
  "--color-player-card-frame",
  "--color-player-card-background",
  "--color-player-card-values",
  "--color-player-card-rank",
  "--color-player-card-ink",
  "--color-player-card-muted",
  "--color-mapache-vivid-dark",
  "--color-mapache-vivid-white",
] as const

export type ValuesCardPalette = Readonly<{
  frame: string
  background: string
  values: string
  rank: string
  ink: string
  muted: string
  invitationBackground: string
  invitationText: string
}>

export function readValuesCardPalette(
  values: readonly unknown[],
): ValuesCardPalette {
  const [
    frame,
    background,
    plane,
    rank,
    ink,
    muted,
    invitationBackground,
    invitationText,
  ] = values
  if (
    typeof frame !== "string" ||
    !frame.trim() ||
    typeof background !== "string" ||
    !background.trim() ||
    typeof plane !== "string" ||
    !plane.trim() ||
    typeof rank !== "string" ||
    !rank.trim() ||
    typeof ink !== "string" ||
    !ink.trim() ||
    typeof muted !== "string" ||
    !muted.trim() ||
    typeof invitationBackground !== "string" ||
    !invitationBackground.trim() ||
    typeof invitationText !== "string" ||
    !invitationText.trim()
  )
    throw new Error("The values-card colors are unavailable")
  return {
    frame,
    background,
    values: plane,
    rank,
    ink,
    muted,
    invitationBackground,
    invitationText,
  }
}

export type ValuesCardFormat = "gif" | "png"
export type ValuesCardModel<Asset> = Readonly<{
  title: string
  invitation: string
  copy: LocalizationCatalog["card"]
  hasComparisons: boolean
  appearance: Heroes99Appearance
  values: readonly Readonly<{
    name: string
    level: number
    levelLabel: string
    rankLabel: string
    medal: ValueRankMedalColor | null
    animal: SeethingSwarmRuntimeCharacterClip<Asset> | null
  }>[]
}>

export function createValuesCardModel<Asset>(
  rankedValues: readonly RankedValue[],
  appearance: Heroes99Appearance,
  catalog: SeethingSwarmRuntimeClipCatalog<Asset>,
  localization: LocalizationCatalog = getLocaleCatalog(),
): ValuesCardModel<Asset> {
  const { hasComparisons, topFive } = projectHubValues(rankedValues)
  const formatters = createLocaleFormatters(localization.metadata.languageTag)
  return Object.freeze({
    title: hasComparisons
      ? localization.hub.rankedTitle
      : localization.hub.unrankedTitle,
    invitation: localization.card.invitation,
    copy: localization.card,
    hasComparisons,
    appearance: Object.freeze({ ...appearance }),
    values: Object.freeze(
      topFive.map(({ definition, progress, rank }, index) => {
        const presentation = resolveValueAnimalPresentation(definition, catalog)
        const level = getLevelFromXP(progress.totalXp)
        return Object.freeze({
          name: getValueDisplayName(definition, localization.values),
          level,
          levelLabel: localization.hub.level(level),
          rankLabel: localization.card.rank(formatters.integer(index + 1)),
          medal: hasComparisons
            ? (getValueRankPresentation(rank).medal?.color ?? null)
            : null,
          animal: presentation.kind === "animal" ? presentation.clip : null,
        })
      }),
    ),
  })
}

export function getValuesCardMedals<Asset>(model: ValuesCardModel<Asset>) {
  return [
    ...new Set(model.values.flatMap(({ medal }) => (medal ? [medal] : []))),
  ]
}

export type ValuesCardDelivery =
  "saved" | "download-started" | "handed-off" | "cancelled"
export function getValuesCardDeliveryMessage(
  outcome: ValuesCardDelivery | null,
  copy: LocalizationCatalog["card"] = VALUES_CARD_COPY,
) {
  switch (outcome) {
    case "saved":
      return copy.saved
    case "download-started":
      return copy.downloadStarted
    case "handed-off":
      return copy.handoff
    case "cancelled":
      return copy.cancelled
    default:
      return ""
  }
}
export type PreparedValuesCard = Readonly<{
  format: ValuesCardFormat
  previewUri: string
  stillPreviewUri: string
  byteLength: number
  canShare: boolean
  save: () => Promise<ValuesCardDelivery>
  share: () => Promise<ValuesCardDelivery>
  dispose: () => void
}>
export type ValuesCardPreparation = Readonly<{
  format: ValuesCardFormat
  includeHero: boolean
  includeLevels: boolean
  signal: AbortSignal
}>
export type PrepareValuesCard = (
  options: ValuesCardPreparation,
) => Promise<PreparedValuesCard>
