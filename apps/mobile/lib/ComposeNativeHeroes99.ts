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
import {
  AlphaType,
  ColorType,
  ImageFormat,
  Skia,
} from "@shopify/react-native-skia"
import { Image } from "react-native"

export async function composeNativeHeroes99(
  appearance: Heroes99Appearance,
  assets: Heroes99RuntimeAssets<number>,
  signal: AbortSignal,
  mode: Heroes99PresentationMode = "idle",
) {
  const layers = getHeroes99LayerPaths(appearance).map((path) => {
    const layer = assets.layers[path]
    if (!layer) throw new Error("Hero layers are unavailable")
    return layer
  })
  const idleBounds = unionHeroes99Bounds(
    layers.flatMap((layer) => (layer.bounds.width > 0 ? [layer.bounds] : [])),
  )
  const { sheet_width_px: width, sheet_height_px: height } =
    HEROES99_SPATIAL_ARCHITECTURE.grid_metrics
  const sheet = Skia.Surface.MakeOffscreen(width, height)
  if (!sheet) throw new Error("Hero composition surface is unavailable")
  try {
    const canvas = sheet.getCanvas()
    canvas.clear(Skia.Color("transparent"))
    for (const layer of layers) {
      signal.throwIfAborted()
      const data = await Skia.Data.fromURI(
        Image.resolveAssetSource(layer.source).uri,
      )
      try {
        signal.throwIfAborted()
        const image = Skia.Image.MakeImageFromEncoded(data)
        if (!image) throw new Error("Hero layer could not be decoded")
        try {
          canvas.drawImage(image, 0, 0)
        } finally {
          image.dispose()
        }
      } finally {
        data.dispose()
      }
    }
    sheet.flush()
    let bounds = idleBounds
    if (mode === "home") {
      const pixels = canvas.readPixels(0, 0, {
        width,
        height,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
      })
      if (!(pixels instanceof Uint8Array))
        throw new Error("Hero pixels could not be read")
      bounds = getHeroes99MotionBounds(pixels)
    }
    const frames = getHeroes99PresentationFrames(mode)
    const image = sheet.makeImageSnapshot()
    try {
      const strip = Skia.Surface.MakeOffscreen(
        bounds.width * frames.length,
        bounds.height,
      )
      if (!strip) throw new Error("Hero preview surface is unavailable")
      const paint = Skia.Paint()
      try {
        const target = strip.getCanvas()
        target.clear(Skia.Color("transparent"))
        for (const [index, frame] of frames.entries())
          target.drawImageRect(
            image,
            Skia.XYWHRect(
              frame.x + bounds.left,
              frame.y + bounds.top,
              bounds.width,
              bounds.height,
            ),
            Skia.XYWHRect(index * bounds.width, 0, bounds.width, bounds.height),
            paint,
          )
        strip.flush()
        const preview = strip.makeImageSnapshot()
        try {
          signal.throwIfAborted()
          return {
            source: {
              uri: `data:image/png;base64,${preview.encodeToBase64(ImageFormat.PNG)}`,
            },
            width: bounds.width,
            height: bounds.height,
          }
        } finally {
          preview.dispose()
        }
      } finally {
        paint.dispose()
        strip.dispose()
      }
    } finally {
      image.dispose()
    }
  } finally {
    sheet.dispose()
  }
}
