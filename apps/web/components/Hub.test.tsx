import { createActiveDeck } from "@game/data/src/ActiveDeck"
import {
  createSeethingSwarmTypographyOnlyRuntimeClipCatalog,
  type SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  createCustomValueId,
  getValueDisplayDefinition,
  getValueDisplayName,
  type CustomValueDefinition,
  type ValueId,
} from "@game/data/src/Value"
import {
  createInitialValueProgress,
  createValueProgress,
} from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import { VALUE_TO_ANIMAL_MAP } from "@game/data/src/ValueToAnimalMap"
import { ZOO_ANIMALS } from "@game/data/src/ZooAnimals"
import {
  createBattleCycleCandidate,
  createInitialBattleCycle,
} from "@game/machines/src/BattleCycle"
import { projectScheduledPair } from "@game/machines/src/PairScheduler"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import type { StaticImageData } from "next/image"
import { describe, expect, it, vi } from "vitest"
import Hub from "./Hub"

const animalPresentationProps = Object.freeze({
  runtimeClipCatalog: createSeethingSwarmTypographyOnlyRuntimeClipCatalog(),
  shouldReduceMotion: false,
})
const licensedRuntimeClipCatalog = Object.freeze({
  mode: "licensed",
  evidenceSnapshotId: "seethingswarm-animals:hub-integration-test",
  animals: Object.freeze(
    ZOO_ANIMALS.map(({ id }) =>
      Object.freeze({
        animalId: id,
        characterClips: Object.freeze([
          Object.freeze({
            kind: "character",
            animalId: id,
            animationId: "idle",
            relativePath: `${id}/idle.png`,
            frameWidth: 1,
            frameHeight: 1,
            frameCount: 1,
            visibleBounds: Object.freeze({
              left: 0,
              top: 0,
              width: 1,
              height: 1,
            }),
            asset: Object.freeze({
              src: `/test-animals/${encodeURIComponent(id)}.png`,
              width: 1,
              height: 1,
            }),
          }),
        ]),
        auxiliaryEffectClips: Object.freeze([]),
      }),
    ),
  ),
  characterClipCount: ZOO_ANIMALS.length,
  auxiliaryEffectClipCount: 0,
}) satisfies SeethingSwarmRuntimeClipCatalog<StaticImageData>

function getMappedAnimalId(valueId: ValueId) {
  const mapping = VALUE_TO_ANIMAL_MAP.find(
    ({ valueId: mappedValueId }) => mappedValueId === valueId,
  )
  if (!mapping) throw new Error(`Missing test animal mapping for ${valueId}`)
  return mapping.animalId
}

function createCustomRankedValues() {
  const customValue = Object.freeze({
    kind: "custom",
    id: createCustomValueId("custom:00000000-0000-4000-8000-000000000777"),
    name: "🧠 Curiosity",
    definition: "Keep asking why and how.",
    creationOrdinal: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  }) satisfies CustomValueDefinition
  const activeDeck = createActiveDeck([customValue])
  const progressById = new Map(createInitialValueProgress(activeDeck))
  progressById.set(
    customValue.id,
    createValueProgress(customValue.id, {
      totalXp: 100,
      profileWins: 1,
      profileComparisons: 1,
      currentCycleWins: 1,
    }),
  )
  return Object.freeze({
    customValue,
    rankedValues: rankValues(activeDeck, progressById),
  })
}

