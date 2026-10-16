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
        <h2 className="min-w-0 flex-1 text-2xl font-black [overflow-wrap:anywhere] uppercase sm:text-3xl">
          {achievement.title}
        </h2>
        <span className="shrink-0 border-4 border-black bg-black px-3 py-1 font-black text-white uppercase">
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
  canOpenMenu,
  onClose,
  onOpenMenu,
}: {
  readonly achievements: readonly AchievementPresentation[]
  readonly canOpenMenu: boolean
  readonly onClose: () => void
  readonly onOpenMenu: () => void
}) {
  const localizedCopy = useLocaleCatalog()
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu

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
    <MapacheScreen spacing="standard" viewport="scrollable">
      <header className="mx-auto flex w-full max-w-5xl flex-col items-stretch gap-5 xl:flex-row xl:items-center xl:justify-between">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-mapache-vivid-primary-cyan text-4xl font-black [overflow-wrap:anywhere] uppercase drop-shadow-[5px_5px_0px_#000000] outline-none sm:text-6xl"
        >
          {localizedCopy.interfaceCopy.screen.achievements}
        </h1>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!canOpenMenu}
            onClick={onOpenMenu}
            wrap
            className="flex-1"
          >
            {PRODUCT_MENU_COPY.openAction}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={!canOpenMenu}
            onClick={onClose}
            wrap
            className="flex-1"
          >
            {localizedCopy.interfaceCopy.screen.backToValues}
          </Button>
        </div>
      </header>

      <section
        aria-labelledby="achievement-catalog-heading"
        className="mx-auto mt-8 w-full max-w-5xl border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000000] sm:p-8"
      >
        <h2
          id="achievement-catalog-heading"
          className="text-mapache-vivid-dark text-3xl font-black uppercase sm:text-4xl"
        >
          {localizedCopy.interfaceCopy.screen.localMilestones}
        </h2>
        <p className="text-mapache-vivid-dark mt-3 text-lg font-bold sm:text-xl">
          {localizedCopy.interfaceCopy.screen.achievementPrivacy}
        </p>
        <p className="bg-mapache-vivid-secondary-green text-mapache-vivid-dark mt-5 border-4 border-black p-4 text-xl font-black uppercase">
          {localizedCopy.interfaceCopy.screen.achievementsUnlocked(
            integer(unlockedCount),
            integer(achievements.length),
          )}
        </p>
        <ol className="mt-6 flex min-w-0 flex-col gap-5 pr-1 pb-2">
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </ol>
      </section>
    </MapacheScreen>
  )
}
