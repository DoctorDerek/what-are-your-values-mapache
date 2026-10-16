import type { ActiveDeck } from "@game/data/src/ActiveDeck"
import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import {
  getLocaleCatalog,
  type LocalizationCatalog,
} from "@game/data/src/LocalizationCatalog"
import type { ValueId } from "@game/data/src/Value"
import type { ValueProgressById } from "@game/data/src/ValueProgress"
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import {
  getCompletedBattleXpChange,
  type PendingBattleAccessibilityAction,
} from "./BattleAccessibilityPresentation"

export type BattleRewardPresentation = Readonly<{
  valueId: ValueId
  label: string
  progressLabel: string
  progressPercentage: number
}>

export function getBattleRewardPresentation({
  pendingAction,
  activeDeck,
  progressById,
  localization = getLocaleCatalog(),
}: {
  readonly pendingAction: PendingBattleAccessibilityAction | null
  readonly activeDeck: ActiveDeck
  readonly progressById: ValueProgressById
  readonly localization?: LocalizationCatalog
}): BattleRewardPresentation | null {
  if (pendingAction?.kind !== "selection") return null
  const change = getCompletedBattleXpChange({
    pendingAction,
    activeDeck,
    progressById,
  })
  if (!change) return null
  const progress = progressById.get(change.valueId)
  if (!progress)
    throw new Error("Committed battle reward is missing value progress")
  const { level, earnedXpTowardNextLevel, requiredXpForNextLevel } =
    getLevelProgressFromXP(progress.totalXp)
  const copy = localization.interfaceCopy.progression
  const { integer } = createLocaleFormatters(localization.metadata.languageTag)
  return Object.freeze({
    valueId: change.valueId,
    label: copy.reward(integer(change.xpChange), integer(level)),
    progressLabel: copy.levelProgress(
      integer(earnedXpTowardNextLevel),
      integer(requiredXpForNextLevel),
      integer(level + 1),
    ),
    progressPercentage:
      (earnedXpTowardNextLevel / requiredXpForNextLevel) * 100,
  })
}
