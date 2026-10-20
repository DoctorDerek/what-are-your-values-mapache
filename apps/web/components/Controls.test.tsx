import { fireEvent, render, screen, within } from "@testing-library/react"
import { useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import Controls from "@/components/Controls"
import { useWebControls } from "@/components/WebControlsProvider"

vi.mock("@/components/WebControlsProvider", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/components/WebControlsProvider")
  >()),
  useWebControls: vi.fn(),
}))

const readControls = vi.mocked(useWebControls)
beforeEach(() => {
  readControls.mockReturnValue({
    controller: null,
    inputModality: "keyboard",
    hasUnsupportedController: false,
    registerControllerHandler: null,
  })
})

function ControlsHarness() {
  const [open, setOpen] = useState(true)

  return <Controls open={open} onOpenChange={setOpen} />
}

function getReferenceHeadings() {
  return within(screen.getByTestId("information-panel-body")).getAllByRole(
    "heading",
  )
}

describe("Controls Component Integration", () => {
  it("puts keyboard inputs beside actions immediately without a duplicate explanation section", () => {
    render(<ControlsHarness />)

    const dialog = screen.getByRole("dialog", { name: "Controls" })
    expect(
      within(dialog).queryByRole("heading", { name: "Actions" }),
    ).toBeNull()
    expect(getReferenceHeadings()[0]).toHaveTextContent("Keyboard")
    const keyboardHeading = within(dialog).getByRole("heading", {
      level: 2,
      name: "Keyboard",
    })
    const keyboardSection = keyboardHeading.closest("section")
    if (!keyboardSection) throw new Error("Keyboard section is unavailable")
    expect(within(keyboardSection).getByText("1 or A")).toBeVisible()
    const firstInput = within(keyboardSection).getByText("1 or A").closest("dt")
    expect(firstInput?.nextElementSibling).toHaveTextContent(
      "Select First Value",
    )
    expect(within(keyboardSection).getByText("2 or D")).toBeVisible()
    expect(
      within(keyboardSection).getByText("Y, Ctrl+Y, or Cmd+Shift+Z"),
    ).toBeVisible()

    expect(
      within(dialog).getByRole("heading", {
        level: 2,
        name: "Touch & Pointer",
      }),
    ).toBeVisible()
    expect(
      within(dialog).queryByRole("heading", { name: "Controller" }),
    ).toBeNull()
    expect(
      within(keyboardSection).getByText(
        /If your progress changed, review your results/,
      ),
    ).toBeVisible()
    expect(within(dialog).queryByText(/remap/i)).toBeNull()
  })

  it("keeps the opening input group stable while reading and resolves it again on reopening", () => {
    readControls.mockReturnValue({
      ...readControls(),
      inputModality: "touch-pointer",
    })
    const onOpenChange = vi.fn()
    const view = render(<Controls open onOpenChange={onOpenChange} />)
    expect(getReferenceHeadings()[0]).toHaveTextContent("Touch & Pointer")
    readControls.mockReturnValue({
      ...readControls(),
      inputModality: "keyboard",
    })
    view.rerender(<Controls open onOpenChange={onOpenChange} />)
    expect(getReferenceHeadings()[0]).toHaveTextContent("Touch & Pointer")
    view.rerender(<Controls open={false} onOpenChange={onOpenChange} />)
    view.rerender(<Controls open onOpenChange={onOpenChange} />)
    expect(getReferenceHeadings()[0]).toHaveTextContent("Keyboard")
  })

  it("leads with active Steam Deck mappings and retains contextual controller instructions", () => {
    readControls.mockReturnValue({
      ...readControls(),
      controller: { index: 0, family: "steam-deck" },
    })
    render(<ControlsHarness />)
    expect(getReferenceHeadings()[0]).toHaveTextContent("Controller")
    expect(screen.getByText("L1 / L2")).toBeVisible()
    expect(
      screen.getByText("East face button in battle; Cancel elsewhere"),
    ).toBeVisible()
    expect(screen.getByText(/Steam \+ X/)).toBeVisible()
  })

  it("dismisses through either visible Close action or Escape", () => {
    const { rerender } = render(<ControlsHarness />)

    const closeActions = screen.getAllByRole("button", { name: "Close" })
    expect(closeActions).toHaveLength(2)
    fireEvent.click(closeActions[0])
    expect(screen.queryByRole("dialog", { name: "Controls" })).toBeNull()

    rerender(<ControlsHarness key="footer-close" />)
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[1])
    expect(screen.queryByRole("dialog", { name: "Controls" })).toBeNull()

    rerender(<ControlsHarness key="escape-close" />)
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog", { name: "Controls" })).toBeNull()
  })
})
