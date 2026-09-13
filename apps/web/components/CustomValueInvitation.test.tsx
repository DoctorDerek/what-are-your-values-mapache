import { CUSTOM_VALUE_STARTER_EXAMPLES } from "@game/data/src/CustomValueStarterExamples"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import CustomValueInvitation from "@/components/CustomValueInvitation"

function setup() {
  const props = {
    existingCustomValues: [],
    isSaving: false,
    saveIssue: null,
    onApply: vi.fn(),
    onExport: vi.fn(async () => {}),
    onNavigationBlockedChange: vi.fn(),
  }
  return { ...render(<CustomValueInvitation {...props} />), props }
}

function selectExamples() {
  fireEvent.click(
    screen.getByText(
      "Missing a value? Start with Ingenuity, Destiny, or Pets.",
    ),
  )
  fireEvent.click(
    screen.getByRole("button", { name: "Select all available examples" }),
  )
}

describe("Hub custom-value invitation", () => {
  it("supports individual selection, deselection, and discarding the draft batch", () => {
    const { props } = setup()
    fireEvent.click(
      screen.getByText(
        "Missing a value? Start with Ingenuity, Destiny, or Pets.",
      ),
    )
    fireEvent.click(screen.getByRole("checkbox", { name: /Ingenuity/ }))
    expect(screen.getByRole("button", { name: "Edit Ingenuity" })).toBeVisible()
    fireEvent.click(screen.getByRole("checkbox", { name: /Ingenuity/ }))
    expect(
      screen.queryByRole("button", { name: "Review changes" }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("checkbox", { name: /Destiny/ }))
    fireEvent.click(screen.getByRole("button", { name: "Discard drafts" }))
    expect(props.onNavigationBlockedChange).toHaveBeenLastCalledWith(false)
    expect(props.onApply).not.toHaveBeenCalled()
  })

  it("keeps the review after a backup failure and lets the player return to selection", async () => {
    const { props } = setup()
    props.onExport.mockRejectedValueOnce(new Error("Backup download failed"))
    selectExamples()
    fireEvent.click(screen.getByRole("button", { name: "Review changes" }))
    fireEvent.click(screen.getByRole("button", { name: "Export Data" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Backup download failed",
    )
    expect(screen.getByRole("button", { name: "Apply Changes" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Back to selection" }))
    expect(screen.getByRole("button", { name: "Edit Pets" })).toBeVisible()
    expect(props.onApply).not.toHaveBeenCalled()
  })
  it("does not select an example that duplicates a player-written draft", () => {
    const { props } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Write my own" }))
    fireEvent.change(screen.getByLabelText("Value name"), {
      target: { value: "ｉｎｇｅｎｕｉｔｙ" },
    })
    fireEvent.change(screen.getByLabelText("What does it mean to you?"), {
      target: { value: "My own meaning." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Add to draft" }))
    selectExamples()
    expect(screen.getByRole("checkbox", { name: /Ingenuity/ })).toBeDisabled()
    expect(screen.getByText("Already in your drafts")).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Review changes" }))
    fireEvent.click(screen.getByRole("button", { name: "Apply Changes" }))
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
    fireEvent.click(screen.getByRole("button", { name: "Edit Pets" }))
    fireEvent.change(screen.getByLabelText("Value name"), {
      target: { value: "" },
    })
    fireEvent.change(screen.getByLabelText("What does it mean to you?"), {
      target: { value: "" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Back to selection" }))
    expect(
      screen.getByRole("button", { name: "Review changes" }),
    ).toBeDisabled()
    fireEvent.click(
      screen.getByRole("button", { name: "Discard unfinished edit" }),
    )
    expect(screen.getByRole("button", { name: "Review changes" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Edit Pets" })).toBeEnabled()
  })
  it("keeps examples unsaved until one reviewed application and offers a backup", async () => {
    const { props } = setup()
    selectExamples()
    expect(props.onApply).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Review changes" }))
    expect(screen.getByText(/clears Undo and Redo/)).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Export Data" }))
    expect(props.onExport).toHaveBeenCalledOnce()
    await screen.findByRole("button", { name: "Export Data" })
    fireEvent.click(screen.getByRole("button", { name: "Apply Changes" }))
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith(
      CUSTOM_VALUE_STARTER_EXAMPLES.map(({ name, definition }) => ({
        name,
        definition,
      })),
    )
  })

  it("preserves an unfinished original draft when returning to selection", () => {
    const { props } = setup()
    selectExamples()
    fireEvent.click(screen.getByRole("button", { name: "Add another" }))
    fireEvent.change(screen.getByLabelText("Value name"), {
      target: { value: "My direction" },
    })
    fireEvent.change(screen.getByLabelText("What does it mean to you?"), {
      target: { value: "To live by my own priorities." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Back to selection" }))
    expect(
      screen.getByRole("button", { name: "Review changes" }),
    ).toBeDisabled()
    fireEvent.click(
      screen.getByRole("button", { name: "Continue unfinished draft" }),
    )
    expect(screen.getByLabelText("Value name")).toHaveValue("My direction")
    fireEvent.click(screen.getByRole("button", { name: "Add to draft" }))
    fireEvent.click(screen.getByRole("button", { name: "Remove Destiny" }))
    fireEvent.click(screen.getByRole("button", { name: "Edit Pets" }))
    fireEvent.change(screen.getByLabelText("What does it mean to you?"), {
      target: { value: "To care for my companions." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Update draft" }))
    fireEvent.click(screen.getByRole("button", { name: "Review changes" }))
    fireEvent.click(screen.getByRole("button", { name: "Apply Changes" }))
    expect(props.onApply).toHaveBeenCalledWith([
      {
        name: "Ingenuity",
        definition: CUSTOM_VALUE_STARTER_EXAMPLES[0].definition,
      },
      { name: "Pets", definition: "To care for my companions." },
      { name: "My direction", definition: "To live by my own priorities." },
    ])
  })

  it("blocks a canonical or draft duplicate while retaining the typed text", () => {
    setup()
    selectExamples()
    fireEvent.click(screen.getByRole("button", { name: "Add another" }))
    fireEvent.change(screen.getByLabelText("What does it mean to you?"), {
      target: { value: "My meaning." },
    })
    for (const name of ["ＦＵＮ", " ingenuity "]) {
      fireEvent.change(screen.getByLabelText("Value name"), {
        target: { value: name },
      })
      expect(
        screen.getByRole("button", { name: "Add to draft" }),
      ).toBeDisabled()
      expect(screen.getByLabelText("Value name")).toHaveValue(name)
    }
  })

  it("disables changes during save and retains the review after failure for retry", () => {
    const { props, rerender } = setup()
    selectExamples()
    fireEvent.click(screen.getByRole("button", { name: "Review changes" }))
    rerender(<CustomValueInvitation {...props} isSaving />)
    expect(screen.getByRole("button", { name: "Apply Changes" })).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Discard drafts" }),
    ).toBeDisabled()
    rerender(<CustomValueInvitation {...props} saveIssue="Storage is full" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Storage is full")
    expect(screen.getByRole("button", { name: "Edit Ingenuity" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Apply Changes" }))
    expect(props.onApply).toHaveBeenCalledOnce()
  })
})
