import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
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
import { resolveValueAnimalId } from "@game/data/src/ValueAnimalAssociation"
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
import { afterEach, describe, expect, it, vi } from "vitest"
import Hub from "@/components/Hub"

vi.mock("@/components/Heroes99Hero", () => ({ default: () => <span>Your hero</span> }))

const animalPresentationProps = Object.freeze({
  appearance: DEFAULT_HEROES99_APPEARANCE,
  onCustomize: vi.fn(),
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
            animationId: id === "bat" ? "idle_upright" : "idle",
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
        referencePose: Object.freeze({
          animationId: id === "bat" ? "idle_upright" : "idle",
          frameIndex: 0,
          bounds: Object.freeze({ left: 0, top: 0, width: 1, height: 1 }),
          anchor: Object.freeze({ x: 0.5, y: 1 }),
        }),
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

function getHubPresentation(name: string) {
  const presentation = screen
    .getByText(name)
    .closest("li")?.querySelector<HTMLElement>('[id$="-presentation"]')
  if (!presentation) throw new Error("Hub value presentation is missing")
  return presentation
}

describe("Hub Component Integration", () => {
  afterEach(() => vi.restoreAllMocks())

  it("retains the loaded animal while hover attention loads, then returns to calm", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      false,
    )
    const runtimeClipCatalog = {
      ...licensedRuntimeClipCatalog,
      animals: licensedRuntimeClipCatalog.animals.map((animal) => ({
        ...animal,
        characterClips: [
          animal.animalId === "bat" ? "idle_upright" : "idle",
          "crouch",
          "jump",
          "fall",
          "land",
        ].map((animationId) => ({
          ...animal.characterClips[0],
          animationId,
          relativePath: `${animal.animalId}/${animationId}.png`,
          asset: {
            ...animal.characterClips[0].asset,
            src: `/test-animals/${animal.animalId}-${animationId}.png`,
          },
        })),
      })),
      characterClipCount: ZOO_ANIMALS.length * 5,
    } satisfies SeethingSwarmRuntimeClipCatalog<StaticImageData>
    const cycle = createInitialBattleCycle("hub-attention")
    render(
      <Hub
        {...animalPresentationProps}
        runtimeClipCatalog={runtimeClipCatalog}
        rankedValues={rankValues(cycle.activeDeck, cycle.progressById)}
        dataNotice={null}
        shouldReduceMotion={false}
        onBrowseAllValues={vi.fn()}
        onAddCustomValue={vi.fn()}
        onOpenMenu={vi.fn()}
        onStartBattle={vi.fn()}
      />,
    )
    const row = screen.getAllByRole("listitem")[0]
    const button = row.querySelector<HTMLElement>('[id$="-presentation"]')!
    const images = row.querySelectorAll("img")
    const idle = [...images].find((image) =>
      image.getAttribute("src")?.includes("-idle.png"),
    )!
    const crouch = [...images].find((image) =>
      image.getAttribute("src")?.includes("-crouch.png"),
    )!
    expect(idle).toHaveAttribute("loading", "lazy")
    expect(crouch).toHaveAttribute("loading", "lazy")
    fireEvent.load(idle)
    await waitFor(() => expect(crouch).toHaveAttribute("loading", "eager"))
    expect(idle).toHaveStyle({ "--animal-animation-duration": "160ms" })
    fireEvent.pointerEnter(button, { pointerType: "mouse" })
    expect(idle.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "true",
    )
    expect(crouch.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "false",
    )
    fireEvent.load(crouch)
    expect(crouch).toHaveStyle({ "--animal-animation-duration": "100ms" })
    await waitFor(() =>
      expect(crouch.closest("[data-hub-active-clip]")).toHaveAttribute(
        "data-hub-active-clip",
        "true",
      ),
    )
    expect(crouch.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "true",
    )
    for (const image of images) fireEvent.load(image)
    fireEvent.animationEnd(crouch)
    expect(
      [...images].some((image) =>
        image.getAttribute("src")?.includes("-jump.png"),
      ),
    ).toBe(false)
    await waitFor(() =>
      expect(idle.closest("[data-hub-active-clip]")).toHaveAttribute(
        "data-hub-active-clip",
        "true",
      ),
    )
    fireEvent.pointerCancel(button)
    expect(idle).toHaveStyle({ "--animal-animation-duration": "160ms" })
    fireEvent.pointerLeave(button)
    expect(idle.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "true",
    )
    fireEvent.error(crouch)
    fireEvent.pointerLeave(button)
    fireEvent.pointerEnter(button, { pointerType: "mouse" })
    expect(crouch.closest("[data-hub-active-clip]")).toHaveAttribute(
      "data-hub-active-clip",
      "false",
    )
    expect(row.querySelector('[data-hub-active-clip="true"] img')).toBeVisible()
  })
  it("previews included values without ranks before the first comparison", () => {
    const battleCycle = createInitialBattleCycle("empty-hub-seed")
    const onBrowseAllValues = vi.fn()
    const onAddCustomValue = vi.fn()

    const hubProps = {
      ...animalPresentationProps,
      dataNotice: null,
      onBrowseAllValues,
      onAddCustomValue,
      onOpenMenu: vi.fn(),
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
      screen.getByRole("heading", { name: "My Values", level: 1 }),
    ).toBeVisible()
    expect(screen.getByRole("list", { name: "Included values preview" })).toBeVisible()
    expect(screen.getByText(/Not ranked yet\./)).toBeVisible()
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
    expect(screen.getByText("#1")).toBeVisible()
    rerender(<Hub {...hubProps} rankedValues={currentRanking} />)
    expect(screen.queryByText(/🥇|🥈|🥉/)).not.toBeInTheDocument()
    const firstRow = screen.getAllByRole("listitem")[0]
    expect(within(firstRow).getByText("Acceptance")).toBeVisible()
  })

  it("renders five fresh values and exposes explicit actions without a fake share control", () => {
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
        onStartBattle={vi.fn()}
      />,
    )

    const roster = screen.getByRole("list", { name: "Included values preview" })
    expect(within(roster).getAllByRole("listitem")).toHaveLength(5)
    expect(container.querySelectorAll("[data-animal-id]")).toHaveLength(5)
    expect(within(roster).queryByRole("button", { name: "Battle" })).toBeNull()
    for (const definition of battleCycle.activeDeck.values.slice(0, 5)) {
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
    ).toEqual(["Battle", "Customize my card", "Browse All Values", "Add Custom Value"])
    expect(screen.queryByRole("button", { name: /Share/ })).toBeNull()
    expect(
      within(valueActions).queryByRole("button", { name: "Menu" }),
    ).not.toBeInTheDocument()
  })

  it("renders the earned Top Five with value definitions and levels", () => {
    const onBrowseAllValues = vi.fn()
    const onAddCustomValue = vi.fn()
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
        onStartBattle={vi.fn()}
      />,
    )

    expect(screen.getByRole("heading", { name: "My Top Five Values" })).toBeVisible()
    expect(screen.getAllByRole("listitem")).toHaveLength(5)
    expect(getHubPresentation(getValueDisplayName(winner))).toBeVisible()
    expect(screen.getByText("#1")).toBeVisible()
    expect(screen.getAllByText("Level 3").length).toBeGreaterThan(0)
    expect(
      container.querySelectorAll('[data-value-presentation="typography-only"]'),
    ).toHaveLength(0)
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
        {...animalPresentationProps}
        rankedValues={rankedValues}
        runtimeClipCatalog={licensedRuntimeClipCatalog}
        dataNotice={null}
        shouldReduceMotion
        onBrowseAllValues={vi.fn()}
        onAddCustomValue={vi.fn()}
        onOpenMenu={vi.fn()}
        onStartBattle={vi.fn()}
      />,
    )

    const animalPresentations = [
      ...container.querySelectorAll('[data-value-presentation="animal"]'),
    ]
    expect(animalPresentations).toHaveLength(5)
    for (const animalPresentation of animalPresentations) {
      expect(animalPresentation).toHaveAttribute("aria-hidden", "true")
      expect(animalPresentation).not.toHaveAttribute("tabindex")
    }
    expect(
      [...container.querySelectorAll("[data-animal-id]")].map((element) =>
        element.getAttribute("data-animal-id"),
      ),
    ).toEqual(
      rankedValues.slice(0, 5).map(({ definition }) => getMappedAnimalId(definition.id)),
    )
    expect(
      container.querySelectorAll('[data-reduced-motion="true"]'),
    ).toHaveLength(5)
    expect(screen.queryByText(getValueDisplayName(rankedValues[5].definition))).toBeNull()
    const failedPresentation = animalPresentations[0]
    const failedImage = failedPresentation.querySelector("img")
    if (!failedImage) throw new Error("Expected the first ranked animal image")
    fireEvent.error(failedImage)
    expect(failedPresentation.querySelector("img")).toBeNull()
    expect(screen.getByText("#1")).toBeVisible()
    expect(screen.getByText(getValueDisplayName(rankedValues[0].definition))).toBeVisible()
  })

  it("renders the battle-assigned animal for a Custom Value without incidental navigation", () => {
    const { customValue, rankedValues } = createCustomRankedValues()
    const { container } = render(
      <Hub
        {...animalPresentationProps}
        rankedValues={rankedValues}
        runtimeClipCatalog={licensedRuntimeClipCatalog}
        dataNotice={null}
        shouldReduceMotion={false}
        onBrowseAllValues={vi.fn()}
        onAddCustomValue={vi.fn()}
        onOpenMenu={vi.fn()}
        onStartBattle={vi.fn()}
      />,
    )

    const customValueButton = getHubPresentation("🧠 Curiosity")
    const customValueTile = customValueButton.querySelector<HTMLElement>(
      '[data-value-presentation="animal"]',
    )
    if (!customValueTile) throw new Error("Custom Value tile is missing")
    expect(customValueTile.querySelector("[style]")).toHaveStyle({
      "--portrait-width": "72px",
      "--portrait-height": "72px",
    })
    expect(customValueTile).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByText("#1")).toBeVisible()
    expect(customValueTile.querySelector("[data-animal-id]")).toHaveAttribute(
      "data-animal-id",
      resolveValueAnimalId(customValue.id),
    )
    expect(
      container.querySelectorAll('[data-value-presentation="animal"]'),
    ).toHaveLength(5)

    fireEvent.click(customValueButton)
    expect(
      screen.queryByRole("button", { name: /^Open .* in All Values$/ }),
    ).toBeNull()
  })

  it("routes explicit actions while value rows remain informational", () => {
    const onBrowseAllValues = vi.fn()
    const onAddCustomValue = vi.fn()
    const onOpenMenu = vi.fn()
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
        onStartBattle={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Browse All Values" }))
    fireEvent.click(screen.getByRole("button", { name: "Add Custom Value" }))
    fireEvent.click(screen.getByRole("button", { name: "Menu" }))
    fireEvent.click(screen.getByRole("button", { name: "Customize my card" }))
    fireEvent.click(getHubPresentation("Acceptance"))

    expect(onBrowseAllValues).toHaveBeenCalledWith(
      "hub-browse-all-values-button",
    )
    expect(onAddCustomValue).toHaveBeenCalledWith("hub-add-custom-value-button")
    expect(onOpenMenu).toHaveBeenCalledOnce()
    expect(animalPresentationProps.onCustomize).toHaveBeenCalledOnce()
    expect(
      screen.queryByRole("button", { name: /^Open .* in All Values$/ }),
    ).toBeNull()
  })

  it("announces a restored backup while retaining the personal card", () => {
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
        onStartBattle={vi.fn()}
      />,
    )

    expect(
      screen.getByText("Backup restored. Your imported progress is ready."),
    ).toBeVisible()
    expect(screen.getAllByRole("listitem")).toHaveLength(5)
  })
})
