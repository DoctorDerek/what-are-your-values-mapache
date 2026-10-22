import { act, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import CustomValueInvitation from "@/components/CustomValueInvitation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import WebControlsProvider, {
  useWebControllerActions,
  useWebControls,
} from "@/components/WebControlsProvider"
import { activateWebControllerMenu } from "@/lib/WebControllerFocus"

function createController(id = "Xbox Wireless Controller", index = 0) {
  const buttons: GamepadButton[] = Array.from({ length: 17 }, () => ({
    pressed: false,
    touched: false,
    value: 0,
  }))
  return {
    id,
    index,
    mapping: "standard",
    connected: true,
    timestamp: 0,
    axes: [0, 0],
    buttons,
    vibrationActuator: {
      playEffect: async () => "complete",
      reset: async () => "complete",
    },
  } satisfies Gamepad
}

function Harness({ onChoose = vi.fn() }: { onChoose?: () => void }) {
  const { controller, inputModality, hasUnsupportedController } =
    useWebControls()
  const [open, setOpen] = useState(false)
  useWebControllerActions(0, (command) => {
    if (command === "menu") setOpen(true)
    else if (command === "select-first-value") onChoose()
    return true
  })
  return (
    <>
      <main data-slot="mapache-screen">
        <output>
          {controller?.family ?? inputModality}
          {hasUnsupportedController && " unsupported"}
        </output>
        <button onClick={() => setOpen(true)}>Menu</button>
        <div role="region" aria-label="Values" tabIndex={0}>
          <li tabIndex={0}>Decorative animal</li>
        </div>
        <button disabled>Unavailable</button>
        <button onClick={onChoose}>Choose value</button>
        <button
          role="radio"
          aria-checked={false}
          tabIndex={-1}
          onClick={onChoose}
        >
          Speed 2×
        </button>
      </main>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Menu</DialogTitle>
          <button onClick={() => setOpen(false)}>Resume</button>
          <button>Controls</button>
        </DialogContent>
      </Dialog>
    </>
  )
}

