import { act, fireEvent, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import useWebSemanticBack from "@/lib/useWebSemanticBack"

function NavigationHarness({
  hasParent,
  onBack,
}: {
  hasParent: boolean
  onBack: () => boolean
}) {
  useWebSemanticBack({ hasParent, onBack })
  return null
}

afterEach(() => vi.restoreAllMocks())

describe("Web semantic Back", () => {
  it("adds one parent boundary, re-arms after Back and removes it on returning to root", () => {
    const onBack = vi.fn(() => true)
    vi.spyOn(window.history, "state", "get").mockReturnValue({
      nextState: "preserved",
    })
    const pushState = vi
      .spyOn(window.history, "pushState")
      .mockImplementation(() => undefined)
    const back = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => undefined)
    const { rerender, unmount } = render(
      <NavigationHarness hasParent={false} onBack={onBack} />,
    )
    expect(pushState).not.toHaveBeenCalled()
    rerender(<NavigationHarness hasParent onBack={onBack} />)
    expect(pushState).toHaveBeenCalledWith(
      { nextState: "preserved", wayvmSemanticBackBoundary: true },
      "",
    )
    act(() => window.dispatchEvent(new PopStateEvent("popstate")))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(pushState).toHaveBeenCalledTimes(2)
    rerender(<NavigationHarness hasParent={false} onBack={onBack} />)
    expect(back).toHaveBeenCalledTimes(1)
    act(() => window.dispatchEvent(new PopStateEvent("popstate")))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(pushState).toHaveBeenCalledTimes(2)
    unmount()
    act(() => window.dispatchEvent(new PopStateEvent("popstate")))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it("handles Escape only when a semantic parent consumes it", () => {
    const onBack = vi.fn(() => true)
    const { rerender } = render(
      <NavigationHarness hasParent={false} onBack={onBack} />,
    )
    const handled = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    })
    fireEvent(window, handled)
    expect(handled.defaultPrevented).toBe(true)
    onBack.mockReturnValue(false)
    rerender(<NavigationHarness hasParent={false} onBack={onBack} />)
    const departed = new KeyboardEvent("keydown", {
      key: "Escape",
      cancelable: true,
    })
    fireEvent(window, departed)
    expect(departed.defaultPrevented).toBe(false)
  })
})
