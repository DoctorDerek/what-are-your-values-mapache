import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { LOCALIZATION_CATALOG_RESOLUTIONS } from "@game/data/src/LocalizationCatalog"
import { createInitialValueProgress } from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import { describe, expect, it, jest } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react-native"
import NativeAllValues from "@/components/NativeAllValues"
import NativeIntroduction from "@/components/NativeIntroduction"

jest.mock("@game/data/src/EnglishLocalizationCatalog", () => ({
  ENGLISH_LOCALIZATION_CATALOG: undefined,
}))

describe("native localization resilience", () => {
  it("keeps Start and language selection usable with the entire English catalog missing", async () => {
    const onComplete = jest.fn()
    const onLocaleChange = jest.fn()
    await render(
      <NativeIntroduction
        shouldReduceMotion
        onComplete={onComplete}
        onLocaleChange={onLocaleChange}
      />,
    )
    expect(LOCALIZATION_CATALOG_RESOLUTIONS.en.issues.length).toBeGreaterThan(
      100,
    )
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled()
    await fireEvent.press(screen.getByRole("button", { name: "Language" }))
    const english = screen.getByRole("radio", { name: "English (US)" })
    expect(english).toBeChecked()
    await fireEvent.press(english)
    expect(onLocaleChange).toHaveBeenCalledWith("en")
    await fireEvent.press(screen.getByRole("button", { name: "Language" }))
    await fireEvent.press(screen.getByRole("button", { name: "Back" }))
    expect(screen.queryByRole("radio")).toBeNull()
    await fireEvent.press(screen.getByRole("button", { name: "Start" }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("renders recovered values, searches their meaning, and allows navigation", async () => {
    const deck = createActiveDeck([])
    const onClose = jest.fn()
    const onOpenMenu = jest.fn()
    await render(
      <NativeAllValues
        rankedValues={rankValues(deck, createInitialValueProgress(deck))}
        onClose={onClose}
        onOpenMenu={onOpenMenu}
        onAddCustomValue={jest.fn()}
        onUpdateCustomValue={jest.fn()}
        onDeleteCustomValue={jest.fn()}
      />,
    )
    expect(
      screen.getByRole("header", { name: "Acceptance" }),
    ).toBeOnTheScreen()
    await fireEvent.changeText(
      screen.getByLabelText("Search All Values"),
      "to be accepted as I am",
    )
    expect(
      screen.getByRole("header", { name: "Acceptance" }),
    ).toBeOnTheScreen()
    expect(screen.getByText("1 Value Shown")).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole("button", { name: "Menu" }))
    await fireEvent.press(screen.getByRole("button", { name: "Close" }))
    expect(onOpenMenu).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
