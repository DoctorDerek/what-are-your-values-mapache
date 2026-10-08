import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import {
  readValuesCardPalette,
  type ValuesCardModel,
} from "@game/data/src/ValuesCard"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { prepareNativeValuesCard } from "./NativeValuesCardExport"

const native = vi.hoisted(() => {
  const dispose = vi.fn()
  const paragraphs: { value: string; dispose: ReturnType<typeof vi.fn> }[] = []
  const canvas = {
    drawRect: vi.fn(),
    drawImageRectOptions: vi.fn(),
    readPixels: vi.fn(() => new Uint8Array(8)),
  }
  const snapshot = {
    encodeToBytes: vi.fn(() => new Uint8Array([137, 80, 78, 71])),
    dispose: vi.fn(),
  }
  const surface = {
    getCanvas: () => canvas,
    flush: vi.fn(),
    makeImageSnapshot: () => snapshot,
    dispose: vi.fn(),
  }
  const makeOffscreen = vi.fn(() => surface)
  const fromURI = vi.fn(async (_uri: string) => ({ dispose }))
  const decode = vi.fn(() => ({ dispose }))
  const createBuilder = vi.fn((style: { textStyle: { fontSize: number } }) => {
    let value = ""
    return {
      addText(text: string) {
        value = text
        return this
      },
      build() {
        const paragraph = {
          value,
          dispose: vi.fn(),
          layout: vi.fn(),
          getMaxIntrinsicWidth: () =>
            value.length * style.textStyle.fontSize * 0.5,
          getLineMetrics: () => [{ baseline: style.textStyle.fontSize }],
          paint: vi.fn(),
        }
        paragraphs.push(paragraph)
        return paragraph
      },
      dispose: vi.fn(),
    }
  })
  const files = new Map<string, Uint8Array>()
  const directories = new Set<string>()
  const copy = vi.fn(async (source: string, target: string) => {
    files.set(target, files.get(source)!)
  })
  class Directory {
    uri: string
    constructor(parent: string | { uri: string }, name = "") {
      this.uri = `${typeof parent === "string" ? parent : parent.uri}/${name}`
    }
    get exists() {
      return directories.has(this.uri)
    }
    create() {
      directories.add(this.uri)
    }
    delete() {
      directories.delete(this.uri)
      for (const path of files.keys())
        if (path.startsWith(this.uri)) files.delete(path)
    }
    static pickDirectoryAsync = vi.fn(
      async () => new Directory("file:///saved"),
    )
  }
  class File {
    uri: string
    name: string
    constructor(directory: Directory, name: string) {
      this.name = name
      this.uri = `${directory.uri}/${name}`
    }
    get exists() {
      return files.has(this.uri)
    }
    write(data: Uint8Array) {
      files.set(this.uri, data)
    }
    async copy(target: File) {
      await copy(this.uri, target.uri)
    }
  }
  const share = vi.fn<(uri: string, options: unknown) => Promise<void>>(
    async () => undefined,
  )
  const available = vi.fn(async () => true)
  const compose = vi.fn(async () => ({
    source: { uri: "data:image/png;base64,hero" },
    width: 20,
    height: 30,
  }))
  const encode = vi.fn(
    async ({ render }: { render: (frame: number) => Uint8Array }) => {
      render(1)
      return new Uint8Array([71, 73, 70])
    },
  )
  return {
    canvas,
    snapshot,
    surface,
    makeOffscreen,
    fromURI,
    decode,
    createBuilder,
    paragraphs,
    dispose,
    files,
    directories,
    copy,
    Directory,
    File,
    share,
    available,
    compose,
    encode,
  }
})

vi.mock("expo-file-system", () => ({
  Directory: native.Directory,
  File: native.File,
  Paths: { cache: "file:///cache" },
}))
vi.mock("expo-sharing", () => ({
  isAvailableAsync: native.available,
  shareAsync: native.share,
}))
vi.mock("react-native", () => ({
  Image: {
    resolveAssetSource: (source: number) => ({ uri: `asset:${source}` }),
  },
  Platform: { OS: "android" },
}))
vi.mock("@/generated/heroes99/Heroes99Assets", () => ({
  HEROES99_ASSETS: { layers: {} },
}))
vi.mock("./ComposeNativeHeroes99", () => ({
  composeNativeHeroes99: native.compose,
}))
vi.mock("@game/utils/src/EncodeGif", () => ({ encodeGif: native.encode }))
vi.mock("@shopify/react-native-skia", () => ({
  AlphaType: { Unpremul: 0 },
  ColorType: { RGBA_8888: 0 },
  ImageFormat: { PNG: 0 },
  FilterMode: { Nearest: 0 },
  MipmapMode: { None: 0 },
  Skia: {
    Surface: { MakeOffscreen: native.makeOffscreen },
    Paint: () => ({ dispose: native.dispose, setColor: vi.fn() }),
    Color: (color: string) => color,
    XYWHRect: (x: number, y: number, width: number, height: number) => ({
      x,
      y,
      width,
      height,
    }),
    Data: { fromURI: native.fromURI },
    Image: { MakeImageFromEncoded: native.decode },
    ParagraphBuilder: { Make: native.createBuilder },
  },
}))

