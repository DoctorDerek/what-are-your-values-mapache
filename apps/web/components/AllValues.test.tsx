import { createActiveDeck, type ActiveDeck } from "@game/data/src/ActiveDeck"
import { CANONICAL_VALUES } from "@game/data/src/CanonicalValues"
import {
  createSeethingSwarmTypographyOnlyRuntimeClipCatalog,
  type SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  createCustomValueId,
  getValueDisplayDefinition,
  getValueDisplayName,
  type CustomValueDefinition,
} from "@game/data/src/Value"
import { createInitialValueProgress } from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import { ZOO_ANIMALS } from "@game/data/src/ZooAnimals"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import type { StaticImageData } from "next/image"
import type { ComponentProps } from "react"
import { describe, expect, it, vi } from "vitest"
import AllValues from "./AllValues"

function createRankedValues(activeDeck: ActiveDeck) {
  return rankValues(activeDeck, createInitialValueProgress(activeDeck))
}

function createActiveDeckWithIngenuity() {
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

function renderAllValues(
  rankedValues = createRankedValues(createActiveDeck([])),
  overrides: Partial<ComponentProps<typeof AllValues>> = {},
) {
  return render(
    <AllValues
      runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
      shouldReduceMotion={false}
      rankedValues={rankedValues}
      isMenuOpen={false}
      onClose={vi.fn()}
      onOpenMenu={vi.fn()}
      onAddCustomValue={vi.fn()}
      onUpdateCustomValue={vi.fn()}
      onDeleteCustomValue={vi.fn()}
      {...overrides}
    />,
  )
}

describe("All Values Component Integration", () => {
  it("retains calm art until attention is ready and preserves focus while the pointer leaves", async () => {
    const runtimeClipCatalog = {
      mode: "licensed",
      evidenceSnapshotId: "all-values-attention-test",
      animals: ZOO_ANIMALS.map(({ id }) => ({
        animalId: id,
        characterClips: ["idle", "alerted", "dance"].map((animationId) => ({
          kind: "character",
          animalId: id,
          animationId,
          relativePath: `${id}/${animationId}.png`,
          frameWidth: 1,
          frameHeight: 1,
          frameCount: 1,
          visibleBounds: { left: 0, top: 0, width: 1, height: 1 },
          asset: {
            src: `/test-animals/${id}-${animationId}.png`,
            width: 1,
            height: 1,
          },
        })),
        auxiliaryEffectClips: [],
        referencePose: Object.freeze({
          animationId: "idle",
          frameIndex: 0,
          bounds: Object.freeze({ left: 0, top: 0, width: 1, height: 1 }),
          anchor: Object.freeze({ x: 0.5, y: 1 }),
        }),
      })),
      characterClipCount: ZOO_ANIMALS.length * 3,
      auxiliaryEffectClipCount: 0,
    } satisfies SeethingSwarmRuntimeClipCatalog<StaticImageData>
    renderAllValues(undefined, { runtimeClipCatalog })
    const row = screen.getAllByRole("listitem")[0]
    const idle = row.querySelector<HTMLImageElement>('img[src$="-idle.png"]')!
    const alerted = row.querySelector<HTMLImageElement>(
      'img[src$="-alerted.png"]',
    )!
    const dance = row.querySelector<HTMLImageElement>('img[src$="-dance.png"]')!
    const active = () => row.querySelector('[data-hub-active-clip="true"] img')
    fireEvent.load(idle)
    fireEvent.pointerEnter(row, { pointerType: "mouse" })
    expect(active()).toBe(idle)
    fireEvent.load(alerted)
    await waitFor(() => expect(active()).toBe(alerted))
    fireEvent.focus(row)
    fireEvent.pointerLeave(row)
    expect(active()).toBe(alerted)
    fireEvent.blur(row, { relatedTarget: within(row).getByRole("heading") })
    expect(active()).toBe(alerted)
    fireEvent.load(dance)
    fireEvent.animationEnd(alerted)
    await waitFor(() => expect(active()).toBe(dance))
    fireEvent.animationEnd(dance)
    await waitFor(() => expect(active()).toBe(idle))
    fireEvent.blur(row)
    fireEvent.pointerEnter(row, { pointerType: "touch" })
    expect(active()).toBe(idle)
    fireEvent.pointerEnter(row, { pointerType: "mouse" })
    await waitFor(() => expect(active()).toBe(alerted))
    fireEvent.pointerCancel(row)
    await waitFor(() => expect(active()).toBe(idle))
  })
  it("shows every fresh value alphabetically with definitions visible and no fabricated Top Five", () => {
    const rankedValues = createRankedValues(createActiveDeck([]))

    renderAllValues(rankedValues)
    expect(screen.queryByText(/🥇|🥈|🥉/)).not.toBeInTheDocument()

    expect(screen.getByRole("main")).toHaveAttribute(
      "data-slot",
      "mapache-screen",
    )
    expect(screen.getByRole("main")).toHaveClass(
      "min-h-[100dvh]",
      "[--mapache-screen-spacing:0px]",
    )
    expect(
      screen
        .getByRole("heading", { name: "All Values", level: 1 })
        .closest("header"),
    ).toHaveClass("top-[env(safe-area-inset-top,0px)]")
    expect(
      screen.getByRole("heading", { name: "All Values", level: 1 }),
    ).toBeVisible()
    expect(
      screen.getByText(`${CANONICAL_VALUES.length} Active Values`),
    ).toBeVisible()
    expect(screen.getAllByRole("listitem")).toHaveLength(
      CANONICAL_VALUES.length,
    )
    expect(screen.queryByText("Top Five")).not.toBeInTheDocument()
    expect(
      screen.getByText(
        `“${getValueDisplayDefinition(rankedValues[0].definition)}”`,
      ),
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Show definition" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument()
  })

  it("hands creation to the Hub instead of rendering a second builder", () => {
    const onAddCustomValue = vi.fn()
    renderAllValues(undefined, { onAddCustomValue })
    fireEvent.click(screen.getByRole("button", { name: "Add Custom Value" }))
    expect(onAddCustomValue).toHaveBeenCalledExactlyOnceWith("")
    expect(
      screen.queryByRole("form", { name: "Add Custom Value" }),
    ).not.toBeInTheDocument()
  })

  it("carries an unmatched search name to the Hub editor", () => {
    const onAddCustomValue = vi.fn()
    renderAllValues(undefined, { onAddCustomValue })
    fireEvent.change(screen.getByLabelText("Search All Values"), {
      target: { value: "Ingenuity" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Add Custom Value" }))
    expect(onAddCustomValue).toHaveBeenCalledExactlyOnceWith("Ingenuity")
  })

  it("locks navigation and creation while persistence is pending", () => {
    renderAllValues(undefined, { isPersistencePending: true })
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Menu" })).toBeDisabled()
    expect(
      screen.getByRole("button", { name: "Add Custom Value" }),
    ).toBeDisabled()
  })

  it("edits a Custom Value only after an explicit review step", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    const onUpdateCustomValue = vi.fn()

    renderAllValues(createRankedValues(activeDeck), { onUpdateCustomValue })

    const targetListItem = screen.getByText("Ingenuity").closest("li")
    if (!targetListItem) {
      throw new Error("Expected Ingenuity list item in DOM")
    }
    fireEvent.click(
      within(targetListItem).getByRole("button", { name: "Edit" }),
    )
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: " Curiosity Engine " },
    })
    fireEvent.change(screen.getByLabelText("What This Value Means to Me"), {
      target: { value: "  A drive to explore how things connect. " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Review Update" }))

    expect(
      screen.getByRole("alertdialog", { name: "Update Ingenuity?" }),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Update Value" })).toHaveClass(
      "text-black",
    )
    expect(onUpdateCustomValue).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Update Value" }))
    expect(onUpdateCustomValue).toHaveBeenCalledWith(
      activeDeck.customValues[0].id,
      "Curiosity Engine",
      "A drive to explore how things connect.",
    )
  })

  it("allows cancelling the explicit Custom Value update review", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    const onUpdateCustomValue = vi.fn()

    renderAllValues(createRankedValues(activeDeck), { onUpdateCustomValue })

    const targetListItem = screen.getByText("Ingenuity").closest("li")
    if (!targetListItem) {
      throw new Error("Expected Ingenuity list item in DOM")
    }
    fireEvent.click(
      within(targetListItem).getByRole("button", { name: "Edit" }),
    )
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "Curiosity Engine" },
    })
    fireEvent.change(screen.getByLabelText("What This Value Means to Me"), {
      target: { value: "A drive to explore how things connect." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Review Update" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByRole("alertdialog", { name: "Update Ingenuity?" }),
    ).not.toBeInTheDocument()
    expect(onUpdateCustomValue).not.toHaveBeenCalled()
  })

  it("cancels an invalid edit and restores the persisted Custom Value fields", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    const onUpdateCustomValue = vi.fn()

    renderAllValues(createRankedValues(activeDeck), { onUpdateCustomValue })

    const targetListItem = screen.getByText("Ingenuity").closest("li")
    if (!targetListItem) {
      throw new Error("Expected Ingenuity list item in DOM")
    }

    fireEvent.click(
      within(targetListItem).getByRole("button", { name: "Edit" }),
    )
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "Curiosity Engine" },
    })
    const definitionInput = screen.getByLabelText("What This Value Means to Me")
    fireEvent.change(definitionInput, {
      target: { value: "Purpose\u202e" },
    })
    fireEvent.blur(definitionInput)

    expect(
      screen.getByText(
        "Remove invisible or control characters from the personal definition.",
      ),
    ).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(
      screen.queryByLabelText("What This Value Means to Me"),
    ).not.toBeInTheDocument()
    expect(onUpdateCustomValue).not.toHaveBeenCalled()

    fireEvent.click(
      within(targetListItem).getByRole("button", { name: "Edit" }),
    )
    expect(screen.getByLabelText("Value Name")).toHaveValue("Ingenuity")
    expect(screen.getByLabelText("What This Value Means to Me")).toHaveValue(
      "Ability to solve problems creatively.",
    )
    expect(
      screen.queryByText(
        "Remove invisible or control characters from the personal definition.",
      ),
    ).not.toBeInTheDocument()
  })

  it("keeps an invalid Custom Value update local and unconfirmed", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    const onUpdateCustomValue = vi.fn()

    renderAllValues(createRankedValues(activeDeck), { onUpdateCustomValue })

    const targetListItem = screen.getByText("Ingenuity").closest("li")
    if (!targetListItem) {
      throw new Error("Expected Ingenuity list item in DOM")
    }
    fireEvent.click(
      within(targetListItem).getByRole("button", { name: "Edit" }),
    )
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "" },
    })
    fireEvent.change(screen.getByLabelText("What This Value Means to Me"), {
      target: { value: "" },
    })
    const editForm = targetListItem.querySelector("form")
    if (!editForm) {
      throw new Error("Expected Custom Value edit form in DOM")
    }
    fireEvent.submit(editForm)

    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "Curiosity Engine" },
    })
    fireEvent.change(screen.getByLabelText("What This Value Means to Me"), {
      target: { value: "A drive to explore how things connect." },
    })
    fireEvent.click(screen.getByRole("button", { name: "Review Update" }))
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "" },
    })
    fireEvent.change(screen.getByLabelText("What This Value Means to Me"), {
      target: { value: "" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Update Value" }))

    expect(
      screen.getByRole("alertdialog", { name: "Update Ingenuity?" }),
    ).toBeVisible()
    expect(onUpdateCustomValue).not.toHaveBeenCalled()
  })

  it("confirms Custom Value deletion through the supplied durable callback", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    const onDeleteCustomValue = vi.fn()

    renderAllValues(createRankedValues(activeDeck), { onDeleteCustomValue })

    const targetListItem = screen.getByText("Ingenuity").closest("li")
    if (!targetListItem) {
      throw new Error("Expected Ingenuity list item in DOM")
    }
    const deleteButton = within(targetListItem).getByRole("button", {
      name: "Delete",
    })
    expect(deleteButton).toHaveClass("text-black")
    fireEvent.click(deleteButton)
    expect(
      screen.getByRole("alertdialog", { name: "Remove Ingenuity?" }),
    ).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(
      screen.queryByRole("alertdialog", { name: "Remove Ingenuity?" }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      within(targetListItem).getByRole("button", { name: "Delete" }),
    )
    const deleteValueButton = screen.getByRole("button", {
      name: "Delete Value",
    })
    expect(deleteValueButton).toHaveClass("text-black")
    fireEvent.click(deleteValueButton)

    expect(onDeleteCustomValue).toHaveBeenCalledWith(
      activeDeck.customValues[0].id,
    )
  })

  it("disables editing into an existing value name", () => {
    const firstCustom = createActiveDeckWithIngenuity().customValues[0]
    const secondCustom = Object.freeze({
      kind: "custom",
      id: createCustomValueId("custom:00000000-0000-4000-8000-000000000002"),
      name: "Curiosity Engine",
      definition: "A drive to explore how things connect.",
      creationOrdinal: 2,
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    }) satisfies CustomValueDefinition
    const activeDeck = createActiveDeck([firstCustom, secondCustom])

    renderAllValues(createRankedValues(activeDeck))

    const targetListItem = screen.getByText("Ingenuity").closest("li")
    if (!targetListItem) {
      throw new Error("Expected Ingenuity list item in DOM")
    }
    fireEvent.click(
      within(targetListItem).getByRole("button", { name: "Edit" }),
    )
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "Curiosity Engine" },
    })
    fireEvent.blur(screen.getByLabelText("Value Name"))
    expect(
      screen.getByText("This value already exists. Open it instead."),
    ).toHaveClass("text-black")
    expect(screen.getByLabelText("Value Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    )
    expect(screen.getByRole("button", { name: "Review Update" })).toBeDisabled()
  })

  it("filters literal name and definition text while preserving the current presentation order", () => {
    const activeDeck = createActiveDeck([])
    const rankedValues = createRankedValues(activeDeck)

    renderAllValues(rankedValues)

    const search = screen.getByRole("searchbox", { name: "Search All Values" })
    fireEvent.change(search, { target: { value: "health" } })

    const expectedMatches = rankedValues.filter(({ definition }) =>
      getValueDisplayName(definition).toLocaleLowerCase().includes("health"),
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(expectedMatches.length)
    expectedMatches.forEach(({ definition }) => {
      expect(screen.getByText(getValueDisplayName(definition))).toBeVisible()
    })

    const definitionSearchText = getValueDisplayDefinition(
      rankedValues[0].definition,
    )
      .slice(0, 12)
      .toLocaleLowerCase()
    fireEvent.change(search, { target: { value: definitionSearchText } })
    const expectedDefinitionMatches = rankedValues.filter(({ definition }) =>
      getValueDisplayDefinition(definition)
        .toLocaleLowerCase()
        .includes(definitionSearchText),
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(
      expectedDefinitionMatches.length,
    )

    fireEvent.change(search, { target: { value: "" } })
    expect(screen.getAllByRole("listitem")).toHaveLength(
      CANONICAL_VALUES.length,
    )
  })

  it("marks the earned Top Five once and closes without changing data", () => {
    const activeDeck = createActiveDeck([])
    const rankedValues = rankValues(
      activeDeck,
      createInitialValueProgress(activeDeck),
    )
    const onClose = vi.fn()

    renderAllValues(
      rankedValues.map((value, index) =>
        index < 1
          ? {
              ...value,
              progress: {
                ...value.progress,
                totalXp: value.progress.totalXp + 2,
                profileComparisons: value.progress.profileComparisons + 2,
                profileWins: value.progress.profileWins + 2,
              },
            }
          : value,
      ),
      { onClose },
    )

    expect(screen.getAllByText("Top Five")).toHaveLength(1)
    for (const medal of ["🥇", "🥈", "🥉"]) {
      expect(screen.getAllByText(medal)).toHaveLength(5)
    }
    expect(screen.getByText("Rank 5, gold medal")).toBeInTheDocument()
    expect(screen.getByText("Rank 6, silver medal")).toBeInTheDocument()
    expect(screen.getByText("Rank 10, silver medal")).toBeInTheDocument()
    expect(screen.getByText("Rank 11, bronze medal")).toBeInTheDocument()
    expect(screen.getByText("Rank 15, bronze medal")).toBeInTheDocument()
    expect(screen.getByText("Rank 16")).toBeInTheDocument()
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search All Values" }),
      {
        target: { value: getValueDisplayName(rankedValues[5].definition) },
      },
    )
    expect(screen.getByText("#6")).toBeVisible()
    expect(screen.getByText("🥈")).toBeVisible()
    expect(screen.queryByText("🥇")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("closes through Escape and keeps long value cells overflow-safe", () => {
    const onClose = vi.fn()

    renderAllValues(undefined, { onClose })

    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)

    screen.getAllByRole("listitem").forEach((listItem) => {
      expect(listItem).toHaveClass("overflow-x-auto", "overflow-y-auto")
    })
    screen.getAllByText(/^“/).forEach((definitionCopy) => {
      expect(definitionCopy).toHaveClass(
        "overflow-x-auto",
        "overflow-y-auto",
        "break-words",
      )
    })
  })

  it("reports when a literal search has no matching value or definition", () => {
    renderAllValues()

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search All Values" }),
      { target: { value: "zzzz-no-match" } },
    )

    expect(screen.getByText("No values match your search.")).toBeVisible()
    expect(screen.queryAllByRole("listitem")).toHaveLength(0)
  })
})
