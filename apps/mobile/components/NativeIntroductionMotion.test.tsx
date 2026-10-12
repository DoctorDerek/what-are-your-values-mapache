import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import { describe, expect, it, jest } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react-native"
import { Alert, Linking } from "react-native"
import NativeIntroduction from "@/components/NativeIntroduction"

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  lazy: () =>
    jest.requireMock<typeof import("@/components/NativeMapachitoIceCream")>(
      "@/components/NativeMapachitoIceCream",
    ).default,
}))
jest.mock("@/components/useNativeDeferredFirstArrival", () => ({
  __esModule: true,
  default: (enabled: boolean) => enabled,
}))
jest.mock("@/components/NativeMapachitoIceCream", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native")
  return {
    __esModule: true,
    default: ({
      onStarted,
      onUnavailable,
    }: {
      onStarted: () => void
      onUnavailable: () => void
    }) => (
      <View
        testID="optional-ice-cream"
        onLayout={onStarted}
        onTouchCancel={onUnavailable}
      />
    ),
  }
})
jest.mock("@/components/NativeFirstArrivalRaccoon", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native")
  return {
    __esModule: true,
    default: ({ onComplete }: { onComplete: () => void }) => (
      <View testID="optional-raccoon" onLayout={onComplete} />
    ),
  }
})

describe("native introduction optional decoration", () => {
  it("begins the runner after Rive starts and removes the one-shot decoration when complete", async () => {
    await render(
      <NativeIntroduction onComplete={jest.fn()} onLocaleChange={jest.fn()} />,
    )
    const iceCream = await screen.findByTestId("optional-ice-cream", {
      includeHiddenElements: true,
    })
    expect(
      screen.queryByTestId("optional-raccoon", { includeHiddenElements: true }),
    ).toBeNull()
    await fireEvent(iceCream, "layout")
    await fireEvent(
      screen.getByTestId("optional-raccoon", { includeHiddenElements: true }),
      "layout",
    )
    expect(
      screen.queryByTestId("optional-ice-cream", {
        includeHiddenElements: true,
      }),
    ).toBeNull()
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled()
  })

  it("keeps Start usable after optional art failure and avoids motion for reduced motion", async () => {
    const onComplete = jest.fn()
    const { rerender } = await render(
      <NativeIntroduction onComplete={onComplete} onLocaleChange={jest.fn()} />,
    )
    await fireEvent(
      await screen.findByTestId("optional-ice-cream", {
        includeHiddenElements: true,
      }),
      "touchCancel",
    )
    await fireEvent.press(screen.getByRole("button", { name: "Start" }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    await rerender(
      <NativeIntroduction
        shouldReduceMotion
        onComplete={onComplete}
        onLocaleChange={jest.fn()}
      />,
    )
    expect(
      screen.queryByTestId("optional-ice-cream", {
        includeHiddenElements: true,
      }),
    ).toBeNull()
  })

  it("opens the creator website without leaving the introduction and contains link errors", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {})
    await render(
      <NativeIntroduction
        shouldReduceMotion
        onComplete={jest.fn()}
        onLocaleChange={jest.fn()}
      />,
    )
    await fireEvent.press(screen.getByRole("link", { name: "DoctorDerek.com" }))
    expect(open).toHaveBeenCalledWith(
      FIRST_ARRIVAL_PRESENTATION.creatorWebsiteUrl,
    )
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled()
    open.mockRejectedValueOnce(new Error("No website handler"))
    await fireEvent.press(screen.getByRole("link", { name: "DoctorDerek.com" }))
    expect(alert).toHaveBeenCalledWith(
      FIRST_ARRIVAL_PRESENTATION.websiteErrorTitle,
      FIRST_ARRIVAL_PRESENTATION.websiteErrorMessage,
    )
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled()
  })
})
