import { createActiveDeck } from "@game/data/src/ActiveDeck"
import {
  createCustomValueId,
  type CustomValueDefinition,
} from "@game/data/src/Value"
import { createInitialValueProgress } from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import CustomValueInvitation from "@/components/CustomValueInvitation"
import { createSeethingSwarmTestCatalogForAnimals } from "@/components/SeethingSwarmBattleStage.test-fixture"

function options(customValues: readonly CustomValueDefinition[] = []) {
  const deck = createActiveDeck(customValues)
  return {
    editorRequestId: 1,
    deckRevision: 0,
    existingCustomValues: customValues,
    rankedValues: rankValues(deck, createInitialValueProgress(deck)),
    runtimeClipCatalog: createSeethingSwarmTestCatalogForAnimals([
      "catset/cat04_light_gray",
    ]),
    shouldReduceMotion: false,
    isSaving: false,
    saveIssue: null,
    onApply: vi.fn(),
    onExport: vi.fn(async () => {}),
    onExit: vi.fn(),
    onNavigationBlockedChange: vi.fn(),
  }
}

describe("custom-value matching presentation", () => {
  it.each([false, true])(
    "reuses regular animal playback and preserves informational rows with reduced motion %s",
    async (shouldReduceMotion) => {
      const props = options()
      render(
        <CustomValueInvitation
          {...props}
          shouldReduceMotion={shouldReduceMotion}
        />,
      )
      fireEvent.change(screen.getByLabelText("Value name"), {
        target: { value: "Accept" },
      })
      const section = screen.getByRole("region", { name: "Matching values" })
      expect(
        within(section).getByRole("heading", { name: "Acceptance" }),
      ).toBeVisible()
      expect(
        within(section).getByText("“to be accepted as I am”"),
      ).toBeVisible()
      expect(
        within(section).getByRole("heading", { name: "Self-Acceptance" }),
      ).toBeVisible()
      expect(
        within(section).getByText("“to accept myself as I am”"),
      ).toBeVisible()
      for (const image of section.querySelectorAll("img")) fireEvent.load(image)
      const activeAnimals = () =>
        section.querySelectorAll(
          '[data-hub-active-clip="true"] [data-animal-id]',
        )
      await waitFor(() => {
        for (const animal of activeAnimals())
          expect(animal).toHaveAttribute(
            "data-playback-mode",
            shouldReduceMotion ? "static" : "loop",
          )
      })
      const animals = activeAnimals()
      expect(animals).toHaveLength(2)
      for (const animal of animals) {
        expect(animal).toHaveAttribute(
          "data-animal-id",
          "catset/cat04_light_gray",
        )
        expect(animal).toHaveAttribute(
          "data-playback-mode",
          shouldReduceMotion ? "static" : "loop",
        )
        expect(animal).toHaveAttribute("aria-hidden", "true")
      }
      expect(section.querySelector("a,button,[tabindex='0']")).toBeNull()
      expect(within(section).queryByText(/Level \d|XP/)).not.toBeInTheDocument()
      const row = within(section).getAllByRole("listitem")[0]!
      const activeImage = () =>
        row.querySelector<HTMLImageElement>(
          '[data-hub-active-clip="true"] img',
        )!
      const calm = activeImage()
      fireEvent.pointerEnter(row, { pointerType: "mouse" })
      for (const image of row.querySelectorAll("img")) fireEvent.load(image)
      if (shouldReduceMotion) {
        expect(activeImage()).toBe(calm)
      } else {
        await waitFor(() => expect(activeImage()).not.toBe(calm))
        expect(activeImage().closest("[data-animal-id]")).toHaveAttribute(
          "data-playback-mode",
          "one-shot",
        )
        fireEvent.animationEnd(activeImage())
        await waitFor(() => expect(activeImage()).toBe(calm))
      }
      fireEvent.pointerLeave(row)
      fireEvent.click(
        within(section).getByRole("heading", { name: "Acceptance" }),
      )
      expect(props.onExit).not.toHaveBeenCalled()
      expect(props.onApply).not.toHaveBeenCalled()
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    },
  )

  it("accepts intentional touch attention but not a scrolling or cancelled touch", async () => {
    const props = options()
    render(<CustomValueInvitation {...props} />)
    fireEvent.change(screen.getByLabelText("Value name"), {
      target: { value: "Accept" },
    })
    const section = screen.getByRole("region", { name: "Matching values" })
    const row = within(section).getAllByRole("listitem")[0]!
    for (const image of row.querySelectorAll("img")) fireEvent.load(image)
    const activeImage = () =>
      row.querySelector<HTMLImageElement>('[data-hub-active-clip="true"] img')!
    const calm = activeImage()
    const down = {
      pointerType: "touch",
      pointerId: 1,
      button: 0,
      clientX: 20,
      clientY: 20,
    }
    fireEvent.pointerDown(row, down)
    fireEvent.pointerMove(row, { ...down, clientY: 80 })
    fireEvent.pointerUp(row, { ...down, clientY: 80 })
    expect(activeImage()).toBe(calm)
    fireEvent.pointerDown(row, down)
    fireEvent.pointerCancel(row)
    fireEvent.pointerUp(row, down)
    expect(activeImage()).toBe(calm)
    fireEvent.pointerDown(row, down)
    fireEvent.pointerUp(row, down)
    for (const image of row.querySelectorAll("img")) fireEvent.load(image)
    await waitFor(() => expect(activeImage()).not.toBe(calm))
    expect(screen.getByLabelText("Value name")).toHaveValue("Accept")
    expect(props.onExit).not.toHaveBeenCalled()
    expect(props.onApply).not.toHaveBeenCalled()
  })

  it("keeps authoring usable when animal images fail", () => {
    const props = options()
    render(<CustomValueInvitation {...props} />)
    fireEvent.change(screen.getByLabelText("Value name"), {
      target: { value: "Accept" },
    })
    fireEvent.change(screen.getByLabelText("Definition"), {
      target: { value: "to welcome my own experiences" },
    })
    const section = screen.getByRole("region", { name: "Matching values" })
    for (const image of section.querySelectorAll("img")) fireEvent.error(image)
    expect(
      within(section).getByText("“to accept myself as I am”"),
    ).toBeVisible()
    expect(screen.getByLabelText("Value name")).toHaveValue("Accept")
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(props.onApply).toHaveBeenCalledExactlyOnceWith([
      { name: "Accept", definition: "to welcome my own experiences" },
    ])
    expect(props.onExit).not.toHaveBeenCalled()
  })

  it("keeps private custom names and definitions literal and works without licensed assets", () => {
    const custom = {
      kind: "custom",
      id: createCustomValueId("custom:00000000-0000-4000-8000-000000000450"),
      name: "Accept <myself>",
      definition: "<b>my own meaning</b>",
      creationOrdinal: 1,
      createdAt: "2026-11-14T00:00:00Z",
      updatedAt: "2026-11-14T00:00:00Z",
    } satisfies CustomValueDefinition
    const props = options([custom])
    render(
      <CustomValueInvitation
        {...props}
        runtimeClipCatalog={{ mode: "typography-only" }}
      />,
    )
    fireEvent.change(screen.getByLabelText("Value name"), {
      target: { value: "Accept" },
    })
    const section = screen.getByRole("region", { name: "Matching values" })
    expect(
      within(section).getByRole("heading", { name: custom.name }),
    ).toBeVisible()
    expect(within(section).getByText(`“${custom.definition}”`)).toBeVisible()
    expect(section.querySelector("b,img,a,button")).toBeNull()
    fireEvent.change(screen.getByLabelText("Value name"), {
      target: { value: "" },
    })
    expect(
      screen.queryByRole("region", { name: "Matching values" }),
    ).not.toBeInTheDocument()
  })
})
