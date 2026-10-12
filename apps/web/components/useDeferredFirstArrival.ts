import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import { useEffect, useState } from "react"

export default function useDeferredFirstArrival(enabled: boolean) {
  const [isReady, setIsReady] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

  useEffect(() => {
    if (!enabled || isCancelled) return
    let delay: number | undefined
    let idle: number | undefined
    let frame: number | undefined
    const cancel = () => {
      window.clearTimeout(delay)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      window.removeEventListener("load", schedule)
    }
    const schedule = () => {
      delay = window.setTimeout(() => {
        if (typeof window.requestIdleCallback === "function") {
          idle = window.requestIdleCallback(() => setIsReady(true), {
            timeout: FIRST_ARRIVAL_PRESENTATION.idleTimeoutMs,
          })
        } else {
          frame = window.requestAnimationFrame(() => setIsReady(true))
        }
      }, FIRST_ARRIVAL_PRESENTATION.loadDelayMs)
    }
    const handleVisibility = () => {
      if (document.visibilityState !== "hidden") return
      cancel()
      setIsCancelled(true)
    }
    if (document.visibilityState === "hidden") handleVisibility()
    else if (document.readyState === "complete") schedule()
    else window.addEventListener("load", schedule, { once: true })
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      cancel()
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [enabled, isCancelled])

  return enabled && isReady && !isCancelled
}
