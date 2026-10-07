export type Heroes99Bounds = Readonly<{
  left: number
  top: number
  width: number
  height: number
}>
export type Heroes99RuntimeAssets<Source> = Readonly<{
  layers: Readonly<
    Record<string, Readonly<{ source: Source; bounds: Heroes99Bounds }>>
  >
  thumbnailAtlas: Source | null
  thumbnailIndexByChoiceId: Readonly<Record<string, number>>
  palettes: Readonly<Record<string, readonly string[]>>
}>

export const HEROES99_THUMBNAIL = Object.freeze({
  width: 64,
  height: 80,
  columns: 8,
})

export function unionHeroes99Bounds(
  bounds: readonly Heroes99Bounds[],
): Heroes99Bounds {
  const left = Math.min(...bounds.map((item) => item.left))
  const top = Math.min(...bounds.map((item) => item.top))
  const right = Math.max(...bounds.map((item) => item.left + item.width))
  const bottom = Math.max(...bounds.map((item) => item.top + item.height))
  return { left, top, width: right - left, height: bottom - top }
}
