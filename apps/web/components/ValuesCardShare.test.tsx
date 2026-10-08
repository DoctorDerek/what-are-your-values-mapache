import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import type {
  PreparedValuesCard,
  ValuesCardModel,
} from "@game/data/src/ValuesCard"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ValuesCardShare from "@/components/ValuesCardShare"
import { prepareWebValuesCard } from "@/lib/ValuesCardExport"

vi.mock("@/lib/ValuesCardExport", () => ({ prepareWebValuesCard: vi.fn() }))
const prepare = vi.mocked(prepareWebValuesCard)
const model: ValuesCardModel<never> = {
  title: "My Top Five Values",
  hasComparisons: true,
  appearance: DEFAULT_HEROES99_APPEARANCE,
  values: [{ name: "Curiosity", level: 12, animal: null }],
}
let file: PreparedValuesCard
beforeEach(() => {
  file = {
    format: "gif",
    previewUri: "http://localhost/card.gif",
    stillPreviewUri: "http://localhost/card.png",
    byteLength: 100,
    canShare: true,
    save: vi.fn(async () => "saved" as const),
    share: vi.fn(async () => "cancelled" as const),
    dispose: vi.fn(),
  }
  prepare.mockReset().mockResolvedValue(file)
})

describe("values-card preview", () => {
  it("previews first, supports format and hero choices, and saves only on activation", async () => {
    const close = vi.fn()
    const view = render(
      <ValuesCardShare
        model={model}
        shouldReduceMotion={false}
        onClose={close}
      />,
    )
    const image = await screen.findByRole("img", { name: /Curiosity/ })
    expect(image).toHaveAttribute("src", file.previewUri)
    expect(
      screen.getByRole("button", { name: /GIF · Animated/ }),
    ).toHaveAttribute("aria-pressed", "true")
    expect(file.save).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("checkbox", { name: "Include my hero" }))
    await waitFor(() =>
      expect(prepare).toHaveBeenLastCalledWith(
        model,
        expect.objectContaining({ includeHero: false }),
      ),
    )
    await screen.findByRole("img", { name: /Curiosity/ })
    fireEvent.click(screen.getByRole("button", { name: "PNG · Still" }))
    await waitFor(() =>
      expect(prepare).toHaveBeenLastCalledWith(
        model,
        expect.objectContaining({ format: "png" }),
      ),
    )
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Save PNG" })).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole("button", { name: "Save PNG" }))
    await screen.findByText("Card saved.")
    expect(file.save).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(close).toHaveBeenCalledOnce()
    view.unmount()
    expect(file.dispose).toHaveBeenCalled()
  })

  it("keeps GIF selected under Reduced Motion and offers local save without file sharing", async () => {
    file = { ...file, canShare: false }
    prepare.mockResolvedValue(file)
    render(
      <ValuesCardShare model={model} shouldReduceMotion onClose={vi.fn()} />,
    )
    expect(await screen.findByRole("img")).toHaveAttribute(
      "src",
      file.stillPreviewUri,
    )
    expect(screen.getByRole("button", { name: "Share GIF" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Save GIF" })).toBeEnabled()
    expect(screen.getByText(/attach it wherever/)).toBeVisible()
  })

  it("shows retryable preparation and delivery errors without closing or losing the model", async () => {
    prepare.mockRejectedValueOnce(new Error("Image offline"))
    const close = vi.fn()
    render(
      <ValuesCardShare
        model={model}
        shouldReduceMotion={false}
        onClose={close}
      />,
    )
    await screen.findByRole("alert")
    expect(screen.getByText("Image offline")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    await screen.findByRole("img")
    vi.mocked(file.share).mockRejectedValueOnce(new Error("Permission denied"))
    fireEvent.click(screen.getByRole("button", { name: "Share GIF" }))
    await screen.findByText("Permission denied")
    expect(screen.getByRole("img")).toBeVisible()
    expect(close).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Share GIF" }))
    await screen.findByText("Cancelled. Your card is still ready.")
  })
})
