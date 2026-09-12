import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import { Progress } from "@/components/ui/progress"

export default function ValueLevelProgress({
  totalXp,
  compact = false,
}: {
  totalXp: number
  compact?: boolean
}) {
  const { level, earnedXpTowardNextLevel, requiredXpForNextLevel } =
    getLevelProgressFromXP(totalXp)
  return (
    <div
      aria-label={`Level ${level}: ${earnedXpTowardNextLevel} of ${requiredXpForNextLevel} XP toward Level ${level + 1}`}
      className={
        compact
          ? "text-mapache-vivid-primary-raspberry min-w-0 font-bold"
          : "text-mapache-vivid-primary-raspberry w-full min-w-0 basis-full border-4 border-black bg-white px-3 py-2 font-black uppercase xl:w-auto xl:min-w-44 xl:basis-auto"
      }
    >
      <div
        className={
          compact
            ? "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
            : "flex items-baseline justify-between gap-3"
        }
      >
        <span className={compact ? "text-sm" : "text-xl"}>Level {level}</span>
        <span className={compact ? "text-xs" : "text-base"}>
          {earnedXpTowardNextLevel}/{requiredXpForNextLevel} XP
        </span>
      </div>
      <Progress
        aria-label={`XP toward Level ${level + 1}`}
        value={earnedXpTowardNextLevel}
        max={requiredXpForNextLevel}
        className={
          compact
            ? "mt-1 h-1.5 overflow-hidden border border-black bg-white"
            : "mt-2 h-3 overflow-hidden border-2 border-black bg-white"
        }
        indicatorClassName="bg-mapache-vivid-primary-raspberry"
      />
    </div>
  )
}
