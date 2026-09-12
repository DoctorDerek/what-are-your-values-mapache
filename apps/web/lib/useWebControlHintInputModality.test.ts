import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import useWebControlHintInputModality from "@/lib/useWebControlHintInputModality"

describe("useWebControlHintInputModality", () => {
  afterEach(() => vi.restoreAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it("starts from the touch-safe fallback without browser capabilities", () => {
    vi.stubGlobal("navigator", undefined)
    const { result } = renderHook(() => useWebControlHintInputModality())

    expect(result.current).toBe("touch-pointer")
  })

  it("starts from actual touch capability and changes only after intentional input", () => {
    vi.spyOn(navigator, "maxTouchPoints", "get").mockReturnValue(1)
    const { result, unmount } = renderHook(() =>
      useWebControlHintInputModality(),
    )

    expect(result.current).toBe("touch-pointer")
    act(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift" })),
    )
    act(() => window.dispatchEvent(new MouseEvent("mousemove")))
    expect(result.current).toBe("touch-pointer")

    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" })))
    expect(result.current).toBe("keyboard")
    act(() =>
      window.dispatchEvent(
        new PointerEvent("pointerdown", { pointerType: "mouse" }),
      ),
    )
    expect(result.current).toBe("keyboard")
    act(() => window.dispatchEvent(new PointerEvent("pointerdown")))
    expect(result.current).toBe("keyboard")
    act(() =>
      window.dispatchEvent(
        new PointerEvent("pointerdown", { pointerType: "touch" }),
      ),
    )
    expect(result.current).toBe("touch-pointer")

    act(() =>
      window.dispatchEvent(
        new PointerEvent("pointerdown", { pointerType: "mouse" }),
      ),
    )
    expect(result.current).toBe("keyboard")
    act(() =>
      window.dispatchEvent(
        new PointerEvent("pointerdown", { pointerType: "pen" }),
      ),
    )
    expect(result.current).toBe("touch-pointer")

    unmount()
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" })))
    expect(result.current).toBe("touch-pointer")
  })

  it("starts keyboard-capable devices with keyboard hints", () => {
    vi.spyOn(navigator, "maxTouchPoints", "get").mockReturnValue(0)
    const { result } = renderHook(() => useWebControlHintInputModality())

    expect(result.current).toBe("keyboard")
  })
})
