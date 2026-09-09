"use client"

import { introductionCopy } from "@game/data/src/IntroductionCopy"
import dynamic from "next/dynamic"
import PlayerDataLoading from "@/components/PlayerDataLoading"

const GameClient = dynamic(() => import("@/components/GameClient"), {
  ssr: false,
  loading: PlayerDataLoading,
})

export default function GameIsland() {
  return (
    <section
      id="game"
      aria-label={`Play ${introductionCopy.title}`}
      className="min-h-[100dvh]"
    >
      <GameClient />
    </section>
  )
}
