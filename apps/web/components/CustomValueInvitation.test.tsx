import { CUSTOM_VALUE_STARTER_EXAMPLES } from "@game/data/src/CustomValueStarterExamples"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import CustomValueInvitation from "@/components/CustomValueInvitation"

function setup(editorRequestId = 0) {
  const props = {
    editorRequestId,
    existingCustomValues: [],
    isSaving: false,
    saveIssue: null,
    onApply: vi.fn(),
    onExport: vi.fn(async () => {}),
    onNavigationBlockedChange: vi.fn(),
  }
  return { ...render(<CustomValueInvitation {...props} />), props }
}
function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }))
}
function fill(name: string, definition: string) {
  fireEvent.change(screen.getByLabelText("Value name"), {
    target: { value: name },
  })
  fireEvent.change(screen.getByLabelText("Definition"), {
    target: { value: definition },
  })
}
function selectExamples() {
  fireEvent.click(screen.getByText("Missing a value? Try an example"))
  click("Add all three")
}
describe("Hub custom-value invitation", () => {
  it("expands examples on request and saves pending entries with an empty editor", () => {
    const { props } = setup(1)
    expect(
      screen.getByText("Missing a value? Try an example").closest("details"),
    ).toHaveAttribute("open")
    fill("My direction", "to explore my own path")
    click("Add another")
    expect(screen.getByRole("heading", { name: "Values to add" })).toBeVisible()
    expect(screen.getByText("to explore my own path")).toBeVisible()
    expect(screen.getByLabelText("Value name")).toHaveValue("")
    click("Save")
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith([
      { name: "My direction", definition: "to explore my own path" },
    ])
  })
  it("never omits a partially entered value when saving a pending list", () => {
    const { props } = setup(1)
    fill("First direction", "to take one path")
    click("Add another")
    fill("Another direction", "")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    expect(props.onApply).not.toHaveBeenCalled()
    fill("Another direction", "to explore another path")
    click("Save")
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith([
      { name: "First direction", definition: "to take one path" },
      { name: "Another direction", definition: "to explore another path" },
    ])
  })
  it("prefills an individual example without saving it", () => {
    const { props } = setup()
    fireEvent.click(screen.getByText("Missing a value? Try an example"))
    click("Ingenuity — Mapachito’s example")
    expect(screen.getByLabelText("Definition")).toHaveValue(
      CUSTOM_VALUE_STARTER_EXAMPLES[0].definition,
    )
    expect(props.onApply).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Definition")).toBeVisible()
    expect(screen.getByText(/clears Undo and Redo/)).toBeVisible()
    click("Save")
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith([
      {
        name: "Ingenuity",
        definition: CUSTOM_VALUE_STARTER_EXAMPLES[0].definition,
      },
    ])
  })
  it("retains unfinished text when closed and reopened through a new request", () => {
    const { props, rerender } = setup(1)
    fill("My direction", "My own meaning.")
    click("Close editor")
    expect(props.onNavigationBlockedChange).toHaveBeenLastCalledWith(true)
    click("Continue editing")
    expect(screen.getByLabelText("Value name")).toHaveValue("My direction")
    expect(screen.getByLabelText("Definition")).toHaveValue("My own meaning.")
    click("Close editor")
    rerender(
      <CustomValueInvitation
        {...props}
        editorRequestId={2}
        initialName="Other"
      />,
    )
    expect(screen.getByLabelText("Value name")).toHaveValue("My direction")
    expect(screen.getByLabelText("Definition")).toHaveValue("My own meaning.")
  })
  it("starts a requested original value with the unmatched search name", () => {
    render(
      <CustomValueInvitation
        existingCustomValues={[]}
        isSaving={false}
        saveIssue={null}
        editorRequestId={1}
        initialName="Ingenuity"
        onApply={vi.fn()}
        onExport={vi.fn()}
        onNavigationBlockedChange={vi.fn()}
      />,
    )
    expect(screen.getByLabelText("Value name")).toHaveValue("Ingenuity")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
  })
  it("queues another value using one editor and preserves both definitions", () => {
    const { props } = setup(1)
    fill("One direction", "  to take one path  ")
    click("Add another")
    expect(screen.getAllByLabelText("Definition")).toHaveLength(1)
    expect(screen.getByLabelText("Value name")).toHaveValue("")
    fill("Another direction", "My punctuation stays.")
    click("Save")
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith([
      { name: "One direction", definition: "to take one path" },
      { name: "Another direction", definition: "My punctuation stays." },
    ])
  })
  it("avoids normalized example duplicates in an original pending value", () => {
    const { props } = setup(1)
    fill("ｉｎｇｅｎｕｉｔｙ", "My own meaning.")
    click("Add another")
    click("Close editor")
    selectExamples()
    expect(screen.getByRole("button", { name: /Ingenuity —/ })).toBeDisabled()
    click("Save")
    expect(props.onApply).toHaveBeenCalledWith([
      { name: "ｉｎｇｅｎｕｉｔｙ", definition: "My own meaning." },
      ...CUSTOM_VALUE_STARTER_EXAMPLES.slice(1).map(({ name, definition }) => ({
        name,
        definition,
      })),
    ])
  })
  it("keeps an emptied edit unfinished until explicitly discarded", () => {
    setup()
    selectExamples()
    click("Edit Pets")
    fill("", "")
    click("Close editor")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    click("Discard unfinished edit")
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
  })
  it("allows editing and removal before saving the batch", () => {
    const { props } = setup()
    selectExamples()
    click("Remove Destiny")
    click("Edit Pets")
    fill("Pets", "My companions.")
    click("Save")
    expect(props.onApply).toHaveBeenCalledWith([
      {
        name: "Ingenuity",
        definition: CUSTOM_VALUE_STARTER_EXAMPLES[0].definition,
      },
      { name: "Pets", definition: "My companions." },
    ])
  })
  it("preserves the review after export failure", async () => {
    const { props } = setup()
    props.onExport.mockRejectedValueOnce(new Error("Backup download failed"))
    selectExamples()
    click("Export Data")
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Backup download failed",
    )
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Edit Pets" })).toBeVisible()
    expect(props.onApply).not.toHaveBeenCalled()
  })
  it("retains an edited pending value when adding another before saving", () => {
    const { props } = setup()
    selectExamples()
    click("Edit Pets")
    fill("Companions", "to care for my companions")
    click("Add another")
    expect(screen.getByText("to care for my companions")).toBeVisible()
    expect(screen.getByLabelText("Value name")).toHaveValue("")
    fill("Exploration", "to discover new possibilities")
    click("Save")
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith([
      {
        name: "Ingenuity",
        definition: CUSTOM_VALUE_STARTER_EXAMPLES[0].definition,
      },
      {
        name: "Destiny",
        definition: CUSTOM_VALUE_STARTER_EXAMPLES[1].definition,
      },
      { name: "Companions", definition: "to care for my companions" },
      { name: "Exploration", definition: "to discover new possibilities" },
    ])
  })
  it("locks all mutations while saving and retains review for retry", () => {
    const { props, rerender } = setup()
    selectExamples()
    rerender(<CustomValueInvitation {...props} isSaving />)
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Discard pending values" }),
    ).toBeDisabled()
    rerender(<CustomValueInvitation {...props} saveIssue="Storage is full" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Storage is full")
    click("Save")
    expect(props.onApply).toHaveBeenCalledOnce()
  })
  it("rejects canonical and pending duplicates without erasing the input", () => {
    setup()
    selectExamples()
    click("Add another")
    for (const name of ["ＦＵＮ", " ingenuity "]) {
      fill(name, "My meaning.")
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
      expect(screen.getByLabelText("Value name")).toHaveValue(name)
    }
  })
  it("retains invalid overlong and controlled inputs without saving", () => {
    const { props } = setup(1)
    for (const name of ["x".repeat(61), "Bad\u0001name"]) {
      fill(name, "My meaning.")
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
      expect(screen.getByLabelText("Value name")).toHaveValue(name)
    }
    fill("Original name", "x".repeat(281))
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    fireEvent.submit(screen.getByRole("form", { name: "Add Custom Value" }))
    expect(props.onApply).not.toHaveBeenCalled()
  })
  it("counts graphemes and discards pending additions without a write", () => {
    const { props } = setup(1)
    fill("👨‍👩‍👧‍👦", "Family on my terms.")
    expect(screen.getByText("1 / 60 characters")).toBeVisible()
    click("Add another")
    click("Discard pending values")
    expect(props.onNavigationBlockedChange).toHaveBeenLastCalledWith(false)
    expect(props.onApply).not.toHaveBeenCalled()
  })
})
