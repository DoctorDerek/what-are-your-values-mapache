import { useEffect, useState } from "react"

export default function usePresentationElapsedTime({
  openedAt,
  durationMs,
  tickMs,
  isComplete,
}: {
  openedAt: string | null
  durationMs: number
  tickMs: number
  isComplete: boolean
}): Readonly<{ elapsedMs: number; previousElapsedMs: number }> {
  const [startedAt] = useState(() =>
    openedAt === null ? Date.now() : Date.parse(openedAt),
  )
  const [time, setTime] = useState(() => {
    const elapsedMs = isComplete
      ? durationMs
      : Math.min(durationMs, Math.max(0, Date.now() - startedAt))
    return { elapsedMs, previousElapsedMs: elapsedMs }
  })
  const hasFinished = isComplete || time.elapsedMs >= durationMs

  useEffect(() => {
    if (hasFinished) return
    const timer = setInterval(() => {
      setTime(({ elapsedMs }) => ({
        elapsedMs: Math.min(
          durationMs,
          Math.max(elapsedMs, Date.now() - startedAt),
        ),
        previousElapsedMs: elapsedMs,
      }))
    }, tickMs)
    return () => clearInterval(timer)
  }, [durationMs, hasFinished, startedAt, tickMs])

  return isComplete
    ? { elapsedMs: durationMs, previousElapsedMs: durationMs }
    : time
}
