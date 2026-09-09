import { playerDataRecoveryCopy } from "@game/machines/src/PlayerDataRecoveryCopy"
import MapacheScreen from "@/components/MapacheScreen"

export default function PlayerDataLoading() {
  return (
    <MapacheScreen
      aria-label={playerDataRecoveryCopy.loading}
      aria-busy="true"
      spacing="standard-xl"
      viewport="scrollable"
      className="flex flex-col items-center justify-center gap-6 text-center"
    >
      <div aria-hidden="true" className="flex gap-2">
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
      <noscript>
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