describe("scoped controller input", () => {
  let controllers: (Gamepad | null)[]
  let controller: ReturnType<typeof createController>
  let frames: Map<number, FrameRequestCallback>
  let clock: number
  let nextFrame: number

  function tick(elapsed = 16) {
    act(() => {
      clock += elapsed
      const callbacks = [...frames.values()]
      frames.clear()
      callbacks.forEach((callback) => callback(clock))
    })
  }

  function button(index: number, pressed: boolean) {
    controller.buttons[index] = {
      pressed,
      touched: pressed,
      value: pressed ? 1 : 0,
    }
    tick()
  }

  beforeEach(() => {
    controller = createController()
    controllers = [controller]
    frames = new Map()
    clock = performance.now()
    nextFrame = 0
    vi.stubGlobal("navigator", {
      getGamepads: vi.fn(() => controllers),
      maxTouchPoints: 0,
    })
    vi.spyOn(document, "hasFocus").mockReturnValue(true)
    vi.spyOn(document, "hidden", "get").mockReturnValue(false)
    Object.defineProperty(Element.prototype, "checkVisibility", {
      configurable: true,
      value: () => true,
    })
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      const id = ++nextFrame
      frames.set(id, callback)
      return id
    })
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id))
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    Reflect.deleteProperty(Element.prototype, "checkVisibility")
  })

  it("does not activate on connection or drift, and emits once for a held choice", () => {
    const choose = vi.fn()
    render(
      <WebControlsProvider>
        <Harness onChoose={choose} />
      </WebControlsProvider>,
    )
    controller.axes[0] = 0.2
    tick()
    expect(screen.getByRole("status")).toHaveTextContent("keyboard")
    button(4, true)
    tick(5000)
    expect(choose).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent("xbox")
    button(4, false)
    button(4, true)
    expect(choose).toHaveBeenCalledTimes(2)
    fireEvent.pointerDown(window, { pointerType: "touch" })
    expect(screen.getByRole("status")).toHaveTextContent("touch-pointer")
    tick()
    expect(screen.getByRole("status")).toHaveTextContent("touch-pointer")
  })

  it("scopes focus and cancellation to a dialog and swallows battle commands", () => {
    const choose = vi.fn()
    render(
      <WebControlsProvider>
        <Harness onChoose={choose} />
      </WebControlsProvider>,
    )
    button(9, true)
    expect(screen.getByRole("dialog")).toBeVisible()
    button(9, false)
    button(4, true)
    expect(choose).not.toHaveBeenCalled()
    button(4, false)
    button(15, true)
    expect(screen.getByRole("button", { name: "Controls" })).toHaveFocus()
    button(15, false)
    button(1, true)
    expect(screen.queryByRole("dialog")).toBeNull()
    tick(5000)
    expect(choose).not.toHaveBeenCalled()
  })

  it("navigates real controls without traversing decorative rows and supports roving controls", () => {
    const choose = vi.fn()
    render(
      <WebControlsProvider>
        <Harness onChoose={choose} />
      </WebControlsProvider>,
    )
    screen.getByRole("button", { name: "Menu" }).focus()
    button(15, true)
    const region = screen.getByRole("region", { name: "Values" })
    expect(region).toHaveFocus()
    button(15, false)
    const scroll = vi.spyOn(region, "scrollBy")
    button(13, true)
    expect(scroll).toHaveBeenCalled()
    button(13, false)
    button(15, true)
    expect(screen.getByRole("button", { name: "Choose value" })).toHaveFocus()
    button(15, false)
    button(15, true)
    expect(screen.getByRole("radio", { name: "Speed 2×" })).toHaveFocus()
    button(15, false)
    button(0, true)
    expect(choose).toHaveBeenCalledTimes(1)
  })

  it("suspends polling and baselines held inputs on resume and unmount", () => {
    const choose = vi.fn()
    const { unmount } = render(
      <WebControlsProvider>
        <Harness onChoose={choose} />
      </WebControlsProvider>,
    )
    button(4, true)
    fireEvent(window, new Event("blur"))
    expect(frames.size).toBe(0)
    fireEvent(window, new Event("focus"))
    tick(5000)
    expect(choose).toHaveBeenCalledTimes(1)
    button(4, false)
    button(4, true)
    expect(choose).toHaveBeenCalledTimes(2)
    unmount()
    expect(frames.size).toBe(0)
  })

  it("requires a fresh direction before repeating after connection or resume", () => {
    controller.buttons[15] = { pressed: true, touched: true, value: 1 }
    render(
      <WebControlsProvider>
        <Harness />
      </WebControlsProvider>,
    )
    const menu = screen.getByRole("button", { name: "Menu" })
    menu.focus()
    tick(1000)
    expect(menu).toHaveFocus()
    button(15, false)
    button(15, true)
    expect(screen.getByRole("region", { name: "Values" })).toHaveFocus()
    tick(500)
    expect(screen.getByRole("button", { name: "Choose value" })).toHaveFocus()
    fireEvent(window, new Event("blur"))
    fireEvent(window, new Event("focus"))
    tick(1000)
    expect(screen.getByRole("button", { name: "Choose value" })).toHaveFocus()
    button(15, false)
    button(15, true)
    expect(screen.getByRole("radio", { name: "Speed 2×" })).toHaveFocus()
  })

  it("reconciles a disconnected controller after the window was unfocused", () => {
    render(
      <WebControlsProvider>
        <Harness />
      </WebControlsProvider>,
    )
    button(4, true)
    expect(screen.getByRole("status")).toHaveTextContent("xbox")
    fireEvent(window, new Event("blur"))
    controllers = []
    fireEvent(window, new Event("focus"))
    expect(screen.getByRole("status")).toHaveTextContent("keyboard")
    expect(frames.size).toBe(0)
  })

  it("retries controller access on focus after a browser access failure", () => {
    const getGamepads = vi.spyOn(navigator, "getGamepads")
    getGamepads.mockImplementationOnce(() => {
      throw new DOMException("Temporarily unavailable", "SecurityError")
    })
    const choose = vi.fn()
    render(
      <WebControlsProvider>
        <Harness onChoose={choose} />
      </WebControlsProvider>,
    )
    expect(frames.size).toBe(0)
    fireEvent(window, new Event("focus"))
    button(4, true)
    expect(choose).toHaveBeenCalledOnce()
  })

  it("reaches disclosure controls and scrolls the page from the value-list region", () => {
    const scroll = vi.spyOn(window, "scrollBy")
    render(
      <WebControlsProvider>
        <main data-slot="mapache-screen">
          <div
            role="region"
            aria-label="Values"
            tabIndex={0}
            data-controller-scroll="document"
          />
          <details>
            <summary tabIndex={0}>Technical details</summary>
            <p>Error explanation</p>
          </details>
          <div role="dialog" hidden>
            <button>Hidden action</button>
          </div>
        </main>
      </WebControlsProvider>,
    )
    button(15, true)
    expect(screen.getByRole("region", { name: "Values" })).toHaveFocus()
    button(15, false)
    button(13, true)
    expect(scroll).toHaveBeenCalledWith({ top: 96, behavior: "instant" })
    button(13, false)
    button(15, true)
    expect(screen.getByText("Technical details")).toHaveFocus()
    button(15, false)
    button(0, true)
    expect(
      screen.getByText("Error explanation").closest("details"),
    ).toHaveAttribute("open")
  })

  it("retains a controller-dismissed custom draft and prevents cancellation during save", () => {
    const apply = vi.fn()
    const props = {
      editorRequestId: 1,
      deckRevision: 0,
      existingCustomValues: [],
      isSaving: false,
      saveIssue: null,
      onApply: apply,
      onExport: vi.fn(async () => {}),
      onExit: vi.fn(),
      onNavigationBlockedChange: vi.fn(),
    }
    const view = (isSaving = false) => (
      <WebControlsProvider>
        <main data-slot="mapache-screen">
          <button id="hub-add-custom-value-button">Add value</button>
          <CustomValueInvitation {...props} isSaving={isSaving} />
        </main>
      </WebControlsProvider>
    )
    const { rerender } = render(view())
    fireEvent.change(screen.getByLabelText("Value name"), {
      target: { value: "Craftsmanship" },
    })
    fireEvent.change(screen.getByLabelText("Definition"), {
      target: { value: "To make things well." },
    })
    button(1, true)
    expect(screen.getByRole("dialog")).toBeVisible()
    expect(screen.getByRole("button", { name: "Save and return" })).toBeEnabled()
    expect(apply).not.toHaveBeenCalled()
    button(1, false)
    button(1, true)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Value name")).toHaveValue("Craftsmanship")
    expect(screen.getByLabelText("Definition")).toHaveValue(
      "To make things well.",
    )
    button(1, false)
    rerender(view(true))
    button(8, true)
    expect(screen.getByLabelText("Value name")).toBeDisabled()
    expect(screen.getByRole("status")).toHaveTextContent("Saving")
    expect(apply).not.toHaveBeenCalled()
  })

  it("switches family by the most recently used device and restores non-controller hints after disconnect", () => {
    const second = createController("DualSense", 1)
    controllers.push(second)
    render(
      <WebControlsProvider>
        <Harness />
      </WebControlsProvider>,
    )
    button(4, true)
    expect(screen.getByRole("status")).toHaveTextContent("xbox")
    second.buttons[4] = { pressed: true, touched: true, value: 1 }
    tick()
    expect(screen.getByRole("status")).toHaveTextContent("playstation")
    controllers[1] = null
    tick()
    expect(screen.getByRole("status")).toHaveTextContent("keyboard")
  })

  it("does not poll or execute unknown mappings and handles unavailable browser access", () => {
    controllers = [{ ...controller, mapping: "" }]
    const { unmount } = render(
      <WebControlsProvider>
        <Harness />
      </WebControlsProvider>,
    )
    expect(screen.getByRole("status")).toHaveTextContent("unsupported")
    expect(frames.size).toBe(0)
    unmount()
    vi.spyOn(navigator, "getGamepads").mockImplementation(() => {
      throw new DOMException("Policy disabled", "SecurityError")
    })
    render(
      <WebControlsProvider>
        <Harness />
      </WebControlsProvider>,
    )
    expect(screen.getByRole("button", { name: "Choose value" })).toBeEnabled()
    expect(frames.size).toBe(0)
  })

  it("opens Menu only through an available control and keeps alert confirmations scoped", () => {
    const openMenu = vi.fn()
    const confirm = vi.fn()
    const { rerender } = render(
      <WebControlsProvider>
        <main data-slot="mapache-screen">
          <button disabled onClick={openMenu}>
            Menu
          </button>
        </main>
      </WebControlsProvider>,
    )
    act(activateWebControllerMenu)
    expect(openMenu).not.toHaveBeenCalled()
    rerender(
      <WebControlsProvider>
        <main data-slot="mapache-screen">
          <button onClick={openMenu}>Menu</button>
          <div role="alertdialog" aria-label="Confirm change">
            <button onClick={confirm}>Cancel</button>
          </div>
        </main>
      </WebControlsProvider>,
    )
    act(activateWebControllerMenu)
    expect(openMenu).not.toHaveBeenCalled()
    button(15, true)
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus()
    button(15, false)
    button(0, true)
    expect(confirm).toHaveBeenCalledTimes(1)
    rerender(
      <WebControlsProvider>
        <main data-slot="mapache-screen">
          <button onClick={openMenu}>Menu</button>
        </main>
      </WebControlsProvider>,
    )
    act(activateWebControllerMenu)
    expect(openMenu).toHaveBeenCalledTimes(1)
  })
})