describe("Hub Component Integration", () => {
  it("retains the loaded animal while focus attention loads, then returns to calm on blur", async () => {
    const runtimeClipCatalog = {
      ...licensedRuntimeClipCatalog,
      animals: licensedRuntimeClipCatalog.animals.map((animal) => ({
        ...animal,
        characterClips: ["idle", "alerted", "dance"].map((animationId) => ({
          ...animal.characterClips[0],
          animationId,
          relativePath: `${animal.animalId}/${animationId}.png`,
          asset: {
            ...animal.characterClips[0].asset,
            src: `/test-animals/${animal.animalId}-${animationId}.png`,
          },
        })),
      })),
      characterClipCount: ZOO_ANIMALS.length * 3,
    } satisfies SeethingSwarmRuntimeClipCatalog<StaticImageData>
    const cycle = createInitialBattleCycle("hub-attention")
    render(
      <Hub
        runtimeClipCatalog={runtimeClipCatalog}
        rankedValues={rankValues(cycle.activeDeck, cycle.progressById)}
        dataNotice={null}
        shouldReduceMotion={false}
        onBrowseAllValues={vi.fn()}
        onAddCustomValue={vi.fn()}
        onOpenMenu={vi.fn()}
        onOpenValue={vi.fn()}
        onStartBattle={vi.fn()}
      />,
    )
    const row = screen.getAllByRole("listitem")[0]
    const button = within(row).getByRole("button")
    const images = row.querySelectorAll("img")
    const idle = [...images].find((image) =>
      image.getAttribute("src")?.includes("-idle.png"),
    )!
    const alerted = [...images].find((image) =>
      image.getAttribute("src")?.includes("-alerted.png"),
    )!
    fireEvent.load(idle)
    fireEvent.focus(button)
    expect(idle.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "true",
    )
    expect(alerted.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "false",
    )
    fireEvent.load(alerted)
    await waitFor(() =>
      expect(alerted.closest("[data-hub-active-clip]")).toHaveAttribute(
        "data-hub-active-clip",
        "true",
      ),
    )
    fireEvent.blur(button)
    expect(idle.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "true",
    )
    fireEvent.error(alerted)
    fireEvent.focus(button)
    expect(alerted.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "false",
    )
    expect(row.querySelector('[data-hub-active-clip="true"] img')).toBeVisible()
  })
  it("shows every included value alphabetically before the first comparison", () => {
    const battleCycle = createInitialBattleCycle("empty-hub-seed")
    const onBrowseAllValues = vi.fn()
    const onAddCustomValue = vi.fn()
    const onOpenValue = vi.fn()

    const hubProps = {
      ...animalPresentationProps,
      dataNotice: null,
      onBrowseAllValues,
      onAddCustomValue,
      onOpenMenu: vi.fn(),
      onOpenValue,
      onStartBattle: vi.fn(),
    }
    const currentRanking = rankValues(
      battleCycle.activeDeck,
      battleCycle.progressById,
    )
    const { container, rerender } = render(
      <Hub {...hubProps} rankedValues={currentRanking} />,
    )

    expect(screen.getByRole("main")).toHaveAttribute(
      "data-slot",
      "mapache-screen",
    )
    expect(screen.getByRole("main")).toHaveClass(
      "min-h-[100dvh]",
      "[--mapache-screen-spacing:1rem]",
      "xl:[--mapache-screen-spacing:2rem]",
    )
    expect(
      screen.getByRole("heading", { name: "Your Values", level: 1 }),
    ).toBeVisible()
    expect(screen.getByText("Included Values")).toBeVisible()
    expect(screen.getByText(/Not ranked yet\./)).toBeVisible()
    expect(container.querySelector("[data-value-presentation]")).toBeNull()
    expect(container.querySelector("[data-animal-id]")).toBeNull()
    expect(screen.queryByText(/^Rank \d/)).not.toBeInTheDocument()
    expect(screen.queryByText(/🥇|🥈|🥉/)).not.toBeInTheDocument()
    const [winnerId] = projectScheduledPair(
      battleCycle.activeDeck,
      battleCycle.scheduler,
    ).pair
    const comparedCycle = createBattleCycleCandidate({
      battleCycle,
      winnerId,
      expectedScheduler: battleCycle.scheduler,
    })
    rerender(
      <Hub
        {...hubProps}
        rankedValues={rankValues(
          comparedCycle.activeDeck,
          comparedCycle.progressById,
        )}
      />,
    )
    expect(screen.getAllByText("🥇")).toHaveLength(5)
    rerender(<Hub {...hubProps} rankedValues={currentRanking} />)
    expect(screen.queryByText(/🥇|🥈|🥉/)).not.toBeInTheDocument()
    const firstRow = screen.getAllByRole("listitem")[0]
    expect(within(firstRow).getByText("Acceptance")).toBeVisible()
  })

  it("renders all fresh rows without fabricated ranks and exposes the action rail", () => {
    const battleCycle = createInitialBattleCycle("fresh-hub-seed")

    const { container } = render(
      <Hub
        {...animalPresentationProps}
        runtimeClipCatalog={licensedRuntimeClipCatalog}
        rankedValues={rankValues(
          battleCycle.activeDeck,
          battleCycle.progressById,
        )}
        dataNotice={null}
        onBrowseAllValues={vi.fn()}
        onAddCustomValue={vi.fn()}
        onOpenMenu={vi.fn()}
        onOpenValue={vi.fn()}
        onStartBattle={vi.fn()}
      />,
    )

    const roster = screen.getByRole("region", { name: "Value roster" })
    expect(within(roster).getAllByRole("listitem")).toHaveLength(100)
    expect(container.querySelectorAll("[data-animal-id]")).toHaveLength(100)
    expect(within(roster).queryByRole("button", { name: "Battle" })).toBeNull()
    for (const definition of battleCycle.activeDeck.values) {
      expect(
        within(roster).getByText(getValueDisplayDefinition(definition)),
      ).toBeVisible()
    }
    expect(screen.queryByText("#1")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Browse All Values" }),
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: "Add Custom Value" }),
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "Menu" })).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Achievements" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Import & Export" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Battle" })).toBeVisible()
    const valueActions = screen.getByRole("navigation", {
      name: "Value actions",
    })
    expect(
      within(valueActions)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Battle", "Browse All Values", "Add Custom Value"])
    expect(
      within(valueActions).queryByRole("button", { name: "Menu" }),
    ).not.toBeInTheDocument()
  })

  it("renders the earned Top Five and full ranked list after a comparison", () => {
    const onBrowseAllValues = vi.fn()
    const onAddCustomValue = vi.fn()
    const onOpenValue = vi.fn()
    const initialBattleCycle = createInitialBattleCycle("ranked-hub-seed")
    const [winnerId] = projectScheduledPair(
      initialBattleCycle.activeDeck,
      initialBattleCycle.scheduler,
    ).pair
    const battleCycle = createBattleCycleCandidate({
      battleCycle: initialBattleCycle,
      winnerId,
      expectedScheduler: initialBattleCycle.scheduler,
    })
    const winner = battleCycle.activeDeck.values.find(
      ({ id }) => id === winnerId,
    )
    if (!winner) {
      throw new Error("Winner definition is missing")
    }

    const { container } = render(
      <Hub
        {...animalPresentationProps}
        rankedValues={rankValues(
          battleCycle.activeDeck,
          battleCycle.progressById,
        )}
        dataNotice={null}
        onBrowseAllValues={onBrowseAllValues}
        onAddCustomValue={onAddCustomValue}
        onOpenMenu={vi.fn()}
        onOpenValue={onOpenValue}
        onStartBattle={vi.fn()}
      />,
    )

    expect(screen.getByRole("heading", { name: "Top Five" })).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "All Other Values" }),
    ).toBeVisible()
    expect(screen.getAllByRole("listitem")).toHaveLength(100)
    expect(
      screen.getByRole("button", {
        name: `Open ${getValueDisplayName(winner)} in All Values`,
      }),
    ).toBeVisible()
    expect(
      screen.getByRole("button", {
        name: `Open ${getValueDisplayName(winner)} in All Values`,
      }),
    ).toHaveAccessibleDescription("Rank 1, gold medal")
    for (const medal of ["🥇", "🥈", "🥉"]) {
      expect(screen.getAllByText(medal)).toHaveLength(5)
    }
    expect(screen.getByText("Level 3")).toBeVisible()
    expect(
      container.querySelectorAll('[data-value-presentation="typography-only"]'),
    ).toHaveLength(100)
    expect(container.querySelector("[data-animal-id]")).toBeNull()
  })

  it("renders mapped animals throughout the roster and propagates Reduced Motion", () => {
    const initialBattleCycle = createInitialBattleCycle("animal-hub-seed")
    const [winnerId] = projectScheduledPair(
      initialBattleCycle.activeDeck,
      initialBattleCycle.scheduler,
    ).pair
    const battleCycle = createBattleCycleCandidate({
      battleCycle: initialBattleCycle,
      winnerId,
      expectedScheduler: initialBattleCycle.scheduler,
    })
    const rankedValues = rankValues(
      battleCycle.activeDeck,
      battleCycle.progressById,
    )
    const { container } = render(
      <Hub
        rankedValues={rankedValues}
        runtimeClipCatalog={licensedRuntimeClipCatalog}
        dataNotice={null}
        shouldReduceMotion
        onBrowseAllValues={vi.fn()}
        onAddCustomValue={vi.fn()}
        onOpenMenu={vi.fn()}
        onOpenValue={vi.fn()}
        onStartBattle={vi.fn()}
      />,
    )

    const animalPresentations = [
      ...container.querySelectorAll('[data-value-presentation="animal"]'),
    ]
    expect(animalPresentations).toHaveLength(100)
    for (const animalPresentation of animalPresentations) {
      expect(animalPresentation).toHaveAttribute("aria-hidden", "true")
      expect(animalPresentation).not.toHaveAttribute("tabindex")
    }
    expect(
      [...container.querySelectorAll("[data-animal-id]")].map((element) =>
        element.getAttribute("data-animal-id"),
      ),
    ).toEqual(
      rankedValues.map(({ definition }) => getMappedAnimalId(definition.id)),
    )
    expect(
      container.querySelectorAll('[data-reduced-motion="true"]'),
    ).toHaveLength(100)
    expect(screen.getAllByText(/^Rank \d+(, \w+ medal)?$/)).toHaveLength(100)
    const sixthValue = rankedValues[5]
    const sixthValueButton = screen.getByRole("button", {
      name: `Open ${getValueDisplayName(sixthValue.definition)} in All Values`,
    })
    expect(sixthValueButton).toHaveAccessibleDescription("Rank 6, silver medal")
    expect(within(sixthValueButton).getByText("🥈")).toBeVisible()
    expect(sixthValueButton.querySelector("[data-animal-id]")).not.toBeNull()
    const failedPresentation = animalPresentations[0]
    const failedImage = failedPresentation.querySelector("img")
    if (!failedImage) throw new Error("Expected the first ranked animal image")
    fireEvent.error(failedImage)
    expect(failedPresentation.querySelector("img")).toBeNull()
    expect(failedPresentation).toHaveTextContent("#1")
    expect(screen.getAllByText(/^Rank \d+(, \w+ medal)?$/)).toHaveLength(100)
    expect(screen.getAllByText("🥇")).toHaveLength(5)
  })

  it("renders an equal Custom Value initial tile without inferring an animal", () => {
    const onOpenValue = vi.fn()
    const { customValue, rankedValues } = createCustomRankedValues()
    const { container } = render(
      <Hub
        rankedValues={rankedValues}
        runtimeClipCatalog={licensedRuntimeClipCatalog}
        dataNotice={null}
        shouldReduceMotion={false}
        onBrowseAllValues={vi.fn()}
        onAddCustomValue={vi.fn()}
        onOpenMenu={vi.fn()}
        onOpenValue={onOpenValue}
        onStartBattle={vi.fn()}
      />,
    )

    const customValueButton = screen.getByRole("button", {
      name: "Open 🧠 Curiosity in All Values",
    })
    const customValueTile = customValueButton.querySelector<HTMLElement>(
      '[data-value-presentation="custom-initial"]',
    )
    if (!customValueTile) throw new Error("Custom Value tile is missing")
    expect(customValueTile).toHaveClass("h-[72px]", "w-[72px]")
    expect(customValueTile).toHaveAttribute("aria-hidden", "true")
    expect(within(customValueTile).getByText("🧠")).toBeVisible()
    expect(customValueButton).toHaveAccessibleDescription("Rank 1, gold medal")
    expect(within(customValueButton).getByText("🥇")).toBeVisible()
    expect(customValueTile.querySelector("[data-animal-id]")).toBeNull()
    expect(
      container.querySelectorAll('[data-value-presentation="animal"]'),
    ).toHaveLength(100)

    fireEvent.click(customValueButton)
    expect(onOpenValue).toHaveBeenCalledWith(
      customValue.id,
      `hub-value-${customValue.id}-button`,
    )
  })

  it("routes action and row presses with stable focus target identifiers", () => {
    const onBrowseAllValues = vi.fn()
    const onAddCustomValue = vi.fn()
    const onOpenMenu = vi.fn()
    const onOpenValue = vi.fn()
    const battleCycle = createInitialBattleCycle("action-hub-seed")

    render(
      <Hub
        {...animalPresentationProps}
        rankedValues={rankValues(
          battleCycle.activeDeck,
          battleCycle.progressById,
        )}
        dataNotice={null}
        onBrowseAllValues={onBrowseAllValues}
        onAddCustomValue={onAddCustomValue}
        onOpenMenu={onOpenMenu}
        onOpenValue={onOpenValue}
        onStartBattle={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Browse All Values" }))
    fireEvent.click(screen.getByRole("button", { name: "Add Custom Value" }))
    fireEvent.click(screen.getByRole("button", { name: "Menu" }))
    fireEvent.click(
      screen.getByRole("button", { name: "Open Acceptance in All Values" }),
    )

    expect(onBrowseAllValues).toHaveBeenCalledWith(
      "hub-browse-all-values-button",
    )
    expect(onAddCustomValue).toHaveBeenCalledWith("hub-add-custom-value-button")
    expect(onOpenMenu).toHaveBeenCalledOnce()
    expect(onOpenValue).toHaveBeenCalledWith(
      "pvcs-2011:acceptance",
      "hub-value-pvcs-2011:acceptance-button",
    )
  })

  it("announces a restored backup while keeping every value visible", () => {
    const battleCycle = createInitialBattleCycle("restored-hub-seed")

    render(
      <Hub
        {...animalPresentationProps}
        rankedValues={rankValues(
          battleCycle.activeDeck,
          battleCycle.progressById,
        )}
        dataNotice="Backup restored. Your imported progress is ready."
        onBrowseAllValues={vi.fn()}
        onAddCustomValue={vi.fn()}
        onOpenMenu={vi.fn()}
        onOpenValue={vi.fn()}
        onStartBattle={vi.fn()}
      />,
    )

    expect(
      screen.getByText("Backup restored. Your imported progress is ready."),
    ).toBeVisible()
    expect(screen.getAllByRole("listitem")).toHaveLength(100)
  })
})
