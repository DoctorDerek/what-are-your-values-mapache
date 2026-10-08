/// <reference path="./gifenc.d.ts" />
import { applyPalette, GIFEncoder, quantize } from "gifenc"

const GIF_PALETTE_SAMPLE_BUDGET = 262_144

export async function encodeGif({
  width,
  height,
  frameCount,
  frameDurationMs,
  render,
  signal,
}: {
  readonly width: number
  readonly height: number
  readonly frameCount: number
  readonly frameDurationMs: number
  readonly render: (frame: number) => Uint8Array | Uint8ClampedArray
  readonly signal: AbortSignal
}): Promise<Uint8Array<ArrayBuffer>> {
  const encoder = GIFEncoder()
  const pixelsPerFrame = width * height
  const samplesPerFrame = Math.min(
    pixelsPerFrame,
    Math.ceil(GIF_PALETTE_SAMPLE_BUDGET / frameCount),
  )
  const samples = new Uint8Array(samplesPerFrame * frameCount * 4)
  for (let frame = 0; frame < frameCount; frame++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    signal.throwIfAborted()
    const pixels = render(frame)
    for (let sample = 0; sample < samplesPerFrame; sample++) {
      const source = Math.floor((sample * pixelsPerFrame) / samplesPerFrame) * 4
      samples.set(
        pixels.subarray(source, source + 4),
        (frame * samplesPerFrame + sample) * 4,
      )
    }
  }
  const palette = quantize(samples, 256)
  for (let frame = 0; frame < frameCount; frame++) {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    signal.throwIfAborted()
    const pixels = render(frame)
    encoder.writeFrame(applyPalette(pixels, palette), width, height, {
      palette,
      delay: frameDurationMs,
      repeat: 0,
    })
  }
  signal.throwIfAborted()
  encoder.finish()
  return encoder.bytes()
}
