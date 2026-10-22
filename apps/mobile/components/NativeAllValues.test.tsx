import { createActiveDeck, type ActiveDeck } from "@game/data/src/ActiveDeck"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import {
  createCustomValueId,
  type CustomValueDefinition,
} from "@game/data/src/Value"
import {
  createInitialValueProgress,
  createValueProgress,
} from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import { describe, expect, it, jest } from "@jest/globals"
import {
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native"
import NativeAllValues from "@/components/NativeAllValues"

function createRankedValues(activeDeck: ActiveDeck) {
  return rankValues(activeDeck, createInitialValueProgress(activeDeck))
}

function createRankedValuesWithEvidence() {
  const activeDeck = createActiveDeck([])
  const progressById = new Map(createInitialValueProgress(activeDeck))
  const firstValueId = activeDeck.valueIds[0]
  if (!firstValueId) throw new Error("Canonical test value is unavailable")

  progressById.set(
    firstValueId,
    createValueProgress(firstValueId, {
      totalXp: 4,
      profileWins: 1,
      profileComparisons: 1,
      currentCycleWins: 1,
    }),
  )

  return rankValues(activeDeck, progressById)
}

function createIngenuityDeck() {
  return createActiveDeck([
    Object.freeze({
      kind: "custom",
      id: createCustomValueId("custom:00000000-0000-4000-8000-000000000001"),
      name: "Ingenuity",
      definition: "Ability to solve problems creatively.",
      creationOrdinal: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }) satisfies CustomValueDefinition,
  ])
}

function createCallbacks() {
  return {
    onAddCustomValue: jest.fn(),
    onClose: jest.fn(),
    onDeleteCustomValue: jest.fn(),
    onUpdateCustomValue: jest.fn(),
  }
}

function getLegacyCustomDetails() {
  const customDetails = screen
    .getAllByLabelText("Ingenuity details")
    .find((details) => within(details).queryByRole("button", { name: "Edit" }))
  if (!customDetails)
    throw new Error("Expected the retained custom Ingenuity details")
  return customDetails
}

describe("NativeAllValues", () => {
  it("renders selected labels and selected included-value meanings without changing private custom text", async () => {
    const english = getLocaleCatalog()
    const deck = createIngenuityDeck()
    const ranked = createRankedValues(deck).filter(
      ({ definition }) =>
        definition.id === deck.valueIds[0] || definition.kind === "custom",
    )
    const values = new Map(english.values)
    const first = ranked.find(
      ({ definition }) => definition.kind === "canonical",
    )?.definition
    if (!first || first.kind !== "canonical")
      throw new Error("Expected an included value")
    values.set(first.id, {
      name: "⟦Selected value⟧",
      definition: "⟦Selected meaning⟧",
    })
    const callbacks = createCallbacks()
    await render(
      <NativeAllValues
        {...callbacks}
        rankedValues={ranked}
        localization={{
          ...english,
          values,
          interfaceCopy: {
            ...english.interfaceCopy,
            dressingRoom: {
              ...english.interfaceCopy.dressingRoom,
              back: "⟦Back⟧",
            },
          },
        }}
      />,
    )
    expect(screen.getByText("⟦Selected value⟧")).toBeOnTheScreen()
    expect(screen.getByText("“⟦Selected meaning⟧”")).toBeOnTheScreen()
    expect(screen.getByText("Ingenuity")).toBeOnTheScreen()
    expect(
      screen.getByText("“Ability to solve problems creatively.”"),
    ).toBeOnTheScreen()
    await userEvent
      .setup()
      .press(screen.getByRole("button", { name: "⟦Back⟧" }))
    expect(callbacks.onClose).toHaveBeenCalledTimes(1)
  })
  it("routes Back and Add to their existing owners", async () => {
    const callbacks = createCallbacks()
    const user = userEvent.setup()
    const rankedValues = createRankedValues(createActiveDeck([])).slice(0, 3)
    await render(<NativeAllValues {...callbacks} rankedValues={rankedValues} />)

    const add = screen.getByRole("button", { name: "Add value" })
    const close = screen.getByRole("button", { name: "Back" })
    expect(add).toBeEnabled()
    expect(close).toBeEnabled()

    await user.press(add)
    await user.press(close)

    expect(callbacks.onAddCustomValue).toHaveBeenCalledTimes(1)
    expect(callbacks.onClose).toHaveBeenCalledTimes(1)
  })

  it("carries an unmatched search into Home authoring without creating data", async () => {
    const callbacks = createCallbacks()
    const user = userEvent.setup()
    await render(
      <NativeAllValues
        {...callbacks}
        rankedValues={createRankedValues(createActiveDeck([]))}
      />,
    )
    await user.type(screen.getByLabelText("Search All Values"), "Mapachecraft")
    await user.press(screen.getByRole("button", { name: "Add value" }))
    expect(callbacks.onAddCustomValue).toHaveBeenCalledTimes(1)
    expect(callbacks.onAddCustomValue).toHaveBeenCalledWith("Mapachecraft")
    expect(screen.queryByLabelText("Value name")).not.toBeOnTheScreen()
  })

  it("blocks navigation through edit drafts and delete confirmations", async () => {
    const callbacks = createCallbacks()
    const user = userEvent.setup()
    const activeDeck = createIngenuityDeck()
    const rankedValues = createRankedValues(activeDeck).filter(
      ({ definition }) => definition.id === activeDeck.customValues[0].id,
    )
    await render(<NativeAllValues {...callbacks} rankedValues={rankedValues} />)

    const add = screen.getByRole("button", { name: "Add value" })
    const close = screen.getByRole("button", { name: "Back" })
    const ingenuity = getLegacyCustomDetails()

    await user.press(within(ingenuity).getByRole("button", { name: "Edit" }))
    expect(add).toBeDisabled()
    expect(close).toBeDisabled()
    await user.press(screen.getByRole("button", { name: "Cancel" }))
    expect(add).toBeEnabled()
    expect(close).toBeEnabled()

    await user.press(within(ingenuity).getByRole("button", { name: "Delete" }))
    expect(screen.getByLabelText("Remove Ingenuity?")).toBeOnTheScreen()
    expect(add).toBeDisabled()
    expect(close).toBeDisabled()
    await user.press(screen.getByRole("button", { name: "Cancel" }))
    expect(add).toBeEnabled()
    expect(close).toBeEnabled()
  })

  it("keeps navigation inert while persistence is pending", async () => {
    const callbacks = createCallbacks()
    const user = userEvent.setup()
    const rankedValues = createRankedValues(createActiveDeck([])).slice(0, 3)
    await render(
      <NativeAllValues
        {...callbacks}
        isPersistencePending
        rankedValues={rankedValues}
      />,
    )

    const add = screen.getByRole("button", { name: "Add value" })
    const close = screen.getByRole("button", { name: "Back" })
    expect(add).toBeDisabled()
    expect(close).toBeDisabled()

    await user.press(add)
    await user.press(close)

    expect(callbacks.onAddCustomValue).not.toHaveBeenCalled()
    expect(callbacks.onClose).not.toHaveBeenCalled()
  })

  it("updates a Custom Value only after composed edit review", async () => {
    const callbacks = createCallbacks()
    const user = userEvent.setup()
    const activeDeck = createIngenuityDeck()
    const ingenuity = activeDeck.customValues[0]
    const rankedValues = createRankedValues(activeDeck).filter(
      ({ definition }) => definition.id === ingenuity.id,
    )
    await render(<NativeAllValues {...callbacks} rankedValues={rankedValues} />)

    await user.press(
      within(getLegacyCustomDetails()).getByRole("button", {
        name: "Edit",
      }),
    )
    const definition = screen.getByLabelText("What This Value Means to Me")
    await user.clear(definition)
    await user.type(definition, "Resourceful and original problem solving.")
    await user.press(screen.getByRole("button", { name: "Review Update" }))
    await user.press(screen.getByRole("button", { name: "Update Value" }))

    expect(callbacks.onUpdateCustomValue).toHaveBeenCalledWith(
      ingenuity.id,
      "Ingenuity",
      "Resourceful and original problem solving.",
    )
  })

  it("deletes exactly the confirmed Custom Value", async () => {
    const callbacks = createCallbacks()
    const user = userEvent.setup()
    const activeDeck = createIngenuityDeck()
    const ingenuity = activeDeck.customValues[0]
    const rankedValues = createRankedValues(activeDeck).filter(
      ({ definition }) => definition.id === ingenuity.id,
    )
    await render(<NativeAllValues {...callbacks} rankedValues={rankedValues} />)

    await user.press(
      within(getLegacyCustomDetails()).getByRole("button", {
        name: "Delete",
      }),
    )
    await user.press(screen.getByRole("button", { name: "Remove Value" }))

    expect(callbacks.onDeleteCustomValue).toHaveBeenCalledWith(ingenuity.id)
  })

  it("keeps matching ranked values visible without opening an editor", async () => {
    const callbacks = createCallbacks()
    const user = userEvent.setup()
    await render(
      <NativeAllValues
        {...callbacks}
        rankedValues={createRankedValues(createActiveDeck([]))}
      />,
    )
    const search = screen.getByLabelText("Search All Values")
    await user.type(search, "Health")
    expect(screen.getByLabelText("Health details")).toBeOnTheScreen()
    expect(search).toHaveDisplayValue("Health")
    expect(callbacks.onAddCustomValue).not.toHaveBeenCalled()
  })

  it("separates the evidence-ranked Top Five from every remaining value", async () => {
    const callbacks = createCallbacks()
    const rankedValues = createRankedValuesWithEvidence().slice(0, 6)
    await render(<NativeAllValues {...callbacks} rankedValues={rankedValues} />)

    expect(screen.getAllByText("Top Five")).toHaveLength(1)
    expect(screen.getAllByText("All Other Values")).toHaveLength(1)
    expect(screen.getByLabelText("Rank 1, gold medal")).toBeOnTheScreen()
    expect(screen.getByLabelText("Rank 6, silver medal")).toBeOnTheScreen()
  })

  it("explains that a failed save preserved the current data and draft", async () => {
    const callbacks = createCallbacks()
    const rankedValues = createRankedValues(createActiveDeck([])).slice(0, 3)
    await render(
      <NativeAllValues
        {...callbacks}
        persistenceIssue="Native storage write failed"
        rankedValues={rankedValues}
      />,
    )

    expect(screen.getByLabelText("Custom Value save failed")).toHaveProp(
      "accessibilityRole",
      "alert",
    )
    expect(screen.getByText("That change wasn’t saved.")).toBeOnTheScreen()
    expect(
      screen.getByText(
        "Your current data and draft are unchanged. Review them and try again.",
      ),
    ).toBeOnTheScreen()
  })
})
