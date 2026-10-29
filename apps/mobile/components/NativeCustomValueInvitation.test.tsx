import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { CUSTOM_VALUE_INVITATION_COPY } from "@game/data/src/CustomValueInvitationCopy"
import type { CustomValueAuthoringOptions } from "@game/data/src/useCustomValueAuthoring"
import { createInitialValueProgress } from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import LocaleProvider from "@game/utils/src/LocaleContext"
import { describe, expect, it, jest } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react-native"
import { Text } from "react-native"
import NativeCustomValueInvitation from "@/components/NativeCustomValueInvitation"

function options() {
  return {
    editorRequestId: 1,
    deckRevision: 0,
    existingCustomValues: [],
    isSaving: false,
    onApply: jest.fn<CustomValueAuthoringOptions["onApply"]>(),
    onExport: jest
      .fn<CustomValueAuthoringOptions["onExport"]>()
      .mockResolvedValue(undefined),
    onExit: jest.fn<CustomValueAuthoringOptions["onExit"]>(),
    onNavigationBlockedChange:
      jest.fn<CustomValueAuthoringOptions["onNavigationBlockedChange"]>(),
  }
}
async function press(name: string) {
  await fireEvent.press(screen.getByRole("button", { name }))
}
async function fill(name: string, definition: string) {
  await fireEvent.changeText(screen.getByLabelText("Value name"), name)
  await fireEvent.changeText(screen.getByLabelText("Definition"), definition)
}

