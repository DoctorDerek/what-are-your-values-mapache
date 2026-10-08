import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import type {
  PreparedValuesCard,
  ValuesCardModel,
} from "@game/data/src/ValuesCard"
import { beforeEach, expect, it, jest } from "@jest/globals"
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native"
import NativeValuesCardShare from "@/components/NativeValuesCardShare"
import { prepareNativeValuesCard } from "@/lib/NativeValuesCardExport"

jest.mock("@/lib/NativeValuesCardExport", () => ({
  prepareNativeValuesCard: jest.fn(),
}))
jest.mock("expo-image", () => ({
  Image:
    jest.requireActual<typeof import("react-native")>("react-native").Image,
}))
jest.mock("uniwind", () => ({
  withUniwind: <T,>(component: T) => component,
  useCSSVariable: () => [
    "#009dae",
    "#71dfe7",
    "#c2fff9",
    "#ffe652",
    "#18233e",
    "#384873",
  ],
}))
const prepare = jest.mocked(prepareNativeValuesCard)
const model: ValuesCardModel<number> = {
  title: "My Top Five Values",
  hasComparisons: true,
  appearance: DEFAULT_HEROES99_APPEARANCE,
  values: [{ name: "Fun", level: 12, animal: null }],
}
let file: PreparedValuesCard
beforeEach(() => {
  file = {
    format: "gif",
    previewUri: "file:///card.gif",
    stillPreviewUri: "file:///card.png",
    byteLength: 100,
    canShare: true,
    save: jest.fn(async () => "saved" as const),
    share: jest.fn(async () => "handed-off" as const),
    dispose: jest.fn(),
  }
  prepare.mockReset().mockResolvedValue(file)
})

it("previews GIF on native, changes content, saves and closes without committing appearance", async () => {
  const close = jest.fn()
  const view = await render(
    <NativeValuesCardShare
      model={model}
      shouldReduceMotion={false}
      onClose={close}
    />,
  )
  expect(await screen.findByLabelText("My Top Five Values: Fun")).toHaveProp(
    "source",
    { uri: file.previewUri },
  )
  await fireEvent.press(screen.getByRole("checkbox"))
  await waitFor(() =>
    expect(prepare).toHaveBeenLastCalledWith(
      model,
      expect.anything(),
      expect.objectContaining({ includeHero: false }),
    ),
  )
  await screen.findByLabelText("My Top Five Values: Fun")
  await fireEvent.press(screen.getByRole("button", { name: "PNG · Still" }))
  await waitFor(() =>
    expect(prepare).toHaveBeenLastCalledWith(
      model,
      expect.anything(),
      expect.objectContaining({ format: "png" }),
    ),
  )
  await screen.findByLabelText("My Top Five Values: Fun")
  await fireEvent.press(screen.getByRole("button", { name: "Save PNG" }))
  await screen.findByText("Card saved.")
  await fireEvent.press(screen.getByRole("button", { name: "Back" }))
  expect(close).toHaveBeenCalledTimes(1)
  await view.unmount()
  expect(file.dispose).toHaveBeenCalled()
})

it("uses the still preview for reduced motion, retains save fallback, and shares explicitly", async () => {
  await render(
    <NativeValuesCardShare
      model={model}
      shouldReduceMotion
      onClose={jest.fn()}
    />,
  )
  expect(await screen.findByLabelText("My Top Five Values: Fun")).toHaveProp(
    "source",
    { uri: file.stillPreviewUri },
  )
  expect(file.share).not.toHaveBeenCalled()
  await fireEvent.press(screen.getByRole("button", { name: "Share GIF" }))
  await screen.findByText(
    "Your card was handed to your device’s sharing options.",
  )
})

it("recovers preparation and delivery failures and exposes local technical details", async () => {
  prepare.mockRejectedValueOnce(new Error("Missing image"))
  const close = jest.fn()
  await render(
    <NativeValuesCardShare
      model={model}
      shouldReduceMotion={false}
      onClose={close}
    />,
  )
  await screen.findByRole("alert")
  await fireEvent.press(
    screen.getByRole("button", { name: "Technical details" }),
  )
  expect(screen.getByText("Missing image")).toBeOnTheScreen()
  await fireEvent.press(screen.getByRole("button", { name: "Retry" }))
  await screen.findByLabelText("My Top Five Values: Fun")
  jest.mocked(file.save).mockRejectedValueOnce(new Error("No space"))
  await fireEvent.press(screen.getByRole("button", { name: "Save GIF" }))
  await screen.findByText("No space")
  expect(close).not.toHaveBeenCalled()
  await fireEvent.press(screen.getByRole("button", { name: "Save GIF" }))
  await screen.findByText("Card saved.")
})

it("keeps Save available when direct sharing is unavailable", async () => {
  prepare.mockResolvedValue({ ...file, canShare: false })
  await render(
    <NativeValuesCardShare
      model={model}
      shouldReduceMotion={false}
      onClose={jest.fn()}
    />,
  )
  await screen.findByLabelText("My Top Five Values: Fun")
  expect(screen.getByText(/attach it wherever/)).toBeOnTheScreen()
  expect(screen.getByRole("button", { name: "Save GIF" })).toBeEnabled()
  expect(screen.getByRole("button", { name: "Share GIF" })).toBeDisabled()
})
