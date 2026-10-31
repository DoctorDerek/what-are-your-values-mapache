import { graphemeSegments } from "unicode-segmenter/grapheme"
import type { ValuesCardModel } from "./ValuesCard"
import type { ValuesCardPainter } from "./ValuesCardScene"

function wrapCardName(
  value: string,
  width: number,
  size: number,
  painter: ValuesCardPainter,
) {
  const lines: string[] = []
  let line = ""
  for (const { segment } of graphemeSegments(value)) {
    const next = line + segment
    if (line && painter.measure(next, size, 900) > width) {
      const boundary = line.lastIndexOf(" ")
      if (boundary > 0) {
        lines.push(line.slice(0, boundary))
        line = line.slice(boundary + 1) + segment
      } else {
        lines.push(line)
        line = segment
      }
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export function layoutValuesCardValues<Asset>(
  model: ValuesCardModel<Asset>,
  painter: ValuesCardPainter,
  includeHero: boolean,
  includeLevels: boolean,
) {
  const initialShift = includeHero ? 0 : -188
  const nameX = 731 + initialShift
  const rows = model.values.map((value, index) => {
    const middle = 235 + index * 119
    const levelWidth = includeLevels
      ? painter.measure(value.levelLabel, 55, 400)
      : 0
    const nameWidth = 1542 - levelWidth - 24 - nameX
    let size = 78
    let lines = wrapCardName(value.name, nameWidth, size, painter)
    while ((lines.length > 2 || lines.length * size > 100) && size > 12) {
      size -= 2
      lines = wrapCardName(value.name, nameWidth, size, painter)
    }
    const bounds = value.animal?.visibleBounds
    const animalScale = bounds
      ? Math.max(
          1,
          Math.min(
            6,
            Math.floor(
              Math.min(
                (value.medal ? 110 : 170) / bounds.width,
                104 / bounds.height,
              ),
            ),
          ),
        )
      : 1
    const animal = bounds
      ? {
          x: Math.round(
            (value.medal ? 670 : 620) +
              initialShift -
              (bounds.width * animalScale) / 2,
          ),
          y: middle + 46 - bounds.height * animalScale,
          width: bounds.width * animalScale,
          height: bounds.height * animalScale,
        }
      : null
    const nameRight =
      nameX +
      Math.max(0, ...lines.map((line) => painter.measure(line, size, 900)))
    return {
      value,
      index,
      middle,
      size,
      lines,
      animal,
      left: Math.min(
        nameX,
        model.hasComparisons ? 450 + initialShift : nameX,
        animal?.x ?? nameX,
      ),
      right: Math.max(
        nameRight,
        includeLevels ? 1542 : nameRight,
        animal ? animal.x + animal.width : nameRight,
      ),
    }
  })
  const targetCenter = includeHero ? (450 + 1542) / 2 : 800
  const adjustment =
    (includeHero && includeLevels) || rows.length === 0
      ? 0
      : targetCenter -
        (Math.min(...rows.map((row) => row.left)) +
          Math.max(...rows.map((row) => row.right))) /
          2
  return {
    rows,
    columnShift: initialShift + adjustment,
    nameX: nameX + adjustment,
    levelX: 1542 + adjustment,
    adjustment,
  }
}
