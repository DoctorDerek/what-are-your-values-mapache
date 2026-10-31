import { describe, expect, it } from "vitest"
import {
  getHeroes99MotionBounds,
  getHeroes99PresentationFrames,
  HEROES99_FLOURISHES,
} from "./Heroes99Presentation"

describe("Heroes99 shared presentation geometry", () => {
  it("keeps representative idle first and synchronized authored action frames in one atlas", () => {
    const idle = getHeroes99PresentationFrames("idle")
    const home = getHeroes99PresentationFrames("home")
    expect(idle.map((frame) => frame.x)).toEqual([100, 200, 300, 400, 500, 0])
    expect(home.slice(0, idle.length)).toEqual(idle)
    expect(home).toHaveLength(22)
    for (const [index, clip] of HEROES99_FLOURISHES.entries()) {
      const frames = home.slice(clip.offset, clip.offset + clip.frameCount)
      expect(frames.map((frame) => frame.y)).toEqual(
        Array(clip.frameCount).fill((index + 5) * 40),
      )
      expect(frames.map((frame) => frame.x)).toEqual(
        Array.from({ length: clip.frameCount }, (_, frame) => frame * 100),
      )
    }
  })

  it("reserves the union of real artwork over idle and every flourish without reading page layout", () => {
    const pixels = new Uint8Array(800 * 680 * 4)
    for (const [index, frame] of getHeroes99PresentationFrames(
      "home",
    ).entries())
      pixels[
        ((frame.y + 8 + (index % 12)) * 800 + frame.x + 22 + index) * 4 + 3
      ] = 255
    const bounds = getHeroes99MotionBounds(pixels)
    expect(bounds).toEqual({ left: 22, top: 8, width: 22, height: 12 })
    expect(() =>
      getHeroes99MotionBounds(new Uint8Array(800 * 680 * 4)),
    ).toThrow("Hero artwork is empty")
  })
})
