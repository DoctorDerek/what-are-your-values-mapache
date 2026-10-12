import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import useDeferredFirstArrival from "@/components/useDeferredFirstArrival"

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete")
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible")
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("optional arrival scheduling", () => {
  it("waits for document load, the delay, and idle work", () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading")
    let idle: IdleRequestCallback | undefined
    const scheduleIdle = vi.fn((callback: IdleRequestCallback) => {
      idle = callback
      return 12
    })
    vi.stubGlobal("requestIdleCallback", scheduleIdle)
    vi.stubGlobal("cancelIdleCallback", vi.fn())
    const { result } = renderHook(() => useDeferredFirstArrival(true))
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current).toBe(false)
    act(() => window.dispatchEvent(new Event("load")))
    act(() => vi.advanceTimersByTime(3999))
    expect(scheduleIdle).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(false)
    act(() => idle?.({ didTimeout: false, timeRemaining: () => 30 }))
    expect(result.current).toBe(true)
  })

  it("uses a frame fallback and cancels pending loading on Start", () => {
    vi.stubGlobal("requestIdleCallback", undefined)
    const { result, rerender } = renderHook(
      ({ enabled }) => useDeferredFirstArrival(enabled),
      { initialProps: { enabled: true } },
    )
    act(() => vi.advanceTimersByTime(4000))
    expect(result.current).toBe(false)
    rerender({ enabled: false })
    act(() => vi.advanceTimersByTime(1000))
    expect(result.current).toBe(false)
  })

  it("does not schedule under reduced motion or replay after backgrounding", () => {
    const visibility = vi.spyOn(document, "visibilityState", "get")
    const { result, rerender } = renderHook(
      ({ enabled }) => useDeferredFirstArrival(enabled),
      { initialProps: { enabled: false } },
    )
    act(() => vi.advanceTimersByTime(10000))
    expect(result.current).toBe(false)
    rerender({ enabled: true })
    visibility.mockReturnValue("hidden")
    act(() => document.dispatchEvent(new Event("visibilitychange")))
    visibility.mockReturnValue("visible")
    act(() => document.dispatchEvent(new Event("visibilitychange")))
    act(() => vi.advanceTimersByTime(10000))
    expect(result.current).toBe(false)
  })
})
