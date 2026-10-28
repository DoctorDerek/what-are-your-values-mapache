import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import usePresentationElapsedTime from "@game/utils/src/usePresentationElapsedTime"

describe("visit-scoped presentation elapsed time", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("continues an unfinished visit across unmount, finishes exactly and starts a fresh visit independently", () => {
    const openedAt = new Date().toISOString()
    const options = { openedAt, durationMs: 8_000, tickMs: 50, isComplete: false }
    const first = renderHook(() => usePresentationElapsedTime(options))
    act(() => vi.advanceTimersByTime(900))
    expect(first.result.current.elapsedMs).toBe(900)
    first.unmount()
    expect(vi.getTimerCount()).toBe(0)
    act(() => vi.advanceTimersByTime(500))
    const resumed = renderHook(() => usePresentationElapsedTime(options))
    expect(resumed.result.current).toEqual({ elapsedMs: 1400, previousElapsedMs: 1400 })
    act(() => vi.advanceTimersByTime(8_000))
    expect(resumed.result.current.elapsedMs).toBe(8_000)
    expect(vi.getTimerCount()).toBe(0)
    resumed.unmount()
    const fresh = renderHook(() => usePresentationElapsedTime({ ...options, openedAt: new Date().toISOString() }))
    expect(fresh.result.current.elapsedMs).toBe(0)
    fresh.unmount()
  })

  it("uses the final frame without a timer for an already completed or reduced-motion visit", () => {
    const { result, unmount } = renderHook(() => usePresentationElapsedTime({
      openedAt: new Date().toISOString(), durationMs: 3_700, tickMs: 50, isComplete: true,
    }))
    expect(result.current).toEqual({ elapsedMs: 3700, previousElapsedMs: 3700 })
    expect(vi.getTimerCount()).toBe(0)
    unmount()
  })
})
