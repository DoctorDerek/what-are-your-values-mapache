import {
  getHeroes99LayerPaths,
  type Heroes99Appearance,
} from "@game/data/src/Heroes99Appearance"
import {
  getHeroes99MotionBounds,
  getHeroes99PresentationFrames,
  type Heroes99PresentationMode,
} from "@game/data/src/Heroes99Presentation"
import {
  unionHeroes99Bounds,
  type Heroes99RuntimeAssets,
} from "@game/data/src/Heroes99RuntimeAssets"
import { HEROES99_SPATIAL_ARCHITECTURE } from "@game/data/src/Heroes99SpatialArchitecture"
import type { StaticImageData } from "next/image"

export async function composeHeroes99(
  appearance: Heroes99Appearance,
  assets: Heroes99RuntimeAssets<StaticImageData>,
  signal: AbortSignal,
  mode: Heroes99PresentationMode = "idle",
) {
  const layers = getHeroes99LayerPaths(appearance).map((path) => {
    const layer = assets.layers[path]
    if (!layer) throw new Error("Hero layers are unavailable")
    return layer
  })
  const { sheet_width_px: width, sheet_height_px: height } =
    HEROES99_SPATIAL_ARCHITECTURE.grid_metrics
  const idleBounds = unionHeroes99Bounds(
    layers.flatMap((layer) => (layer.bounds.width > 0 ? [layer.bounds] : [])),
  )
  const sheet = document.createElement("canvas")
  sheet.width = width
  sheet.height = height
  const context = sheet.getContext("2d")
  if (!context) throw new Error("Hero canvas is unavailable")
  context.imageSmoothingEnabled = false
  const loaded = await Promise.allSettled(
    layers.map(async (layer) => {
      const response = await fetch(layer.source.src, { signal })
      if (!response.ok) throw new Error("Hero layer could not be loaded")
      return createImageBitmap(await response.blob())
    }),
  )
  try {
    signal.throwIfAborted()
    for (const result of loaded) {
      if (result.status === "rejected")
        throw new Error("Hero layer could not be loaded")
      context.drawImage(result.value, 0, 0)
    }
  } finally {
    for (const result of loaded)
      if (result.status === "fulfilled") result.value.close()
  }
  const frames = getHeroes99PresentationFrames(mode)
  const bounds =
    mode === "home"
      ? getHeroes99MotionBounds(context.getImageData(0, 0, width, height).data)
      : idleBounds
  const strip = document.createElement("canvas")
  strip.width = bounds.width * frames.length
  strip.height = bounds.height
  const stripContext = strip.getContext("2d")
  if (!stripContext) throw new Error("Hero preview is unavailable")
  stripContext.imageSmoothingEnabled = false
  for (const [index, frame] of frames.entries())
    stripContext.drawImage(
      sheet,
      frame.x + bounds.left,
      frame.y + bounds.top,
      bounds.width,
      bounds.height,
      index * bounds.width,
      0,
      bounds.width,
      bounds.height,
    )
  signal.throwIfAborted()
  return {
    canvas: strip,
    width: bounds.width,
    height: bounds.height,
  }
}
