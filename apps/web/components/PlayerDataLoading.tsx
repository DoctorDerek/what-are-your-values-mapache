"use client"

import { introductionCopy } from "@game/data/src/IntroductionCopy"
import { STARTUP_INDICATOR_DELAY_MS } from "@game/data/src/PresentationLoadingCopy"
import { playerDataRecoveryCopy } from "@game/machines/src/PlayerDataRecoveryCopy"
import { useEffect, useState } from "react"
import MapacheScreen from "@/components/MapacheScreen"

export default function PlayerDataLoading() {
  const [showIndicator, setShowIndicator] = useState(false)
  useEffect(() => {
    const delay = setTimeout(() => setShowIndicator(true), STARTUP_INDICATOR_DELAY_MS)
    return () => clearTimeout(delay)
  }, [])
  return (
    <MapacheScreen
      aria-label={playerDataRecoveryCopy.loading}
      aria-busy="true"
      spacing="standard-xl"
      viewport="scrollable"
      className="flex flex-col items-center justify-center gap-6 text-center"
    >
      <div aria-hidden="true" className={`flex gap-2 ${showIndicator ? "visible" : "invisible"}`}>
        <span className="bg-mapache-vivid-primary-cyan size-6 border-2 border-black" />
        <span className="bg-mapache-vivid-primary-orange size-6 border-2 border-black" />
        <span className="bg-mapache-vivid-primary-raspberry size-6 border-2 border-black" />
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {playerDataRecoveryCopy.loading}
      </p>
      <noscript className="text-mapache-vivid-white max-w-2xl">
        <h1 className="mb-4 text-3xl font-black [overflow-wrap:anywhere] uppercase">
          {introductionCopy.title}
        </h1>
        <p className="mb-4 text-lg font-bold">{introductionCopy.tagline}</p>
        <p className="text-mapache-vivid-white text-lg font-bold">
          The interactive game requires JavaScript.
        </p>
        <a
          href="#introduction"
          className="bg-mapache-vivid-primary-cyan text-mapache-vivid-white mt-4 inline-block border-4 border-black p-4 text-lg font-black shadow-[6px_6px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Read the Introduction
        </a>
      </noscript>
    </MapacheScreen>
  )
}
