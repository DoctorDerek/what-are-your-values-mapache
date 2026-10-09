import {
  CUSTOM_VALUE_INVITATION_COPY as copy,
  CUSTOM_VALUE_AUTHORING_EXAMPLE as example,
} from "@game/data/src/CustomValueInvitationCopy"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import CustomValueInvitation from "@/components/CustomValueInvitation"

function setup(editorRequestId = 1) {
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
const pendingDrafts = [
  { name: "First direction", definition: "My first path." },
  { name: "Second direction", definition: "My second path." },
  { name: "Third direction", definition: "My third path." },
]
function queueDrafts() {
  for (const draft of pendingDrafts) {
    fill(draft.name, draft.definition)
    click("Add another")
  }
  click("Close editor")
}
describe("Hub custom-value invitation", () => {
  it("keeps the untouched Home free of a second authoring entry point", () => {
    const { props, rerender } = setup(0)
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument()
    expect(screen.queryByText(copy.example)).not.toBeInTheDocument()
    rerender(<CustomValueInvitation {...props} editorRequestId={1} />)
    expect(screen.getByLabelText("Value name")).toHaveFocus()
    expect(screen.getByRole("complementary")).toBeVisible()
    expect(screen.getByText(copy.example)).toBeVisible()
    click("Close editor")
    expect(screen.queryByText(copy.example)).not.toBeInTheDocument()
    expect(props.onApply).not.toHaveBeenCalled()
  })
  it("saves pending player-authored entries with an empty editor", () => {
    const { props } = setup(1)
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
  it("shows one informational example without filling or saving a draft", () => {
    const { props } = setup()
    expect(screen.getByLabelText("Value name")).toHaveValue("")
    expect(screen.getByLabelText("Definition")).toHaveValue("")
    expect(
      screen.getByText(
        "For example: Craftsmanship — to take care and pride in making things well",
      ),
    ).toBeVisible()
    expect(screen.getByLabelText("Value name")).toHaveAccessibleDescription(
      expect.stringContaining(copy.example),
    )
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    expect(
      screen.queryByRole("button", { name: "Add all three" }),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/clears Undo and Redo/)).toBeVisible()
    fill(example.name, example.definition)
    expect(props.onApply).not.toHaveBeenCalled()
    click("Save")
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith([
      {
        name: "Craftsmanship",
        definition: "to take care and pride in making things well",
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
        initialName="Craftsmanship"
        onApply={vi.fn()}
        onExport={vi.fn()}
        onNavigationBlockedChange={vi.fn()}
      />,
    )
    expect(screen.getByLabelText("Value name")).toHaveValue("Craftsmanship")
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
  it("rejects normalized names of the new built-ins without saving", () => {
    const { props } = setup(1)
    for (const name of ["ｉｎｇｅｎｕｉｔｙ", " DESTINY ", "pets"]) {
      fill(name, "My own meaning.")
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
      expect(screen.getByLabelText("Value name")).toHaveValue(name)
    }
    expect(props.onApply).not.toHaveBeenCalled()
  })
  it("keeps an emptied edit unfinished until explicitly discarded", () => {
    setup()
    queueDrafts()
    click("Edit Third direction")
    fill("", "")
    click("Close editor")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    click("Discard unfinished edit")
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
  })
  it("allows editing and removal before saving the batch", () => {
    const { props } = setup()
    queueDrafts()
    click("Remove Second direction")
    click("Edit Third direction")
    fill("Third direction", "My companions.")
    click("Save")
    expect(props.onApply).toHaveBeenCalledWith([
      pendingDrafts[0],
      { name: "Third direction", definition: "My companions." },
    ])
  })
  it("preserves the review after export failure", async () => {
    const { props } = setup()
    props.onExport.mockRejectedValueOnce(new Error("Backup download failed"))
    queueDrafts()
    click("Export Data")
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Backup download failed",
    )
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
    expect(
      screen.getByRole("button", { name: "Edit Third direction" }),
    ).toBeVisible()
    expect(props.onApply).not.toHaveBeenCalled()
  })
  it("retains an edited pending value when adding another before saving", () => {
    const { props } = setup()
    queueDrafts()
    click("Edit Third direction")
    fill("Companions", "to care for my companions")
    click("Add another")
    expect(screen.getByText("to care for my companions")).toBeVisible()
    expect(screen.getByLabelText("Value name")).toHaveValue("")
    fill("Exploration", "to discover new possibilities")
    click("Save")
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith([
      pendingDrafts[0],
      pendingDrafts[1],
      { name: "Companions", definition: "to care for my companions" },
      { name: "Exploration", definition: "to discover new possibilities" },
    ])
  })
  it("locks all mutations while saving and retains review for retry", () => {
    const { props, rerender } = setup()
    queueDrafts()
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
    queueDrafts()
    click("Add another")
    for (const name of ["ＦＵＮ", " first direction ", " ingenuity "]) {
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
