import {
  DEFAULT_HEROES99_APPEARANCE,
  getHeroes99LayerPaths,
} from "@game/data/src/Heroes99Appearance"
import type { Heroes99RuntimeAssets } from "@game/data/src/Heroes99RuntimeAssets"
import type { StaticImageData } from "next/image"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { composeHeroes99 } from "@/lib/ComposeHeroes99"

const layerPaths = getHeroes99LayerPaths(DEFAULT_HEROES99_APPEARANCE)
const assets: Heroes99RuntimeAssets<StaticImageData> = {
  layers: Object.fromEntries(layerPaths.map((path, index) => [path, {
    source: { src: `/hero/${path}`, width: 800, height: 680 },
    bounds: index === 0
      ? { left: 0, top: 0, width: 0, height: 0 }
      : index === layerPaths.length - 1
        ? { left: 47, top: 6, width: 8, height: 22 }
        : { left: 40, top: 8, width: 10, height: 18 },
  }])),
  thumbnailAtlas: null,
  thumbnailIndexByChoiceId: {},
  palettes: {},
}

describe("Heroes99 browser composition", () => {
  const originalContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext")!
  let contexts: { canvas: HTMLCanvasElement; imageSmoothingEnabled: boolean; drawImage: ReturnType<typeof vi.fn> }[]
  let bitmaps: ImageBitmap[]
  let unavailableContext: number
  let requestedContexts: number
  const fetchLayer = vi.fn<typeof fetch>()
  const decodeLayer = vi.fn<typeof createImageBitmap>()

  beforeEach(() => {
    contexts = []
    bitmaps = []
    unavailableContext = -1
    requestedContexts = 0
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: function (this: HTMLCanvasElement) {
        if (requestedContexts++ === unavailableContext) return null
        const context = { canvas: this, imageSmoothingEnabled: true, drawImage: vi.fn() }
        contexts.push(context)
        return context
      },
    })
    fetchLayer.mockReset().mockImplementation(async () => new Response(new Uint8Array([1])))
    decodeLayer.mockReset().mockImplementation(async () => {
      const bitmap = { width: 800, height: 680, close: vi.fn() }
      bitmaps.push(bitmap)
      return bitmap
    })
    vi.stubGlobal("fetch", fetchLayer)
    vi.stubGlobal("createImageBitmap", decodeLayer)
  })

  afterEach(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", originalContext)
    vi.unstubAllGlobals()
  })

  it("loads only the selected recipe in layer order and crops six crisp idle frames with the representative frame first", async () => {
    const controller = new AbortController()
    const result = await composeHeroes99(DEFAULT_HEROES99_APPEARANCE, assets, controller.signal)
    expect(fetchLayer.mock.calls).toEqual(layerPaths.map(path => [`/hero/${path}`, { signal: controller.signal }]))
    expect(contexts[0]!.drawImage.mock.calls).toEqual(bitmaps.map(bitmap => [bitmap, 0, 0]))
    expect(contexts.map(context => context.imageSmoothingEnabled)).toEqual([false, false])
    expect([contexts[0]!.canvas.width, contexts[0]!.canvas.height]).toEqual([800, 680])
    expect(contexts[1]!.drawImage.mock.calls).toEqual([1, 2, 3, 4, 5, 0].map((frame, index) => [contexts[0]!.canvas, frame * 100 + 40, 6, 15, 22, index * 15, 0, 15, 22]))
    expect(result).toEqual({ canvas: contexts[1]!.canvas, width: 15, height: 22 })
    expect([result.canvas.width, result.canvas.height]).toEqual([90, 22])
    for (const bitmap of bitmaps) expect(bitmap.close).toHaveBeenCalledOnce()
  })

  it("releases every successfully decoded layer when another request fails", async () => {
    fetchLayer.mockResolvedValueOnce(new Response(null, { status: 404 }))
    await expect(composeHeroes99(DEFAULT_HEROES99_APPEARANCE, assets, new AbortController().signal)).rejects.toThrow("Hero layer could not be loaded")
    expect(bitmaps).toHaveLength(layerPaths.length - 1)
    for (const bitmap of bitmaps) expect(bitmap.close).toHaveBeenCalledOnce()
    expect(contexts).toHaveLength(1)
  })

  it("releases decoded layers and never publishes a cancelled composition", async () => {
    const controller = new AbortController()
    fetchLayer.mockImplementation(async () => {
      controller.abort()
      return new Response(new Uint8Array([1]))
    })
    await expect(composeHeroes99(DEFAULT_HEROES99_APPEARANCE, assets, controller.signal)).rejects.toMatchObject({ name: "AbortError" })
    expect(contexts[0]!.drawImage).not.toHaveBeenCalled()
    for (const bitmap of bitmaps) expect(bitmap.close).toHaveBeenCalledOnce()
  })

  it.each([[0, "Hero canvas is unavailable"], [1, "Hero preview is unavailable"]] as const)("reports unavailable canvas %s without leaking decoded images", async (index, message) => {
    unavailableContext = index
    await expect(composeHeroes99(DEFAULT_HEROES99_APPEARANCE, assets, new AbortController().signal)).rejects.toThrow(message)
    for (const bitmap of bitmaps) expect(bitmap.close).toHaveBeenCalledOnce()
  })

  it("rejects missing assets before requesting any layer", async () => {
    await expect(composeHeroes99(DEFAULT_HEROES99_APPEARANCE, { ...assets, layers: {} }, new AbortController().signal)).rejects.toThrow("Hero layers are unavailable")
    expect(fetchLayer).not.toHaveBeenCalled()
  })
})
