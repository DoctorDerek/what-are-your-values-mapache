import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import { Progress } from "@/components/ui/progress"

export default function ValueLevelProgress({
  totalXp,
  compact = false,
}: {
  totalXp: number
  compact?: boolean
}) {
  const localizedCopy = useLocaleCatalog()

  const { level, earnedXpTowardNextLevel, requiredXpForNextLevel } =
    getLevelProgressFromXP(totalXp)
  return (
    <div
      aria-label={localizedCopy.interfaceCopy.screen.levelProgress(
        String(level),
        String(earnedXpTowardNextLevel),
        String(requiredXpForNextLevel),
        String(level + 1),
      )}
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
        <span className={compact ? "text-sm" : "text-xl"}>
          {localizedCopy.interfaceCopy.screen.valueLevel(String(level))}
        </span>
        <span className={compact ? "text-xs" : "text-base"}>
          {localizedCopy.interfaceCopy.screen.xpFraction(
            String(earnedXpTowardNextLevel),
            String(requiredXpForNextLevel),
          )}
        </span>
      </div>
      <Progress
        aria-label={localizedCopy.interfaceCopy.screen.xpTowardLevel(
          String(level + 1),
        )}
        value={earnedXpTowardNextLevel}
        max={requiredXpForNextLevel}
        className={
          compact
            ? "mt-1 h-1.5 border border-black bg-white"
            : "mt-2 h-3 border-2 border-black bg-white"
        }
        indicatorClassName="bg-mapache-vivid-primary-raspberry transition-transform"
      />
    </div>
  )
}
