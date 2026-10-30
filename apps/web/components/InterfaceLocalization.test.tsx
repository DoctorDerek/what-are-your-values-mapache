import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createInitialValueProgress } from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import LocaleProvider from "@game/utils/src/LocaleContext"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import AllValues from "@/components/AllValues"
import { ValueChoiceCard } from "@/components/ValueChoiceCard"

vi.mock("@game/data/src/LocalizationCatalog", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@game/data/src/LocalizationCatalog")>()
  return { ...original, getLocaleCatalog: vi.fn(original.getLocaleCatalog) }
})

describe("selected interface catalog", () => {
  it("renders selected controls, value names, and battle text through the shared locale scope", () => {
    const english = getLocaleCatalog()
    const deck = createActiveDeck([])
    const ranked = rankValues(deck, createInitialValueProgress(deck)).slice(
      0,
      2,
    )
    const first = ranked[0].definition
    if (first.kind !== "canonical")
      throw new Error("Expected an included value")
    const values = new Map(english.values)
    values.set(first.id, {
      name: "⟦Selected value⟧",
      definition: "⟦Selected meaning⟧",
    })
    vi.mocked(getLocaleCatalog).mockReturnValue({
      ...english,
      values,
      interfaceCopy: {
        ...english.interfaceCopy,
        dressingRoom: { ...english.interfaceCopy.dressingRoom, back: "⟦Back⟧" },
        screen: {
          ...english.interfaceCopy.screen,
          close: "⟦Close⟧",
          searchAllValues: "⟦Search values⟧",
        },
      },
    })
    const onClose = vi.fn()
    const onActivate = vi.fn()
    const view = render(
      <LocaleProvider locale="en">
        <AllValues
          rankedValues={ranked}
          runtimeClipCatalog={createSeethingSwarmTypographyOnlyRuntimeClipCatalog()}
          shouldReduceMotion
          isMenuOpen={false}
          onClose={onClose}
          onOpenMenu={vi.fn()}
          onAddCustomValue={vi.fn()}
          onUpdateCustomValue={vi.fn()}
          onDeleteCustomValue={vi.fn()}
        />
      </LocaleProvider>,
    )
    expect(
      screen.getByRole("heading", { name: "⟦Selected value⟧" }),
    ).toBeVisible()
    fireEvent.change(
      screen.getByRole("searchbox", { name: "⟦Search values⟧" }),
      { target: { value: "Selected meaning" } },
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    fireEvent.click(screen.getByRole("button", { name: "⟦Back⟧" }))
    expect(onClose).toHaveBeenCalledOnce()
    view.rerender(
      <LocaleProvider locale="en">
        <ValueChoiceCard
          position="first"
          value={first}
          level={1}
          controlHint={null}
          winnerId={null}
          isEnabled
          isAnimating={false}
          onActivate={onActivate}
          onFocus={vi.fn()}
        />
      </LocaleProvider>,
    )
    expect(
      screen.getByRole("heading", { name: "⟦Selected value⟧" }),
    ).toHaveTextContent("⟦Selected value⟧")
    expect(screen.getByText("“⟦Selected meaning⟧”")).toBeVisible()
    fireEvent.click(
      screen.getByRole("button", {
        name: "Choose ⟦Selected value⟧. Level 1. Choice 1.",
      }),
    )
    expect(onActivate).toHaveBeenCalledWith(first.id)
  })
})
