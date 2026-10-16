"use client"

import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import dynamic from "next/dynamic"
import PlayerDataLoading from "@/components/PlayerDataLoading"

const GameClient = dynamic(() => import("@/components/GameClient"), {
  ssr: false,
  loading: PlayerDataLoading,
})

export default function GameIsland() {
  const localization = getLocaleCatalog()
  return (
    <section
      id="game"
      aria-label={localization.interfaceCopy.screen.playGame(
        localization.introduction.title,
      )}
      className="peer min-h-[100dvh]"
    >
      <GameClient />
    </section>
  )
}
