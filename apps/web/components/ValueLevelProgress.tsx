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
      className="text-mapache-vivid-primary-raspberry order-2 grid min-w-0 basis-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-[3px] border-4 border-black bg-white px-[8px] pt-[4px] pb-[8px] font-black uppercase @min-[18rem]/value:ms-auto @min-[18rem]/value:max-w-36 @min-[18rem]/value:flex-1 @min-[18rem]/value:grid-cols-1 @min-[18rem]/value:gap-2 @min-[18rem]/value:px-2.5 @min-[18rem]/value:py-2 xl:max-w-44"
    >
      <span className="col-span-full text-left text-xl @min-[18rem]/value:text-right">
        {localizedCopy.interfaceCopy.screen.valueLevel(String(level))}
      </span>
      <Progress
        aria-label={localizedCopy.interfaceCopy.screen.xpTowardLevel(
          String(level + 1),
        )}
        value={earnedXpTowardNextLevel}
        max={requiredXpForNextLevel}
        className="h-[14px] border-2 border-black bg-white @min-[18rem]/value:h-3"
        indicatorClassName="bg-mapache-vivid-primary-raspberry transition-transform"
      />
      <span className="min-w-0 text-right text-base [overflow-wrap:anywhere] @min-[18rem]/value:text-left">
        {localizedCopy.interfaceCopy.screen.xpFraction(
          String(earnedXpTowardNextLevel),
          String(requiredXpForNextLevel),
        )}
      </span>
    </div>
  )
}
