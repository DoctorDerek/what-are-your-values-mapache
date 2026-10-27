import { createActiveDeck, type ActiveDeck } from "@game/data/src/ActiveDeck"
import { CANONICAL_VALUES } from "@game/data/src/CanonicalValues"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
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
import { resolveValueAnimalId } from "@game/data/src/ValueAnimalAssociation"
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
import { afterEach, describe, expect, it, vi } from "vitest"
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
      onAddCustomValue={vi.fn()}
      onUpdateCustomValue={vi.fn()}
      onDeleteCustomValue={vi.fn()}
      {...overrides}
    />,
  )
}

function createLicensedRuntimeClipCatalog() {
  return {
    mode: "licensed",
    evidenceSnapshotId: "all-values-attention-test",
    animals: ZOO_ANIMALS.map(({ id }) => ({
      animalId: id,
      characterClips: [
        id === "bat" ? "idle_upright" : "idle",
        "crouch",
        "jump",
        "fall",
        "land",
      ].map((animationId) => ({
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
        animationId: id === "bat" ? "idle_upright" : "idle",
        frameIndex: 0,
        bounds: Object.freeze({ left: 0, top: 0, width: 1, height: 1 }),
        anchor: Object.freeze({ x: 0.5, y: 1 }),
      }),
    })),
    characterClipCount: ZOO_ANIMALS.length * 5,
    auxiliaryEffectClipCount: 0,
  } satisfies SeethingSwarmRuntimeClipCatalog<StaticImageData>
}

function findLegacyCustomRow() {
  return screen
    .getAllByRole("listitem")
    .find(
      (row) =>
        within(row).queryByText("Ingenuity", { exact: true }) &&
        within(row).queryByRole("button", { name: "Edit" }),
    )
}

describe("All Values Component Integration", () => {
  it("renders and searches the selected value copy while retaining English search aliases", () => {
    const english = getLocaleCatalog()
    const source = CANONICAL_VALUES[0]
    const values = new Map(english.values)
    values.set(source.id, {
      name: "⟦Localized value⟧",
      definition: "⟦Localized meaning⟧",
    })
    renderAllValues(undefined, { localization: { ...english, values } })
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "localized" },
    })
    expect(screen.getByText("⟦Localized value⟧")).toBeVisible()
    expect(screen.getByText(/⟦Localized meaning⟧/)).toBeVisible()
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: source.englishName },
    })
    expect(screen.getByText("⟦Localized value⟧")).toBeVisible()
  })

  afterEach(() => vi.restoreAllMocks())
  it("retains calm art until attention is ready and preserves focus while the pointer leaves", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      false,
    )
    const runtimeClipCatalog = createLicensedRuntimeClipCatalog()
    renderAllValues(undefined, { runtimeClipCatalog })
    const row = screen.getAllByRole("listitem")[0]
    const idle = row.querySelector<HTMLImageElement>('img[src$="-idle.png"]')!
    const crouch = row.querySelector<HTMLImageElement>(
      'img[src$="-crouch.png"]',
    )!
    const active = () => row.querySelector('[data-hub-active-clip="true"] img')
    expect(idle).toHaveAttribute("loading", "lazy")
    expect(crouch).toHaveAttribute("loading", "lazy")
    fireEvent.load(idle)
    await waitFor(() => expect(crouch).toHaveAttribute("loading", "eager"))
    fireEvent.pointerEnter(row, { pointerType: "mouse" })
    expect(active()).toBe(idle)
    fireEvent.load(crouch)
    await waitFor(() => expect(active()).toBe(crouch))
    fireEvent.focus(row)
    fireEvent.pointerLeave(row)
    expect(active()).toBe(crouch)
    fireEvent.blur(row, { relatedTarget: within(row).getByRole("heading") })
    expect(active()).toBe(crouch)
    for (const image of row.querySelectorAll("img")) fireEvent.load(image)
    fireEvent.animationEnd(crouch)
    expect(row.querySelector('img[src$="-jump.png"]')).toBeNull()
    await waitFor(() => expect(active()).toBe(idle))
    fireEvent.blur(row)
    fireEvent.pointerEnter(row, { pointerType: "touch" })
    expect(active()).toBe(idle)
    fireEvent.pointerEnter(row, { pointerType: "mouse" })
    await waitFor(() => expect(active()).toBe(crouch))
    fireEvent.pointerCancel(row)
    await waitFor(() => expect(active()).toBe(idle))
  })
  it("shows every fresh value alphabetically with definitions visible and no fabricated Top Five", () => {
    const rankedValues = createRankedValues(createActiveDeck([]))

    renderAllValues(rankedValues)
    expect(
      screen.queryAllByRole("presentation", { hidden: true }),
    ).toHaveLength(0)

    expect(screen.getByRole("main")).toHaveAttribute(
      "data-slot",
      "mapache-screen",
    )
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

  it("shows a Custom Value’s battle-assigned animal alongside its authored definition", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    renderAllValues(createRankedValues(activeDeck), {
      runtimeClipCatalog: createLicensedRuntimeClipCatalog(),
    })

    const customRow = findLegacyCustomRow()
    expect(customRow).not.toBeNull()
    expect(customRow?.querySelector("[data-animal-id]")).toHaveAttribute(
      "data-animal-id",
      resolveValueAnimalId(activeDeck.customValues[0]!.id),
    )
    expect(
      within(customRow!).getByText("“Ability to solve problems creatively.”"),
    ).toBeVisible()
  })

  it("hands creation to the Hub instead of rendering a second builder", () => {
    const onAddCustomValue = vi.fn()
    renderAllValues(undefined, { onAddCustomValue })
    fireEvent.click(screen.getByRole("button", { name: "Add value" }))
    expect(onAddCustomValue).toHaveBeenCalledExactlyOnceWith("")
    expect(
      screen.queryByRole("form", { name: "Add Custom Value" }),
    ).not.toBeInTheDocument()
  })

  it("carries an unmatched search name to the Hub editor", () => {
    const onAddCustomValue = vi.fn()
    renderAllValues(undefined, { onAddCustomValue })
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search All Values" }),
      {
        target: { value: "Craftsmanship" },
      },
    )
    fireEvent.click(screen.getByRole("button", { name: "Add value" }))
    expect(onAddCustomValue).toHaveBeenCalledExactlyOnceWith("Craftsmanship")
  })

  it("locks navigation and creation while persistence is pending", () => {
    renderAllValues(undefined, { isPersistencePending: true })
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Add value" })).toBeDisabled()
  })

  it("isolates an edit, retains its draft through review Back, and saves only the confirmed values", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    const onUpdateCustomValue = vi.fn()
    const onClose = vi.fn()
    renderAllValues(createRankedValues(activeDeck), {
      onUpdateCustomValue,
      onClose,
    })
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Ingenuity" },
    })
    const row = findLegacyCustomRow()
    if (!row) throw new Error("Expected custom value row")
    fireEvent.click(within(row).getByRole("button", { name: "Edit" }))
    expect(screen.getByLabelText("Value Name")).toHaveFocus()
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Add value" }),
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: " Curiosity Engine " },
    })
    fireEvent.change(screen.getByLabelText("What This Value Means to Me"), {
      target: { value: "  A drive to explore how things connect. " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Review Update" }))
    expect(
      screen.getByRole("heading", { name: "Update Curiosity Engine?" }),
    ).toHaveFocus()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(onUpdateCustomValue).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByLabelText("Value Name")).toHaveValue(
      " Curiosity Engine ",
    )
    expect(screen.getByLabelText("What This Value Means to Me")).toHaveValue(
      "  A drive to explore how things connect. ",
    )
    expect(screen.getByLabelText("Value Name")).toHaveFocus()
    fireEvent.click(screen.getByRole("button", { name: "Review Update" }))
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.getByLabelText("Value Name")).toHaveValue(
      " Curiosity Engine ",
    )
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Review Update" }))
    fireEvent.click(screen.getByRole("button", { name: "Update Value" }))
    expect(onUpdateCustomValue).toHaveBeenCalledExactlyOnceWith(
      activeDeck.customValues[0].id,
      "Curiosity Engine",
      "A drive to explore how things connect.",
    )
  })

  it("cancels without saving and restores the filtered browse action and persisted fields", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    const onUpdateCustomValue = vi.fn()
    renderAllValues(createRankedValues(activeDeck), { onUpdateCustomValue })
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Ingenuity" },
    })
    const row = findLegacyCustomRow()
    if (!row) throw new Error("Expected custom value row")
    fireEvent.click(within(row).getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "Unsaved idea" },
    })
    fireEvent.change(screen.getByLabelText("What This Value Means to Me"), {
      target: { value: "Purpose\u202e" },
    })
    fireEvent.blur(screen.getByLabelText("What This Value Means to Me"))
    expect(screen.getByRole("button", { name: "Review Update" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByRole("searchbox")).toHaveValue("Ingenuity")
    const returnedRow = findLegacyCustomRow()
    if (!returnedRow) throw new Error("Expected restored custom value row")
    expect(
      within(returnedRow).getByRole("button", { name: "Edit" }),
    ).toHaveFocus()
    fireEvent.click(within(returnedRow).getByRole("button", { name: "Edit" }))
    expect(screen.getByLabelText("Value Name")).toHaveValue("Ingenuity")
    expect(screen.getByLabelText("What This Value Means to Me")).toHaveValue(
      "Ability to solve problems creatively.",
    )
    expect(onUpdateCustomValue).not.toHaveBeenCalled()
  })

  it("revalidates a reviewed draft after returning to edit", () => {
    const onUpdateCustomValue = vi.fn()
    renderAllValues(createRankedValues(createActiveDeckWithIngenuity()), {
      onUpdateCustomValue,
    })
    const row = findLegacyCustomRow()
    if (!row) throw new Error("Expected custom value row")
    fireEvent.click(within(row).getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "Curiosity Engine" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Review Update" }))
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    fireEvent.change(screen.getByLabelText("Value Name"), {
      target: { value: "" },
    })
    fireEvent.submit(screen.getByRole("form"))
    expect(screen.getByRole("button", { name: "Review Update" })).toBeDisabled()
    expect(
      screen.queryByRole("button", { name: "Update Value" }),
    ).not.toBeInTheDocument()
    expect(onUpdateCustomValue).not.toHaveBeenCalled()
  })

  it("focuses deletion, restores its initiating action on Cancel, and deletes only on confirmation", () => {
    const activeDeck = createActiveDeckWithIngenuity()
    const onDeleteCustomValue = vi.fn()
    renderAllValues(createRankedValues(activeDeck), { onDeleteCustomValue })
    const row = findLegacyCustomRow()
    if (!row) throw new Error("Expected custom value row")
    fireEvent.click(within(row).getByRole("button", { name: "Delete" }))
    expect(
      screen.getByRole("heading", { name: "Remove Ingenuity?" }),
    ).toHaveFocus()
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    const returnedRow = findLegacyCustomRow()
    if (!returnedRow) throw new Error("Expected restored custom value row")
    expect(
      within(returnedRow).getByRole("button", { name: "Delete" }),
    ).toHaveFocus()
    expect(onDeleteCustomValue).not.toHaveBeenCalled()
    fireEvent.click(within(returnedRow).getByRole("button", { name: "Delete" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete Value" }))
    expect(onDeleteCustomValue).toHaveBeenCalledExactlyOnceWith(
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

    const targetListItem = findLegacyCustomRow()
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
    for (let rank = 1; rank <= 15; rank++) {
      const color = rank <= 5 ? "gold" : rank <= 10 ? "silver" : "bronze"
      const row = screen.getByText(`Rank ${rank}, ${color} medal`).closest("li")
      expect(row?.querySelector("img")).toHaveAttribute(
        "src",
        expect.stringContaining(`${color}.png`),
      )
      expect(row?.querySelector("img")).toHaveAttribute("aria-hidden", "true")
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
    const medal = screen.getByRole("listitem").querySelector("img")
    expect(medal).toBeVisible()
    expect(medal).toHaveAttribute("src", expect.stringContaining("silver.png"))
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
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
