import {
  FIRST_ARRIVAL_PRESENTATION,
  resolveFirstArrivalRaccoon,
} from "@game/data/src/FirstArrivalPresentation"
import { SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS } from "@game/data/src/SeethingSwarmAnimalPresentation"
import { cx } from "classix"
import { useCallback, useState, type CSSProperties } from "react"
import SeethingSwarmAnimal from "@/components/SeethingSwarmAnimal"
import { SEETHING_SWARM_WEB_RUNTIME_CLIP_CATALOG } from "@/generated/seethingswarm/SeethingSwarmRuntimeClipCatalog"

const raccoon = resolveFirstArrivalRaccoon(
  SEETHING_SWARM_WEB_RUNTIME_CLIP_CATALOG,
)

export default function FirstArrivalRaccoon({
  onComplete,
}: Readonly<{ onComplete: () => void }>) {
  const [isReady, setIsReady] = useState(false)
  const handleReady = useCallback(() => setIsReady(true), [])
  if (!raccoon) return null
  const style: CSSProperties & {
    "--arrival-runner-width": string
    "--arrival-runner-delay": string
    "--arrival-runner-duration": string
    "--arrival-runner-wide-duration": string
  } = {
    "--arrival-runner-width": `${raccoon.geometry.width}px`,
    "--arrival-runner-delay": `${FIRST_ARRIVAL_PRESENTATION.raccoonDelayMs}ms`,
    "--arrival-runner-duration": `${FIRST_ARRIVAL_PRESENTATION.raccoonTravelMs}ms`,
    "--arrival-runner-wide-duration": `${FIRST_ARRIVAL_PRESENTATION.raccoonWideTravelMs}ms`,
  }
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-3 overflow-hidden"
      style={style}
    >
      <div
        data-testid="arrival-raccoon"
        className={cx(
          "animate-arrival-raccoon w-fit",
          !isReady && "[animation-play-state:paused]",
        )}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget) onComplete()
        }}
      >
        <SeethingSwarmAnimal
          clip={raccoon.clip}
          geometry={raccoon.geometry}
          frameDurationMs={SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS}
          shouldReduceMotion={false}
          onReady={handleReady}
          onLoadError={onComplete}
        />
      </div>
    </div>
  )
}
