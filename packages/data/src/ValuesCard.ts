import { getLevelFromXP } from "@game/utils/src/LevelMath"
import type { Heroes99Appearance } from "./Heroes99Appearance"
import { projectHubValues } from "./HubValueProjection"
import { PERSONAL_HUB_COPY } from "./PersonalHubCopy"
import { resolveValueAnimalPresentation } from "./SeethingSwarmAnimalPresentation"
import type {
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
} from "./SeethingSwarmRuntimeClipCatalog"
import { getValueDisplayName } from "./Value"
import type { RankedValue } from "./ValueRanking"

export const VALUES_CARD_SIZE = Object.freeze({ width: 1600, height: 900 })
export const VALUES_CARD_COLOR_VARIABLES = [
  "--color-player-card-frame",
  "--color-player-card-background",
  "--color-player-card-values",
  "--color-player-card-rank",
  "--color-player-card-ink",
  "--color-player-card-muted",
] as const

export type ValuesCardPalette = Readonly<{
  frame: string
  background: string
  values: string
  rank: string
  ink: string
  muted: string
}>

export function readValuesCardPalette(
  values: readonly unknown[],
): ValuesCardPalette {
  const [frame, background, plane, rank, ink, muted] = values
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
    !muted.trim()
  )
    throw new Error("The values-card colors are unavailable")
  return { frame, background, values: plane, rank, ink, muted }
}

export const VALUES_CARD_COPY = Object.freeze({
  title: "Share my values card",
  gif: "GIF · Animated",
  png: "PNG · Still",
  format: "Image format",
  includeHero: "Include my hero",
  back: "Back",
  preparing: "Preparing your card…",
  delivering: "Opening your file…",
  retry: "Retry",
  failure:
    "Your card could not be prepared. Your values and appearance are unchanged.",
  deliveryFailure: "Your file is still ready. Try again or save it instead.",
  unsupportedShare:
    "Save your card, then attach it wherever you want to share it.",
  downloadStarted: "Your file is ready in your device’s save or download flow.",
  handoff: "Your card was handed to your device’s sharing options.",
  saved: "Card saved.",
  cancelled: "Cancelled. Your card is still ready.",
  details: "Technical details",
  invitation: "Play free at WhatAreYourValuesMapache.com",
  preview: "Values card preview",
  save: (format: ValuesCardFormat) => `Save ${format.toUpperCase()}`,
  share: (format: ValuesCardFormat) => `Share ${format.toUpperCase()}`,
})

export type ValuesCardFormat = "gif" | "png"
export type ValuesCardModel<Asset> = Readonly<{
  title: string
  hasComparisons: boolean
  appearance: Heroes99Appearance
  values: readonly Readonly<{
    name: string
    level: number
    animal: SeethingSwarmRuntimeCharacterClip<Asset> | null
  }>[]
}>

export function createValuesCardModel<Asset>(
  rankedValues: readonly RankedValue[],
  appearance: Heroes99Appearance,
  catalog: SeethingSwarmRuntimeClipCatalog<Asset>,
): ValuesCardModel<Asset> {
  const { hasComparisons, topFive } = projectHubValues(rankedValues)
  return Object.freeze({
    title: hasComparisons
      ? PERSONAL_HUB_COPY.rankedTitle
      : PERSONAL_HUB_COPY.unrankedTitle,
    hasComparisons,
    appearance: Object.freeze({ ...appearance }),
    values: Object.freeze(
      topFive.map(({ definition, progress }) => {
        const presentation = resolveValueAnimalPresentation(definition, catalog)
        return Object.freeze({
          name: getValueDisplayName(definition),
          level: getLevelFromXP(progress.totalXp),
          animal: presentation.kind === "animal" ? presentation.clip : null,
        })
      }),
    ),
  })
}

export type ValuesCardDelivery =
  "saved" | "download-started" | "handed-off" | "cancelled"
export function getValuesCardDeliveryMessage(
  outcome: ValuesCardDelivery | null,
) {
  switch (outcome) {
    case "saved":
      return VALUES_CARD_COPY.saved
    case "download-started":
      return VALUES_CARD_COPY.downloadStarted
    case "handed-off":
      return VALUES_CARD_COPY.handoff
    case "cancelled":
      return VALUES_CARD_COPY.cancelled
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
  signal: AbortSignal
}>
export type PrepareValuesCard = (
  options: ValuesCardPreparation,
) => Promise<PreparedValuesCard>
