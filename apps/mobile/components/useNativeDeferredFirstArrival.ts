import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import { useEffect, useState } from "react"
import { AppState } from "react-native"

export default function useNativeDeferredFirstArrival(enabled: boolean) {
  const [isReady, setIsReady] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  useEffect(() => {
    if (!enabled || isCancelled) return
    let idle: ReturnType<typeof requestIdleCallback> | undefined
    const delay = setTimeout(() => {
      idle = requestIdleCallback(() => setIsReady(true), {
        timeout: FIRST_ARRIVAL_PRESENTATION.idleTimeoutMs,
      })
    }, FIRST_ARRIVAL_PRESENTATION.loadDelayMs)
    const cancel = () => {
      clearTimeout(delay)
      if (idle !== undefined) cancelIdleCallback(idle)
    }
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") return
      cancel()
      setIsCancelled(true)
    })
    return () => {
      cancel()
      subscription.remove()
    }
  }, [enabled, isCancelled])
  return enabled && isReady && !isCancelled
}
