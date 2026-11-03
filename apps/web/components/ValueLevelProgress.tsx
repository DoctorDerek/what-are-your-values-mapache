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
      className="text-mapache-vivid-primary-raspberry ms-auto mb-2 flex w-36 max-w-full flex-wrap items-center gap-x-3 gap-y-1 border-4 border-black bg-white p-2 font-black uppercase [--xp-column:25cqi] xl:m-0 xl:w-44 xl:shrink-0 xl:[--xp-column:10cqi]"
    >
      <span className="min-w-0 basis-full text-xl">
        <span className="block w-fit max-w-full min-w-[min(100%,calc(var(--xp-column)*1.5))] text-right">
          {localizedCopy.interfaceCopy.screen.valueLevel(String(level))}
        </span>
      </span>
      <Progress
        aria-label={localizedCopy.interfaceCopy.screen.xpTowardLevel(
          String(level + 1),
        )}
        value={earnedXpTowardNextLevel}
        max={requiredXpForNextLevel}
        className="h-3 min-w-0 grow basis-[min(--spacing(24),var(--xp-column))] border-2 border-black bg-white"
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
