import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import { DRESSING_ROOM_COPY } from "@game/data/src/Heroes99DressingRoom"
import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Heroes99Hero from "@/components/Heroes99Hero"
import { composeHeroes99 } from "@/lib/ComposeHeroes99"

vi.mock("@/lib/ComposeHeroes99", () => ({ composeHeroes99: vi.fn() }))
vi.mock("@/generated/heroes99/Heroes99Assets", () => ({
  HEROES99_ASSETS: {
    layers: {},
    thumbnailAtlas: null,
    thumbnailIndexByChoiceId: {},
    palettes: {},
  },
}))

type HeroStrip = Awaited<ReturnType<typeof composeHeroes99>>
const compose = vi.mocked(composeHeroes99)
const createStrip = (width = 12): HeroStrip => {
  const canvas = document.createElement("canvas")
  canvas.width = width * 6
  canvas.height = 24
  return { canvas, width, height: 24 }
}

describe("Heroes99 preview lifecycle", () => {
  const originalContext = Object.getOwnPropertyDescriptor(
    HTMLCanvasElement.prototype,
    "getContext",
  )!
  const context = {
    imageSmoothingEnabled: true,
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  }

  beforeEach(() => {
    compose.mockReset()
    vi.clearAllMocks()
    context.imageSmoothingEnabled = true
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => context,
    })
  })

  afterEach(() =>
    Object.defineProperty(
      HTMLCanvasElement.prototype,
      "getContext",
      originalContext,
    ),
  )

  it("draws a crisp preview, keeps it during changes, and ignores superseded work", async () => {
    const firstStrip = createStrip()
    compose.mockResolvedValueOnce(firstStrip)
    const { rerender, unmount } = render(
      <Heroes99Hero
        appearance={DEFAULT_HEROES99_APPEARANCE}
        shouldReduceMotion={false}
      />,
    )
    expect(screen.getByText(DRESSING_ROOM_COPY.loading)).toBeVisible()
    await waitFor(() =>
      expect(context.drawImage).toHaveBeenCalledWith(firstStrip.canvas, 0, 0),
    )
    const image = screen.getByRole("img", {
      name: DRESSING_ROOM_COPY.character,
    })
    expect(image.querySelector("canvas")).toHaveAttribute("width", "72")
    expect(context.imageSmoothingEnabled).toBe(false)
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 72, 24)
    const stale = Promise.withResolvers<HeroStrip>()
    const current = Promise.withResolvers<HeroStrip>()
    compose
      .mockReturnValueOnce(stale.promise)
      .mockReturnValueOnce(current.promise)
    rerender(
      <Heroes99Hero
        appearance={{ ...DEFAULT_HEROES99_APPEARANCE, facePalette: 3 }}
        shouldReduceMotion={false}
      />,
    )
    expect(compose.mock.calls[0]![2].aborted).toBe(true)
    expect(image.querySelector("canvas")).toHaveAttribute("width", "72")
    expect(
      screen.queryByText(DRESSING_ROOM_COPY.loading),
    ).not.toBeInTheDocument()
    rerender(
      <Heroes99Hero
        appearance={{ ...DEFAULT_HEROES99_APPEARANCE, facePalette: 4 }}
        shouldReduceMotion
      />,
    )
    expect(compose.mock.calls[1]![2].aborted).toBe(true)
    const latestStrip = createStrip(15)
    await act(async () => current.resolve(latestStrip))
    await act(async () => stale.resolve(createStrip(20)))
    expect(image.querySelector("canvas")).toHaveAttribute("width", "90")
    expect(context.drawImage).toHaveBeenLastCalledWith(latestStrip.canvas, 0, 0)
    unmount()
    expect(compose.mock.calls[2]![2].aborted).toBe(true)
  })

  it("shows a useful failed preview and redraws after a later selection succeeds", async () => {
    compose.mockRejectedValueOnce(new Error("asset unavailable"))
    const { rerender } = render(
      <Heroes99Hero
        appearance={DEFAULT_HEROES99_APPEARANCE}
        shouldReduceMotion
      />,
    )
    await screen.findByRole("img", { name: DRESSING_ROOM_COPY.placeholder })
    expect(screen.getByText(DRESSING_ROOM_COPY.placeholder)).toBeVisible()
    const strip = createStrip()
    compose.mockResolvedValueOnce(strip)
    rerender(
      <Heroes99Hero
        appearance={{ ...DEFAULT_HEROES99_APPEARANCE, skinPalette: 2 }}
        shouldReduceMotion
      />,
    )
    await waitFor(() =>
      expect(context.drawImage).toHaveBeenCalledWith(strip.canvas, 0, 0),
    )
    expect(
      screen
        .getByRole("img", { name: DRESSING_ROOM_COPY.character })
        .querySelector("canvas"),
    ).not.toBeNull()
    expect(
      screen.queryByText(DRESSING_ROOM_COPY.placeholder),
    ).not.toBeInTheDocument()
  })

  it("does not replace the current preview with a cancelled selection error", async () => {
    const stale = Promise.withResolvers<HeroStrip>()
    const strip = createStrip()
    compose.mockReturnValueOnce(stale.promise).mockResolvedValueOnce(strip)
    const { rerender } = render(
      <Heroes99Hero
        appearance={DEFAULT_HEROES99_APPEARANCE}
        shouldReduceMotion
      />,
    )
    rerender(
      <Heroes99Hero
        appearance={{ ...DEFAULT_HEROES99_APPEARANCE, facePalette: 3 }}
        shouldReduceMotion
      />,
    )
    await waitFor(() =>
      expect(context.drawImage).toHaveBeenCalledWith(strip.canvas, 0, 0),
    )
    await act(async () => stale.reject(new Error("cancelled decode")))
    expect(
      screen.getByRole("img", { name: DRESSING_ROOM_COPY.character }),
    ).toBeVisible()
    expect(
      screen.queryByText(DRESSING_ROOM_COPY.placeholder),
    ).not.toBeInTheDocument()
  })
})