describe("native inline custom-value authoring", () => {
  it("opens blank and keeps the instructional example non-interactive", async () => {
    const props = options()
    const { container } = await render(
      <NativeCustomValueInvitation
        {...props}
        saveIssue={null}
        header={<Text>Editor context</Text>}
      />,
    )
    const [formScroll] = container.queryAll(
      (node) =>
        node.props.keyboardShouldPersistTaps === "handled" &&
        node.queryAll(
          (child) => child.props.accessibilityLabel === "Value name",
        ).length > 0,
    )
    expect(formScroll).toBeDefined()
    expect(
      formScroll.queryAll((node) => node.props.children === "Editor context")
        .length,
    ).toBeGreaterThan(0)
    expect(
      formScroll.queryAll((node) => node.props.children === "Save"),
    ).toHaveLength(0)
    expect(screen.getByLabelText("Value name")).toHaveDisplayValue("")
    expect(
      screen.getByText(CUSTOM_VALUE_INVITATION_COPY.example),
    ).toBeOnTheScreen()
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    await fireEvent(screen.getByLabelText("Value name"), "submitEditing")
    expect(props.onApply).not.toHaveBeenCalled()
    await press("Back")
    expect(props.onExit).toHaveBeenCalledWith("home")
    expect(props.onApply).not.toHaveBeenCalled()
  })

  it("retains incomplete text when leaving and discards only on explicit confirmation", async () => {
    const props = options()
    await render(<NativeCustomValueInvitation {...props} saveIssue={null} />)
    await fill("Craftsmanship", "")
    await press("Back")
    expect(
      screen.getByRole("button", { name: "Save and return" }),
    ).toBeDisabled()
    await press("Keep editing")
    expect(screen.getByLabelText("Value name")).toHaveDisplayValue(
      "Craftsmanship",
    )
    expect(props.onExit).not.toHaveBeenCalled()
    await press("Discard changes")
    await press("Discard changes")
    expect(props.onExit).toHaveBeenCalledWith("home")
    expect(props.onApply).not.toHaveBeenCalled()
  })

  it("saves the entire batch and preserves it through a failed durable write", async () => {
    const props = options()
    await render(<NativeCustomValueInvitation {...props} saveIssue={null} />)
    await fill("Craftsmanship", "To make things well.")
    await press("Add another")
    await fill("Stargazing", "To appreciate the night sky.")
    await press("Save")
    expect(props.onApply).toHaveBeenCalledWith([
      { name: "Craftsmanship", definition: "To make things well." },
      { name: "Stargazing", definition: "To appreciate the night sky." },
    ])
    await screen.rerender(
      <NativeCustomValueInvitation {...props} isSaving saveIssue={null} />,
    )
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
    expect(screen.getByLabelText("Definition")).toBeDisabled()
    await screen.rerender(
      <NativeCustomValueInvitation {...props} saveIssue="Storage is full" />,
    )
    expect(screen.getByRole("alert")).toHaveTextContent("Storage is full")
    expect(screen.getByLabelText("Value name")).toHaveDisplayValue("Stargazing")
    expect(screen.getByText("To make things well.")).toBeOnTheScreen()
    expect(props.onExit).not.toHaveBeenCalled()
    await press("Save")
    await screen.rerender(
      <NativeCustomValueInvitation
        {...props}
        deckRevision={1}
        saveIssue={null}
      />,
    )
    expect(screen.queryByLabelText("Value name")).not.toBeOnTheScreen()
    expect(props.onExit).toHaveBeenCalledTimes(1)
  })

  it("edits and removes queued drafts without dropping an unfinished edit", async () => {
    const props = options()
    await render(<NativeCustomValueInvitation {...props} saveIssue={null} />)
    await fill("Craftsmanship", "Original meaning.")
    await press("Add another")
    await fill("Stargazing", "Night skies.")
    await press("Add another")
    await press("Edit Craftsmanship")
    await fill("", "")
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()
    await press("Discard unfinished edit")
    await press("Edit Craftsmanship")
    await fill("Craftsmanship", "My revised meaning.")
    await press("Add another")
    await press("Remove Stargazing")
    await press("Save")
    expect(props.onApply).toHaveBeenCalledWith([
      { name: "Craftsmanship", definition: "My revised meaning." },
    ])
  })

  it("guards Menu and hardware Back and preserves the requested exit after saving", async () => {
    const props = options()
    await render(<NativeCustomValueInvitation {...props} saveIssue={null} />)
    await fill("Craftsmanship", "To make things well.")
    await screen.rerender(
      <NativeCustomValueInvitation
        {...props}
        menuRequestId={1}
        saveIssue={null}
      />,
    )
    expect(
      screen.getByRole("button", { name: "Keep editing" }),
    ).toBeOnTheScreen()
    await screen.rerender(
      <NativeCustomValueInvitation
        {...props}
        menuRequestId={1}
        backRequestId={1}
        saveIssue={null}
      />,
    )
    expect(
      screen.queryByRole("button", { name: "Keep editing" }),
    ).not.toBeOnTheScreen()
    await screen.rerender(
      <NativeCustomValueInvitation
        {...props}
        menuRequestId={2}
        backRequestId={1}
        saveIssue={null}
      />,
    )
    await press("Save and return")
    await screen.rerender(
      <NativeCustomValueInvitation
        {...props}
        menuRequestId={2}
        backRequestId={1}
        deckRevision={1}
        saveIssue={null}
      />,
    )
    expect(props.onExit).toHaveBeenCalledWith("menu")
  })

  it("keeps an export failure actionable without erasing the author’s text", async () => {
    const props = options()
    props.onExport.mockRejectedValueOnce(new Error("Sharing is unavailable"))
    await render(<NativeCustomValueInvitation {...props} saveIssue={null} />)
    await fill("Craftsmanship", "To make things well.")
    await press("Export Data")
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Sharing is unavailable",
    )
    expect(screen.getByLabelText("Definition")).toHaveDisplayValue(
      "To make things well.",
    )
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled()
  })

  it("finds localized names and preserves the draft when opening an existing match", async () => {
    const props = options()
    const deck = createActiveDeck([])
    const rankedValues = rankValues(deck, createInitialValueProgress(deck))
    const health = rankedValues.find(
      ({ definition }) =>
        definition.kind === "canonical" && definition.englishName === "Health",
    )!
    await render(
      <LocaleProvider locale="es-MX">
        <NativeCustomValueInvitation
          {...props}
          rankedValues={rankedValues}
          saveIssue={null}
        />
      </LocaleProvider>,
    )
    await fireEvent.changeText(
      screen.getByLabelText("Nombre del valor"),
      "Salud",
    )
    await press("Abrir Salud")
    expect(props.onExit).not.toHaveBeenCalled()
    await press("Descartar cambios")
    expect(props.onExit).toHaveBeenCalledWith({ valueId: health.definition.id })
  })
})
