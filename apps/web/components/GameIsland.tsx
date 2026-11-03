"use client"

import type { SupportedLocale } from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import LocaleProvider from "@game/utils/src/LocaleContext"
import dynamic from "next/dynamic"
import { RestoringIntroduction } from "@/components/Splash"

const GameClient = dynamic(() => import("@/components/GameClient"), {
  ssr: false,
  loading: RestoringIntroduction,
})

export default function GameIsland({
  routeLocale,
}: {
  readonly routeLocale?: SupportedLocale
}) {
  const localization = getLocaleCatalog(routeLocale)
  return (
    <section
      id="game"
      aria-label={localization.interfaceCopy.screen.playGame(
        localization.introduction.title,
      )}
      className="peer min-h-[100dvh]"
    >
      <LocaleProvider locale={routeLocale}>
        <GameClient routeLocale={routeLocale} />
      </LocaleProvider>
    </section>
  )
}
