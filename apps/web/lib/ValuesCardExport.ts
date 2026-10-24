import type { ValueRankMedalColor } from "@game/data/src/ValueRankMedal"
import {
  getValuesCardMedals,
  readValuesCardPalette,
  VALUES_CARD_COLOR_VARIABLES,
  VALUES_CARD_SIZE,
  type PreparedValuesCard,
  type ValuesCardModel,
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
import type { StaticImageData } from "next/image"
import { HEROES99_ASSETS } from "@/generated/heroes99/Heroes99Assets"
import { composeHeroes99 } from "@/lib/ComposeHeroes99"
import { FLUENT_MEDAL_ARTWORK } from "@/lib/FluentMedalArtwork"

export async function prepareWebValuesCard(
  model: ValuesCardModel<StaticImageData>,
  { format, includeHero, signal }: ValuesCardPreparation,
): Promise<PreparedValuesCard> {
  await document.fonts.ready
  signal.throwIfAborted()
  const styles = getComputedStyle(document.documentElement)
  const palette = readValuesCardPalette(
    VALUES_CARD_COLOR_VARIABLES.map((name) => styles.getPropertyValue(name)),
  )
  const canvas = document.createElement("canvas")
  const { width, height } = VALUES_CARD_SIZE
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) throw new Error("Card rendering is unavailable in this browser")
  context.imageSmoothingEnabled = false
  const images = new Map<number | ValueRankMedalColor, ImageBitmap>()
  let hero: Awaited<ReturnType<typeof composeHeroes99>> | null = null
  try {
    const sources = new Map<number | ValueRankMedalColor, string>()
    for (const [index, value] of model.values.entries()) {
      if (!value.animal) continue
      sources.set(index, value.animal.asset.src)
    }
    for (const medal of getValuesCardMedals(model))
      sources.set(medal, FLUENT_MEDAL_ARTWORK[medal].src)
    for (const [key, source] of sources) {
      const response = await fetch(source, { signal })
      if (!response.ok) throw new Error("Card artwork could not be loaded")
      const bitmap = await createImageBitmap(await response.blob())
      images.set(key, bitmap)
      signal.throwIfAborted()
    }
    if (includeHero)
      hero = await composeHeroes99(model.appearance, HEROES99_ASSETS, signal)
    const font = (size: number, weight: CardText["weight"]) =>
      `${weight} ${size}px Arial, sans-serif`
    const painter: ValuesCardPainter = {
      rectangle: (bounds, color) => {
        context.fillStyle = color
        context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
      },
      measure: (value, size, weight) => {
        context.font = font(size, weight)
        return context.measureText(value).width
      },
      text: ({ value, x, y, size, weight, color, align = "left" }) => {
        context.font = font(size, weight)
        context.textAlign = align
        context.fillStyle = color
        context.fillText(value, x, y)
      },
      sprite: (key, source, target, sampling = "pixel") => {
        const image = key === "hero" ? hero?.canvas : images.get(key)
        if (!image) throw new Error("Card artwork is unavailable")
        context.imageSmoothingEnabled = sampling === "smooth"
        context.imageSmoothingQuality = "high"
        context.drawImage(
          image,
          source.x,
          source.y,
          source.width,
          source.height,
          target.x,
          target.y,
          target.width,
          target.height,
        )
      },
    }
    const render = (frame: number) =>
      paintValuesCard({ painter, model, palette, frame, hero })
    render(0)
    const still = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("The PNG could not be encoded")),
        "image/png",
      ),
    )
    const blob =
      format === "png"
        ? still
        : new Blob(
            [
              await encodeGif({
                width,
                height,
                frameCount: getValuesCardLoopFrameCount(model, includeHero),
                frameDurationMs: VALUES_CARD_FRAME_DURATION_MS,
                signal,
                render: (frame) => {
                  render(frame)
                  return context.getImageData(0, 0, width, height).data
                },
              }),
            ],
            { type: "image/gif" },
          )
    signal.throwIfAborted()
    const file = new File([blob], `my-values-card.${format}`, {
      type: blob.type,
    })
    const shareData: ShareData = { files: [file] }
    const canShare =
      typeof navigator.canShare === "function" && navigator.canShare(shareData)
    const previewUri = URL.createObjectURL(blob)
    const stillPreviewUri =
      format === "png" ? previewUri : URL.createObjectURL(still)
    return {
      format,
      previewUri,
      stillPreviewUri,
      byteLength: blob.size,
      canShare,
      save: async () => {
        const link = document.createElement("a")
        link.href = previewUri
        link.download = file.name
        document.body.append(link)
        link.click()
        link.remove()
        return "download-started"
      },
      share: async () => {
        try {
          await navigator.share(shareData)
          return "handed-off"
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError")
            return "cancelled"
          throw error
        }
      },
      dispose: () => {
        URL.revokeObjectURL(previewUri)
        if (stillPreviewUri !== previewUri) URL.revokeObjectURL(stillPreviewUri)
      },
    }
  } finally {
    images.forEach((image) => image.close())
    if (hero) {
      hero.canvas.width = 0
      hero.canvas.height = 0
    }
    canvas.width = 0
    canvas.height = 0
  }
}
