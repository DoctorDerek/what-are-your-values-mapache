import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import type { LocalizationCatalog } from "@game/data/src/LocalizationCatalog"
import { getLevelFromXP } from "@game/utils/src/LevelMath"
import {
  ACHIEVEMENT_CATALOG,
  type AchievementDefinition,
  type AchievementId,
} from "./AchievementCatalog"
import {
  getPendingAchievementUnlocks,
  type AchievementState,
} from "./AchievementState"
import type { BattleProfile } from "./BattleProfile"

export type AchievementCopy = Readonly<{
  title: string
  unlockReason: string
  requirement: string
}>

export type AchievementProgressPresentation =
  | Readonly<{
      kind: "numeric"
      current: number
      target: number
      label: string
    }>
  | Readonly<{
      kind: "eligibility"
      label: string
    }>

export type AchievementPresentation = Readonly<{
  id: AchievementId
  title: string
  unlockReason: string
  requirement: string
  status: "locked" | "unlocked"
  progress: AchievementProgressPresentation | null
  unlockedAt: string | null
  unlockedDate: string | null
}>

export function getPendingAchievementPresentations({
  achievementState,
  achievementPresentations,
}: {
  readonly achievementState: AchievementState
  readonly achievementPresentations: readonly AchievementPresentation[]
}) {
  return getPendingAchievementUnlocks(achievementState).map(({ id }) => {
    const presentation = achievementPresentations.find(
      (achievement) => achievement.id === id,
    )
    if (!presentation)
      throw new Error("Pending achievement presentation is unavailable")
    return presentation
  })
}

export function getAchievementCopy(
  achievement: AchievementDefinition,
  localization: LocalizationCatalog = getLocaleCatalog(),
  integer = createLocaleFormatters(localization.metadata.languageTag).integer,
): AchievementCopy {
  const { condition } = achievement
  const copy = localization.interfaceCopy.progression
  if (condition.kind === "battleCount") {
    const formattedThreshold = integer(condition.threshold)

    return Object.freeze({
      title:
        condition.threshold === 1
          ? copy.firstBattleTitle
          : copy.battleTitle(formattedThreshold),
      unlockReason:
        condition.threshold === 1
          ? copy.firstBattleReason
          : copy.battleReason(formattedThreshold),
      requirement:
        condition.threshold === 1
          ? copy.firstBattleRequirement
          : copy.battleRequirement(formattedThreshold),
    })
  }
  if (condition.kind === "topFive") {
    return Object.freeze({
      title: copy.topFiveTitle,
      unlockReason: copy.topFiveReason,
      requirement: copy.topFiveRequirement,
    })
  }

  const formattedThreshold = integer(condition.threshold)

  return Object.freeze({
    title: copy.levelTitle(formattedThreshold),
    unlockReason: copy.levelReason(formattedThreshold),
    requirement: copy.levelRequirement(formattedThreshold),
  })
}

export function formatAchievementUnlockedDate(
  timestamp: string,
  localization: LocalizationCatalog = getLocaleCatalog(),
) {
  return createLocaleFormatters(localization.metadata.languageTag).date(
    timestamp,
  )
}

function createNumericProgress({
  current,
  target,
  label,
}: {
  readonly current: number
  readonly target: number
  readonly label: string
}): AchievementProgressPresentation {
  return Object.freeze({ kind: "numeric", current, target, label })
}

function getValueLevelProgress({
  threshold,
  achievementState,
  battleProfile,
  localization,
  integer,
}: {
  readonly threshold: number
  readonly achievementState: AchievementState
  readonly battleProfile: BattleProfile
  readonly localization: LocalizationCatalog
  readonly integer: (value: number | bigint) => string
}): AchievementProgressPresentation {
  const copy = localization.interfaceCopy.progression
  const eligibleLevels = battleProfile.activeDeck.valueIds.flatMap(
    (valueId) => {
      const baselineLevel =
        achievementState.progress.baselineLevelsByValue.get(valueId)
      const valueProgress = battleProfile.progressById.get(valueId)
      if (baselineLevel === undefined || !valueProgress)
        throw new Error(
          `Achievement progress is unavailable for active value: ${valueId}`,
        )

      const currentLevel = getLevelFromXP(valueProgress.totalXp)
      return baselineLevel < threshold && currentLevel < threshold
        ? [currentLevel]
        : []
    },
  )
  if (eligibleLevels.length === 0) {
    return Object.freeze({
      kind: "eligibility",
      label: copy.noEligibleValue(integer(threshold)),
    })
  }

  const current = Math.max(...eligibleLevels)
  const formattedCurrent = integer(current)
  const formattedTarget = integer(threshold)

  return createNumericProgress({
    current,
    target: threshold,
    label: copy.eligibleValue(formattedCurrent, formattedTarget),
  })
}

function getLockedAchievementProgress({
  achievement,
  achievementState,
  battleProfile,
  localization,
  integer,
}: {
  readonly achievement: AchievementDefinition
  readonly achievementState: AchievementState
  readonly battleProfile: BattleProfile
  readonly localization: LocalizationCatalog
  readonly integer: (value: number | bigint) => string
}): AchievementProgressPresentation {
  const { condition } = achievement
  const copy = localization.interfaceCopy.progression
  if (condition.kind === "battleCount") {
    const current = Math.min(
      achievementState.progress.lifetimeBattleCount,
      condition.threshold,
    )

    return createNumericProgress({
      current,
      target: condition.threshold,
      label: copy.comparisonProgress(
        integer(current),
        integer(condition.threshold),
      ),
    })
  }
  if (condition.kind === "topFive") {
    const valuesWithExperience = Array.from(
      battleProfile.progressById.values(),
    ).filter(({ totalXp }) => totalXp > 0).length
    if (
      achievementState.progress.topFiveAlreadyRevealedAtReset ||
      valuesWithExperience >= 5
    ) {
      return Object.freeze({
        kind: "eligibility",
        label: copy.resetTopFive,
      })
    }

    return createNumericProgress({
      current: valuesWithExperience,
      target: 5,
      label: copy.topFiveProgress(integer(valuesWithExperience)),
    })
  }

  return getValueLevelProgress({
    threshold: condition.threshold,
    achievementState,
    battleProfile,
    localization,
    integer,
  })
}

export function projectAchievementCatalog({
  achievementState,
  battleProfile,
  localization = getLocaleCatalog(),
}: {
  readonly achievementState: AchievementState
  readonly battleProfile: BattleProfile
  readonly localization?: LocalizationCatalog
}) {
  const unlockById = new Map(
    achievementState.unlocks.map((unlock) => [unlock.id, unlock]),
  )
  const { integer, date } = createLocaleFormatters(
    localization.metadata.languageTag,
  )

  return Object.freeze(
    ACHIEVEMENT_CATALOG.map((achievement) => {
      const copy = getAchievementCopy(achievement, localization, integer)
      const unlock = unlockById.get(achievement.id)

      return Object.freeze({
        id: achievement.id,
        ...copy,
        status: unlock ? "unlocked" : "locked",
        progress: unlock
          ? null
          : getLockedAchievementProgress({
              achievement,
              achievementState,
              battleProfile,
              localization,
              integer,
            }),
        unlockedAt: unlock?.unlockedAt ?? null,
        unlockedDate: unlock ? date(unlock.unlockedAt) : null,
      }) satisfies AchievementPresentation
    }),
  )
}
