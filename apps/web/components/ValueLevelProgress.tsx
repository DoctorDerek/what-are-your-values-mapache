import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { getLevelProgressFromXP } from "@game/utils/src/LevelMath"
import { Progress } from "@/components/ui/progress"

export default function ValueLevelProgress({ totalXp }: { totalXp: number }) {
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
      className="text-mapache-vivid-primary-raspberry grid w-36 max-w-full min-w-0 shrink-0 gap-2 border-4 border-black bg-white px-3 py-2 font-black uppercase xl:w-44"
    >
      <span className="text-right text-xl">
        {localizedCopy.interfaceCopy.screen.valueLevel(String(level))}
      </span>
      <Progress
        aria-label={localizedCopy.interfaceCopy.screen.xpTowardLevel(
          String(level + 1),
        )}
        value={earnedXpTowardNextLevel}
        max={requiredXpForNextLevel}
        className="h-3 border-2 border-black bg-white"
        indicatorClassName="bg-mapache-vivid-primary-raspberry transition-transform"
      />
      <span className="text-left text-base">
        {localizedCopy.interfaceCopy.screen.xpFraction(
          String(earnedXpTowardNextLevel),
          String(requiredXpForNextLevel),
        )}
      </span>
    </div>
  )
}
