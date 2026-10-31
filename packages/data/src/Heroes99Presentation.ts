import { HEROES99_IDLE_FRAME_DURATION_MS } from "./Heroes99Appearance"
import type { Heroes99Bounds } from "./Heroes99RuntimeAssets"
import {
  HEROES99_IDLE_FRAME_COUNT,
  HEROES99_REPRESENTATIVE_FRAME,
  HEROES99_SPATIAL_ARCHITECTURE,
} from "./Heroes99SpatialArchitecture"

export type Heroes99PresentationMode = "idle" | "home"
export const HEROES99_IDLE_CLIP = Object.freeze({
  name: "idle",
  offset: 0,
  frameCount: HEROES99_IDLE_FRAME_COUNT,
  frameDuration: HEROES99_IDLE_FRAME_DURATION_MS,
})
const flourishFrameDuration = 120
const animations = HEROES99_SPATIAL_ARCHITECTURE.compound_state_machine
const count = (animation: { cols: readonly [number, number] }) =>
  animation.cols[1] - animation.cols[0] + 1
export const HEROES99_FLOURISHES = [
  {
    name: "attack_1",
    offset: HEROES99_IDLE_FRAME_COUNT,
    frameCount: count(animations.Attack1),
    frameDuration: flourishFrameDuration,
  },
  {
    name: "attack_2",
    offset: HEROES99_IDLE_FRAME_COUNT + count(animations.Attack1),
    frameCount: count(animations.Attack2),
    frameDuration: flourishFrameDuration,
  },
  {
    name: "attack_3",
    offset:
      HEROES99_IDLE_FRAME_COUNT +
      count(animations.Attack1) +
      count(animations.Attack2),
    frameCount: count(animations.Attack3),
    frameDuration: flourishFrameDuration,
  },
] as const

export function getHeroes99PresentationFrames(mode: Heroes99PresentationMode) {
  const { frame_width_px: width, frame_height_px: height } =
    HEROES99_SPATIAL_ARCHITECTURE.grid_metrics
  const idle = Array.from(
    { length: HEROES99_IDLE_FRAME_COUNT },
    (_, index) => ({
      x:
        ((index + HEROES99_REPRESENTATIVE_FRAME) % HEROES99_IDLE_FRAME_COUNT) *
        width,
      y: 0,
    }),
  )
  return mode === "idle"
    ? idle
    : [
        ...idle,
        ...[animations.Attack1, animations.Attack2, animations.Attack3].flatMap(
          (animation) =>
            Array.from({ length: count(animation) }, (_, index) => ({
              x: (animation.cols[0] - 1 + index) * width,
              y: (animation.row - 1) * height,
            })),
        ),
      ]
}

export function getHeroes99MotionBounds(
  pixels: Uint8Array | Uint8ClampedArray,
): Heroes99Bounds {
  const {
    frame_width_px: width,
    frame_height_px: height,
    sheet_width_px: sheetWidth,
  } = HEROES99_SPATIAL_ARCHITECTURE.grid_metrics
  let left = width
  let top = height
  let right = 0
  let bottom = 0
  for (const frame of getHeroes99PresentationFrames("home"))
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (pixels[((frame.y + y) * sheetWidth + frame.x + x) * 4 + 3] > 0) {
          left = Math.min(left, x)
          top = Math.min(top, y)
          right = Math.max(right, x + 1)
          bottom = Math.max(bottom, y + 1)
        }
  if (right <= left || bottom <= top) throw new Error("Hero artwork is empty")
  return { left, top, width: right - left, height: bottom - top }
}
