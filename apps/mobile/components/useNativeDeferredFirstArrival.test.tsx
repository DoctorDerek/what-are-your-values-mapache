import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { act, cleanup, renderHook } from "@testing-library/react-native"
import { AppState, type AppStateStatus } from "react-native"
import useNativeDeferredFirstArrival from "@/components/useNativeDeferredFirstArrival"

let idleCallback: IdleRequestCallback | undefined
let onAppStateChange: ((state: AppStateStatus) => void) | undefined
const cancelIdle = jest.fn()
const removeSubscription = jest.fn()

beforeEach(() => {
  jest.useFakeTimers()
  idleCallback = undefined
  onAppStateChange = undefined
  Object.defineProperty(global, "requestIdleCallback", {
    configurable: true,
    writable: true,
    value: jest.fn((callback: IdleRequestCallback) => {
      idleCallback = callback
      return 1
    }),
  })
  Object.defineProperty(global, "cancelIdleCallback", {
    configurable: true,
    writable: true,
    value: cancelIdle,
  })
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_event, listener) => {
      onAppStateChange = listener
      return { remove: removeSubscription }
    })
})
afterEach(async () => {
  await cleanup()
  jest.useRealTimers()
})

describe("native optional arrival scheduling", () => {
  it("defers until idle, then cancels on background without replaying", async () => {
    const { result } = await renderHook(() =>
      useNativeDeferredFirstArrival(true),
    )
    await act(async () => {
      jest.advanceTimersByTime(3999)
    })
    expect(idleCallback).toBeUndefined()
    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(result.current).toBe(false)
    await act(async () => {
      idleCallback?.({ didTimeout: false, timeRemaining: () => 20 })
    })
    expect(result.current).toBe(true)
    await act(async () => {
      onAppStateChange?.("active")
    })
    expect(result.current).toBe(true)
    await act(async () => {
      onAppStateChange?.("background")
    })
    expect(result.current).toBe(false)
    expect(cancelIdle).toHaveBeenCalledWith(1)
    await act(async () => {
      onAppStateChange?.("active")
      jest.advanceTimersByTime(10000)
    })
    expect(result.current).toBe(false)
  })

  it("does not load under reduced motion and cancels when Start leaves the scope", async () => {
    const { result, rerender, unmount } = await renderHook<
      boolean,
      { enabled: boolean }
    >(({ enabled }) => useNativeDeferredFirstArrival(enabled), {
      initialProps: { enabled: false },
    })
    await act(async () => {
      jest.advanceTimersByTime(10000)
    })
    expect(idleCallback).toBeUndefined()
    await rerender({ enabled: true })
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    await unmount()
    await act(async () => {
      jest.advanceTimersByTime(10000)
    })
    expect(idleCallback).toBeUndefined()
    expect(removeSubscription).toHaveBeenCalled()
    expect(result.current).toBe(false)
  })
})
