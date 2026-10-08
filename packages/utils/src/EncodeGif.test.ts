import sharp from "sharp"
import { describe, expect, it } from "vitest"
import { encodeGif } from "./EncodeGif"

describe("portable GIF encoding", () => {
  it("produces a decoded looping GIF with each visible frame and authored pacing", async () => {
    const bytes = await encodeGif({
      width: 2,
      height: 1,
      frameCount: 3,
      frameDurationMs: 160,
      signal: new AbortController().signal,
      render: (frame) =>
        new Uint8Array([frame * 100, 50, 0, 255, 0, 0, 100, 255]),
    })
    const decoder = sharp(bytes, { animated: true })
    const metadata = await decoder.metadata()
    expect(metadata).toMatchObject({
      format: "gif",
      width: 2,
      pageHeight: 1,
      pages: 3,
      loop: 0,
      delay: [160, 160, 160],
    })
    const pixels = await decoder.ensureAlpha().raw().toBuffer()
    expect(pixels[0]).toBeLessThan(pixels[8])
    expect(pixels[8]).toBeLessThan(pixels[16])
  })
  it("honors cancellation between frames", async () => {
    const controller = new AbortController()
    controller.abort(new Error("Cancelled"))
    await expect(
      encodeGif({
        width: 1,
        height: 1,
        frameCount: 3,
        frameDurationMs: 160,
        signal: controller.signal,
        render: () => new Uint8Array([0, 0, 0, 255]),
      }),
    ).rejects.toThrow("Cancelled")
  })
})
