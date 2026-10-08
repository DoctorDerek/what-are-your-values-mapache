import { applyPalette, GIFEncoder, quantize } from "gifenc"

export async function encodeGif({ width, height, frameCount, frameDurationMs, render, signal }: {
  readonly width: number
  readonly height: number
  readonly frameCount: number
  readonly frameDurationMs: number
  readonly render: (frame: number) => Uint8Array | Uint8ClampedArray
  readonly signal: AbortSignal
}): Promise<Uint8Array<ArrayBuffer>> {
  const encoder = GIFEncoder()
  for (let frame = 0; frame < frameCount; frame++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    signal.throwIfAborted()
    const pixels = render(frame)
    const palette = quantize(pixels, 256)
    encoder.writeFrame(applyPalette(pixels, palette), width, height, {
      palette, delay: frameDurationMs, repeat: 0,
    })
  }
  signal.throwIfAborted()
  encoder.finish()
  return encoder.bytes()
}
