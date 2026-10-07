import {
  DEFAULT_HEROES99_APPEARANCE,
  getHeroes99LayerPaths,
} from "@game/data/src/Heroes99Appearance"
import type { Heroes99RuntimeAssets } from "@game/data/src/Heroes99RuntimeAssets"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { composeNativeHeroes99 } from "./ComposeNativeHeroes99"

const renderer = vi.hoisted(() => {
  const createImage = () => ({
    dispose: vi.fn(),
    encodeToBase64: vi.fn(() => "synthetic-preview"),
  })
  const createSurface = () => {
    const canvas = {
      clear: vi.fn(),
      drawImage: vi.fn(),
      drawImageRect: vi.fn(),
    }
    const image = createImage()
    return {
      canvas,
      image,
      getCanvas: () => canvas,
      makeImageSnapshot: () => image,
      flush: vi.fn(),
      dispose: vi.fn(),
    }
  }
  const state = {
    surfaces: [] as ReturnType<typeof createSurface>[],
    images: [] as ReturnType<typeof createImage>[],
    data: [] as { dispose: ReturnType<typeof vi.fn> }[],
    unavailableSurface: -1,
    invalidImage: false,
    onLoad: null as (() => void) | null,
  }
  const paint = { dispose: vi.fn() }
  const makeOffscreen = vi.fn((_width: number, _height: number) => {
    if (state.surfaces.length === state.unavailableSurface) return null
    const surface = createSurface()
    state.surfaces.push(surface)
    return surface
  })
  const fromURI = vi.fn(async (_uri: string) => {
    const data = { dispose: vi.fn() }
    state.data.push(data)
    state.onLoad?.()
    return data
  })
  return {
    state,
    paint,
    makeOffscreen,
    fromURI,
    Skia: {
      Surface: { MakeOffscreen: makeOffscreen },
      Color: (value: string) => value,
      Data: { fromURI },
      Image: {
        MakeImageFromEncoded: () => {
          if (state.invalidImage) return null
          const image = createImage()
          state.images.push(image)
          return image
        },
      },
      Paint: () => paint,
      XYWHRect: (x: number, y: number, width: number, height: number) => ({
        x,
        y,
        width,
        height,
      }),
    },
  }
})

vi.mock("@shopify/react-native-skia", () => ({
  Skia: renderer.Skia,
  ImageFormat: { PNG: "PNG" },
}))
vi.mock("react-native", () => ({
  Image: {
    resolveAssetSource: (source: number) => ({ uri: `asset:${source}` }),
  },
}))

const assets: Heroes99RuntimeAssets<number> = {
  layers: Object.fromEntries(
    getHeroes99LayerPaths(DEFAULT_HEROES99_APPEARANCE).map((path, index) => [
      path,
      {
        source: index + 1,
        bounds:
          index === 0
            ? { left: 0, top: 0, width: 0, height: 0 }
            : { left: 40, top: 6, width: 15, height: 22 },
      },
    ]),
  ),
  thumbnailAtlas: null,
  thumbnailIndexByChoiceId: {},
  palettes: {},
}

describe("Heroes99 native composition lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderer.state.surfaces = []
    renderer.state.images = []
    renderer.state.data = []
    renderer.state.unavailableSurface = -1
    renderer.state.invalidImage = false
    renderer.state.onLoad = null
  })

  it("composes the selected layers and representative-first strip then releases all Skia resources", async () => {
    const result = await composeNativeHeroes99(
      DEFAULT_HEROES99_APPEARANCE,
      assets,
      new AbortController().signal,
    )
    expect(renderer.fromURI.mock.calls).toEqual(
      Array.from({ length: 8 }, (_, index) => [`asset:${index + 1}`]),
    )
    expect(renderer.makeOffscreen.mock.calls).toEqual([
      [800, 680],
      [90, 22],
    ])
    const [sheet, strip] = renderer.state.surfaces
    expect(sheet!.canvas.drawImage.mock.calls).toEqual(
      renderer.state.images.map((image) => [image, 0, 0]),
    )
    expect(strip!.canvas.drawImageRect.mock.calls).toEqual(
      [1, 2, 3, 4, 5, 0].map((frame, index) => [
        sheet!.image,
        { x: frame * 100 + 40, y: 6, width: 15, height: 22 },
        { x: index * 15, y: 0, width: 15, height: 22 },
        renderer.paint,
      ]),
    )
    expect(result).toEqual({
      source: { uri: "data:image/png;base64,synthetic-preview" },
      width: 15,
      height: 22,
    })
    expect(strip!.image.encodeToBase64).toHaveBeenCalledWith("PNG")
    for (const resource of [
      ...renderer.state.data,
      ...renderer.state.images,
      sheet!,
      strip!,
      sheet!.image,
      strip!.image,
      renderer.paint,
    ])
      expect(resource.dispose).toHaveBeenCalledOnce()
  })

  it("retains no loaded data or surface when cancellation arrives during asset loading", async () => {
    const controller = new AbortController()
    renderer.state.onLoad = () => controller.abort()
    await expect(
      composeNativeHeroes99(
        DEFAULT_HEROES99_APPEARANCE,
        assets,
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" })
    expect(renderer.state.images).toEqual([])
    expect(renderer.state.data[0]!.dispose).toHaveBeenCalledOnce()
    expect(renderer.state.surfaces[0]!.dispose).toHaveBeenCalledOnce()
  })

  it("releases encoded data and the sheet after a decode failure", async () => {
    renderer.state.invalidImage = true
    await expect(
      composeNativeHeroes99(
        DEFAULT_HEROES99_APPEARANCE,
        assets,
        new AbortController().signal,
      ),
    ).rejects.toThrow("Hero layer could not be decoded")
    expect(renderer.state.data[0]!.dispose).toHaveBeenCalledOnce()
    expect(renderer.state.surfaces[0]!.dispose).toHaveBeenCalledOnce()
  })

  it.each([
    [0, "Hero composition surface is unavailable"],
    [1, "Hero preview surface is unavailable"],
  ] as const)(
    "reports unavailable surface %s and releases any earlier resources",
    async (index, message) => {
      renderer.state.unavailableSurface = index
      await expect(
        composeNativeHeroes99(
          DEFAULT_HEROES99_APPEARANCE,
          assets,
          new AbortController().signal,
        ),
      ).rejects.toThrow(message)
      for (const surface of renderer.state.surfaces) {
        expect(surface.dispose).toHaveBeenCalledOnce()
        expect(surface.image.dispose).toHaveBeenCalledOnce()
      }
      for (const resource of [...renderer.state.data, ...renderer.state.images])
        expect(resource.dispose).toHaveBeenCalledOnce()
    },
  )

  it("rejects a missing recipe without allocating renderer resources", async () => {
    await expect(
      composeNativeHeroes99(
        DEFAULT_HEROES99_APPEARANCE,
        { ...assets, layers: {} },
        new AbortController().signal,
      ),
    ).rejects.toThrow("Hero layers are unavailable")
    expect(renderer.makeOffscreen).not.toHaveBeenCalled()
  })
})
