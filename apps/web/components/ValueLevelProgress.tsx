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
      className="text-mapache-vivid-primary-raspberry ms-auto mb-(--value-gap) flex max-w-36 min-w-[min(100%,7rem)] flex-wrap items-center gap-x-[12px] gap-y-1 border-4 border-black bg-white px-[8px] py-[8px] font-black uppercase xl:m-0 xl:max-w-44 xl:basis-44"
    >
      <span className="min-w-0 basis-full text-xl">
        <span className="block w-fit max-w-full min-w-[min(100%,120px)] text-right">
          {localizedCopy.interfaceCopy.screen.valueLevel(String(level))}
        </span>
      </span>
      <Progress
        aria-label={localizedCopy.interfaceCopy.screen.xpTowardLevel(
          String(level + 1),
        )}
        value={earnedXpTowardNextLevel}
        max={requiredXpForNextLevel}
        className="h-[clamp(12px,0.75rem,14px)] min-w-0 flex-[1_1_96px] border-2 border-black bg-white"
        indicatorClassName="bg-mapache-vivid-primary-raspberry transition-transform"
      />
      <span className="max-w-full min-w-0 text-base [overflow-wrap:anywhere]">
        {localizedCopy.interfaceCopy.screen.xpFraction(
          String(earnedXpTowardNextLevel),
          String(requiredXpForNextLevel),
        )}
      </span>
    </div>
  )
}
