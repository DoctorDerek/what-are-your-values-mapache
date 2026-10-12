import { beforeEach, describe, expect, it, jest } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react-native"
import NativeMapachitoIceCream from "@/components/NativeMapachitoIceCream"

const mockPlay = jest.fn<() => Promise<void>>()
let mockReady: boolean | null = true
let mockError: Error | undefined
let mockFile: object | undefined = {}

jest.mock("@game/data/assets/mapachito/ice-cream.riv", () => 1)
jest.mock("@rive-app/react-native", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native")
  return {
    Alignment: { Center: "center" },
    Fit: { Cover: "cover" },
    RiveView: ({ onError }: { onError: () => void }) => (
      <View testID="rive-surface" onTouchCancel={onError} />
    ),
    useRiveFile: () => ({ riveFile: mockFile, error: mockError }),
    useRive: () => ({
      riveViewRef:
        mockReady === null ? null : mockReady ? { play: mockPlay } : undefined,
      setHybridRef: undefined,
    }),
  }
})

beforeEach(() => {
  mockReady = true
  mockError = undefined
  mockFile = {}
  mockPlay.mockResolvedValue(undefined)
})

describe("native Rive boundary", () => {
  it("starts the crossing only after playback starts and reports runtime failure", async () => {
    const onStarted = jest.fn()
    const onUnavailable = jest.fn()
    await render(
      <NativeMapachitoIceCream
        onStarted={onStarted}
        onUnavailable={onUnavailable}
      />,
    )
    expect(mockPlay).toHaveBeenCalledTimes(1)
    expect(onStarted).toHaveBeenCalledTimes(1)
    await fireEvent(screen.getByTestId("rive-surface"), "touchCancel")
    expect(onUnavailable).toHaveBeenCalledTimes(1)
  })

  it("leaves unavailable and not-yet-ready assets to the static fallback", async () => {
    const onStarted = jest.fn()
    const onUnavailable = jest.fn()
    mockReady = false
    mockFile = undefined
    const { rerender } = await render(
      <NativeMapachitoIceCream
        onStarted={onStarted}
        onUnavailable={onUnavailable}
      />,
    )
    expect(screen.queryByTestId("rive-surface")).toBeNull()
    expect(onUnavailable).not.toHaveBeenCalled()
    mockError = new Error("Asset unavailable")
    await rerender(
      <NativeMapachitoIceCream
        onStarted={onStarted}
        onUnavailable={onUnavailable}
      />,
    )
    expect(onUnavailable).toHaveBeenCalledTimes(1)
    expect(onStarted).not.toHaveBeenCalled()
  })

  it("contains rejected playback and never starts a crossing after unmount", async () => {
    const onStarted = jest.fn()
    const onUnavailable = jest.fn()
    mockPlay.mockRejectedValue(new Error("Runtime unavailable"))
    const { unmount } = await render(
      <NativeMapachitoIceCream
        onStarted={onStarted}
        onUnavailable={onUnavailable}
      />,
    )
    expect(onUnavailable).toHaveBeenCalledTimes(1)
    await unmount()
    let finish: (() => void) | undefined
    mockPlay.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
    )
    const pending = await render(
      <NativeMapachitoIceCream
        onStarted={onStarted}
        onUnavailable={onUnavailable}
      />,
    )
    await pending.unmount()
    finish?.()
    await Promise.resolve()
    expect(onStarted).not.toHaveBeenCalled()
  })
})
