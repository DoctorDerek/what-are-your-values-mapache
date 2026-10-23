"use client"

import { createLocaleFormatters } from "@game/data/src/LocaleFormatters"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { AchievementPresentation } from "@game/machines/src/AchievementPresentation"
import { useEffect, useMemo, useRef } from "react"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"

function AchievementCard({
  achievement,
}: {
  readonly achievement: AchievementPresentation
}) {
  const localizedCopy = useLocaleCatalog()

  const isUnlocked = achievement.status === "unlocked"

  return (
    <li
      className={
        isUnlocked
          ? "bg-mapache-vivid-secondary-gold text-mapache-vivid-black min-w-0 border-4 border-black p-4 shadow-[5px_5px_0px_0px_#000000] sm:p-5"
          : "text-mapache-vivid-dark min-w-0 border-4 border-black bg-white p-4 shadow-[5px_5px_0px_0px_#000000] sm:p-5"
      }
    >
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <h2 className="min-w-0 flex-[1_1_190px] text-2xl font-black [overflow-wrap:anywhere] hyphens-auto uppercase sm:text-3xl">
          {achievement.title}
        </h2>
        <span className="max-w-full shrink-0 border-4 border-black bg-black px-2 py-1 text-sm font-black [overflow-wrap:anywhere] text-white uppercase">
          {isUnlocked
            ? localizedCopy.interfaceCopy.screen.unlocked
            : localizedCopy.interfaceCopy.screen.locked}
        </span>
      </div>
      <p className="mt-3 text-lg font-bold [overflow-wrap:anywhere]">
        {achievement.requirement}
      </p>
      {achievement.progress ? (
        <div className="mt-4 border-t-4 border-black pt-3">
          <p className="font-black [overflow-wrap:anywhere]">
            {achievement.progress.label}
          </p>
          {achievement.progress.kind === "numeric" ? (
            <progress
              aria-hidden="true"
              className="mt-3 h-4 w-full accent-black"
              max={achievement.progress.target}
              value={achievement.progress.current}
            />
          ) : null}
        </div>
      ) : null}
      {achievement.unlockedAt && achievement.unlockedDate ? (
        <p className="mt-4 border-t-4 border-black pt-3 font-black">
          <time dateTime={achievement.unlockedAt}>
            {localizedCopy.interfaceCopy.screen.unlockedOn(
              achievement.unlockedDate,
            )}
          </time>
        </p>
      ) : null}
    </li>
  )
}

export default function Achievements({
  achievements,
  canClose,
  onClose,
}: {
  readonly achievements: readonly AchievementPresentation[]
  readonly canClose: boolean
  readonly onClose: () => void
}) {
  const localizedCopy = useLocaleCatalog()

  const headingRef = useRef<HTMLHeadingElement>(null)
  const { integer } = useMemo(
    () => createLocaleFormatters(localizedCopy.metadata.languageTag),
    [localizedCopy.metadata.languageTag],
  )
  const unlockedCount = achievements.filter(
    ({ status }) => status === "unlocked",
  ).length

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <MapacheScreen
      spacing="readable-xl"
      viewport="fixed"
      className="flex flex-col"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        <div
          data-controller-scroll
          tabIndex={0}
          className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain pr-[8px] pb-[8px]"
        >
          <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 pb-[12px]">
            <h1
              ref={headingRef}
              tabIndex={-1}
              id="achievements-heading"
              className="text-mapache-vivid-primary-cyan min-w-0 text-xl leading-tight font-black [overflow-wrap:anywhere] hyphens-auto drop-shadow-[3px_3px_0px_#000000] outline-none"
            >
              {localizedCopy.interfaceCopy.screen.achievements}
            </h1>
            <p className="bg-mapache-vivid-secondary-green text-mapache-vivid-dark max-w-full border-4 border-black px-[10px] py-[6px] text-base leading-tight font-black [overflow-wrap:anywhere]">
              {localizedCopy.interfaceCopy.screen.achievementsUnlocked(
                integer(unlockedCount),
                integer(achievements.length),
              )}
            </p>
          </header>

          <section
            aria-labelledby="achievements-heading"
            className="w-full min-w-0 border-4 border-black bg-white p-[12px] shadow-[5px_5px_0px_0px_#000000] xl:p-5"
          >
            <p className="text-mapache-vivid-dark text-base leading-snug font-bold [overflow-wrap:anywhere] hyphens-auto">
              {localizedCopy.interfaceCopy.screen.achievementPrivacy}
            </p>
            <ol className="mt-[14px] flex min-w-0 flex-col gap-[16px] pr-[5px] pb-[5px]">
              {achievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
            </ol>
          </section>
        </div>
        <footer className="flex max-h-[35%] shrink-0 justify-end overflow-auto pt-[12px] pr-[8px] pb-[8px]">
          <Button
            type="button"
            variant="secondary"
            disabled={!canClose}
            onClick={onClose}
            wrap
            className="w-full min-w-0 xl:w-50"
          >
            {localizedCopy.interfaceCopy.controlActions.back}
          </Button>
        </footer>
      </div>
    </MapacheScreen>
  )
}