const model: ValuesCardModel<number> = {
  title: "My Top Five Values",
  hasComparisons: true,
  appearance: DEFAULT_HEROES99_APPEARANCE,
  values: [
    {
      name: "Creativity 🦝 创造力",
      level: 14,
      animal: {
        kind: "character",
        animalId: "bat",
        animationId: "idle",
        relativePath: "idle.png",
        asset: 1,
        frameCount: 8,
        frameWidth: 32,
        frameHeight: 32,
        visibleBounds: { left: 0, top: 0, width: 20, height: 20 },
      },
    },
  ],
}
const palette = readValuesCardPalette([
  "#009dae",
  "#71dfe7",
  "#c2fff9",
  "#ffe652",
  "#18233e",
  "#384873",
])
const prepare = (
  includeHero = false,
  format: "gif" | "png" = "png",
  signal = new AbortController().signal,
) => prepareNativeValuesCard(model, palette, { includeHero, format, signal })

beforeEach(() => {
  vi.clearAllMocks()
  native.files.clear()
  native.directories.clear()
  native.paragraphs.length = 0
  native.available.mockResolvedValue(true)
  native.copy.mockImplementation(async (source, target) => {
    native.files.set(target, native.files.get(source)!)
  })
})

describe("native values-card files", () => {
  it("passes exact names to native font fallback and copies prepared PNG bytes without overwriting an existing file", async () => {
    const card = await prepare()
    expect(native.fromURI).toHaveBeenCalledWith("asset:1")
    expect(native.paragraphs.map(({ value }) => value)).toContain(
      "Creativity 🦝 创造力",
    )
    expect(native.compose).not.toHaveBeenCalled()
    expect(card.previewUri).toBe(card.stillPreviewUri)
    expect(native.files.get(card.previewUri)).toEqual(
      new Uint8Array([137, 80, 78, 71]),
    )
    expect(await card.save()).toBe("saved")
    expect(await card.save()).toBe("saved")
    expect(native.copy.mock.calls[0][1]).toMatch(/my-values-card.png$/)
    expect(native.copy.mock.calls[1][1]).toMatch(/my-values-card-1.png$/)
    card.dispose()
    expect(native.files.has(card.previewUri)).toBe(false)
    expect(native.files.size).toBe(2)
    expect(
      native.paragraphs.every(
        (paragraph) => paragraph.dispose.mock.calls.length === 1,
      ),
    ).toBe(true)
    expect(native.surface.dispose).toHaveBeenCalledTimes(1)
  })

  it("uses the shared GIF loop and keeps its native still preview until sharing has finished", async () => {
    const card = await prepare(true, "gif")
    expect(native.compose).toHaveBeenCalledWith(
      model.appearance,
      expect.anything(),
      expect.any(AbortSignal),
    )
    expect(native.encode).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 1600,
        height: 900,
        frameCount: 24,
        frameDurationMs: 160,
      }),
    )
    expect(card.previewUri).not.toBe(card.stillPreviewUri)
    let complete: () => void = () => undefined
    native.share.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve
        }),
    )
    const delivery = card.share()
    card.dispose()
    expect(native.files.has(card.previewUri)).toBe(true)
    complete()
    expect(await delivery).toBe("handed-off")
    expect(native.share).toHaveBeenCalledWith(
      card.previewUri,
      expect.objectContaining({ mimeType: "image/gif" }),
    )
    expect(native.files.size).toBe(0)
  })

  it("treats picker cancellation as cancellation and retains the card after an actionable save failure", async () => {
    const card = await prepare()
    native.Directory.pickDirectoryAsync.mockRejectedValueOnce({
      code: "ERR_FILE_PICKING_CANCELLED",
    })
    expect(await card.save()).toBe("cancelled")
    native.copy.mockRejectedValueOnce(new Error("Storage full"))
    await expect(card.save()).rejects.toThrow("Storage full")
    expect(native.files.has(card.previewUri)).toBe(true)
    expect(await card.save()).toBe("saved")
    card.dispose()
  })

  it("releases renderer resources on an asset failure or an interrupted preparation", async () => {
    native.fromURI.mockRejectedValueOnce(new Error("Missing asset"))
    await expect(prepare()).rejects.toThrow("Missing asset")
    expect(native.surface.dispose).toHaveBeenCalledTimes(1)
    const controller = new AbortController()
    controller.abort()
    await expect(prepare(false, "png", controller.signal)).rejects.toThrow()
    expect(native.directories.size).toBe(0)
    expect(native.dispose).toHaveBeenCalled()
  })
})
