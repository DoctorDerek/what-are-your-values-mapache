import {
  VALUES_CARD_SIZE,
  type PreparedValuesCard,
  type ValuesCardModel,
  type ValuesCardPalette,
  type ValuesCardPreparation,
} from "@game/data/src/ValuesCard"
import {
  getValuesCardLoopFrameCount,
  paintValuesCard,
  VALUES_CARD_FRAME_DURATION_MS,
  type CardText,
  type ValuesCardPainter,
} from "@game/data/src/ValuesCardScene"
import { encodeGif } from "@game/utils/src/EncodeGif"
import {
  AlphaType, ColorType, FilterMode, ImageFormat,
  MipmapMode, Skia, type SkParagraph, type SkImage,
} from "@shopify/react-native-skia"
import { Directory, File, Paths } from "expo-file-system"
import { isAvailableAsync, shareAsync } from "expo-sharing"
import { Image, Platform } from "react-native"
import { HEROES99_ASSETS } from "@/generated/heroes99/Heroes99Assets"
import { composeNativeHeroes99 } from "./ComposeNativeHeroes99"

async function loadImage(uri: string, signal: AbortSignal) {
  const data = await Skia.Data.fromURI(uri)
  try {
    signal.throwIfAborted()
    const image = Skia.Image.MakeImageFromEncoded(data)
    if (!image) throw new Error("Card artwork could not be decoded")
    return image
  } finally { data.dispose() }
}

export async function prepareNativeValuesCard(
  model: ValuesCardModel<number>,
  palette: ValuesCardPalette,
  { format, includeHero, signal }: ValuesCardPreparation,
): Promise<PreparedValuesCard> {
  const { width, height } = VALUES_CARD_SIZE
  const surface = Skia.Surface.MakeOffscreen(width, height)
  if (!surface) throw new Error("Card rendering is unavailable")
  const canvas = surface.getCanvas()
  const paint = Skia.Paint()
  const paragraphs = new Map<string, SkParagraph>()
  const measuredWidths = new Map<string, number>()
  const images = new Map<number | "hero", SkImage>()
  const cache = new Directory(Paths.cache, `values-card-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  let isPrepared = false
  try {
    for (const [index, value] of model.values.entries()) {
      if (!value.animal) continue
      images.set(index, await loadImage(Image.resolveAssetSource(value.animal.asset).uri, signal))
    }
    const hero = includeHero ? await composeNativeHeroes99(model.appearance, HEROES99_ASSETS, signal) : null
    if (hero) images.set("hero", await loadImage(hero.source.uri, signal))
    const createParagraph = (value: string, size: number, weight: CardText["weight"], color: string) => {
      const builder = Skia.ParagraphBuilder.Make({ textStyle: {
        color: Skia.Color(color), fontSize: size, fontStyle: { weight },
        fontFamilies: [Platform.OS === "ios" ? "Arial" : "sans-serif"],
      } })
      try {
        const paragraph = builder.addText(value).build()
        paragraph.layout(0)
        paragraph.layout(Math.ceil(paragraph.getMaxIntrinsicWidth()))
        return paragraph
      } finally { builder.dispose() }
    }
    const painter: ValuesCardPainter = {
      rectangle: (bounds, color) => {
        paint.setColor(Skia.Color(color))
        canvas.drawRect(Skia.XYWHRect(bounds.x, bounds.y, bounds.width, bounds.height), paint)
      },
      measure: (value, size, weight) => {
        const key = JSON.stringify([value, size, weight])
        const existing = measuredWidths.get(key)
        if (existing !== undefined) return existing
        const paragraph = createParagraph(value, size, weight, palette.ink)
        try {
          const width = paragraph.getMaxIntrinsicWidth()
          measuredWidths.set(key, width)
          return width
        } finally { paragraph.dispose() }
      },
      text: ({ value, x, y, size, weight, color, align = "left" }) => {
        const key = JSON.stringify([value, size, weight, color])
        let paragraph = paragraphs.get(key)
        if (!paragraph) {
          paragraph = createParagraph(value, size, weight, color)
          paragraphs.set(key, paragraph)
        }
        const textWidth = paragraph.getMaxIntrinsicWidth()
        const baseline = paragraph.getLineMetrics()[0]?.baseline ?? 0
        paragraph.paint(canvas, align === "left" ? x : align === "right" ? x - textWidth : x - textWidth / 2, y - baseline)
      },
      sprite: (key, source, target) => {
        const image = images.get(key)
        if (!image) throw new Error("Card artwork is unavailable")
        canvas.drawImageRectOptions(image,
          Skia.XYWHRect(source.x, source.y, source.width, source.height),
          Skia.XYWHRect(target.x, target.y, target.width, target.height),
          FilterMode.Nearest, MipmapMode.None,
        )
      },
    }
    const render = (frame: number) => {
      paintValuesCard({ painter, model, palette, frame, hero })
      surface.flush()
    }
    render(0)
    const stillImage = surface.makeImageSnapshot()
    let png: Uint8Array
    try { png = stillImage.encodeToBytes(ImageFormat.PNG) }
    finally { stillImage.dispose() }
    const bytes = format === "png" ? png : await encodeGif({ width, height,
      frameCount: getValuesCardLoopFrameCount(model, includeHero),
      frameDurationMs: VALUES_CARD_FRAME_DURATION_MS, signal,
      render: (frame) => {
        render(frame)
        const pixels = canvas.readPixels(0, 0, { width, height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul })
        if (!(pixels instanceof Uint8Array)) throw new Error("Card pixels could not be read")
        return pixels
      },
    })
    signal.throwIfAborted()
    cache.create()
    const file = new File(cache, `my-values-card.${format}`)
    file.write(bytes)
    const still = format === "png" ? file : new File(cache, "preview.png")
    if (format === "gif") still.write(png)
    const canShare = await isAvailableAsync()
    signal.throwIfAborted()
    let pendingDelivery = 0
    let disposed = false
    const removeCache = () => { if (disposed && pendingDelivery === 0 && cache.exists) cache.delete() }
    isPrepared = true
    return {
      format, previewUri: file.uri, stillPreviewUri: still.uri, byteLength: bytes.byteLength, canShare,
      save: async () => {
        pendingDelivery++
        try {
          const destination = await Directory.pickDirectoryAsync()
          let target = new File(destination, file.name)
          let suffix = 1
          while (target.exists) target = new File(destination, `my-values-card-${suffix++}.${format}`)
          await file.copy(target)
          return "saved"
        } catch (error) {
          if (typeof error === "object" && error !== null && "code" in error && error.code === "ERR_FILE_PICKING_CANCELLED") return "cancelled"
          throw error
        } finally { pendingDelivery--; removeCache() }
      },
      share: async () => {
        pendingDelivery++
        try {
          await shareAsync(file.uri, { mimeType: `image/${format}`, UTI: format === "gif" ? "com.compuserve.gif" : "public.png", dialogTitle: "Share my values card" })
          return "handed-off"
        } finally { pendingDelivery--; removeCache() }
      },
      dispose: () => { disposed = true; removeCache() },
    }
  } finally {
    if (!isPrepared && cache.exists) cache.delete()
    images.forEach((image) => image.dispose())
    paragraphs.forEach((paragraph) => paragraph.dispose())
    paint.dispose()
    surface.dispose()
  }
}
