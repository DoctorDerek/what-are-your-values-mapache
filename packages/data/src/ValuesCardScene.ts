import { HEROES99_IDLE_FRAME_COUNT } from "./Heroes99SpatialArchitecture"
import { SEETHING_SWARM_CALM_FRAME_DURATION_MS } from "./SeethingSwarmAnimalPresentation"
import {
  VALUES_CARD_COPY,
  VALUES_CARD_SIZE,
  type ValuesCardModel,
  type ValuesCardPalette,
} from "./ValuesCard"
import { graphemeSegments } from "unicode-segmenter/grapheme"

export type CardRectangle = Readonly<{ x: number; y: number; width: number; height: number }>
export type CardText = Readonly<{
  value: string; x: number; y: number; size: number; weight: 400 | 700 | 900
  color: string; align?: "left" | "center" | "right"
}>
export type ValuesCardPainter = Readonly<{
  rectangle: (bounds: CardRectangle, color: string) => void
  text: (text: CardText) => void
  measure: (value: string, size: number, weight: CardText["weight"]) => number
  sprite: (key: number | "hero", source: CardRectangle, target: CardRectangle) => void
}>

export function getValuesCardLoopFrameCount<Asset>(model: ValuesCardModel<Asset>, includeHero: boolean) {
  const greatestCommonDivisor = (a: number, b: number): number => b === 0 ? a : greatestCommonDivisor(b, a % b)
  return model.values.reduce((count, value) => {
    const frames = value.animal?.frameCount ?? 1
    return count * frames / greatestCommonDivisor(count, frames)
  }, includeHero ? HEROES99_IDLE_FRAME_COUNT : 1)
}

export const VALUES_CARD_FRAME_DURATION_MS = SEETHING_SWARM_CALM_FRAME_DURATION_MS

function wrapCardName(value: string, width: number, size: number, painter: ValuesCardPainter) {
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

export function paintValuesCard<Asset>({
  painter, model, palette, frame, hero,
}: {
  painter: ValuesCardPainter
  model: ValuesCardModel<Asset>
  palette: ValuesCardPalette
  frame: number
  hero: Readonly<{ width: number; height: number }> | null
}): void {
  painter.rectangle({ x: 0, y: 0, ...VALUES_CARD_SIZE }, palette.frame)
  painter.rectangle({ x: 12, y: 12, width: 1576, height: 876 }, palette.background)
  painter.rectangle({ x: 12, y: 170, width: 1576, height: 610 }, palette.values)
  painter.text({ value: model.title, x: 800, y: 125, size: 96, weight: 900, color: palette.ink, align: "center" })
  if (hero) {
    const scale = Math.max(1, Math.floor(Math.min(420 / hero.width, 570 / hero.height)))
    painter.sprite("hero", { x: frame % HEROES99_IDLE_FRAME_COUNT * hero.width, y: 0, ...hero }, {
      x: Math.round(242 - hero.width * scale / 2), y: 770 - hero.height * scale,
      width: hero.width * scale, height: hero.height * scale,
    })
  }
  const shift = hero ? 0 : -188
  for (const [index, value] of model.values.entries()) {
    const middle = 235 + index * 119
    if (model.hasComparisons) {
      painter.rectangle({ x: 450 + shift, y: middle - 40, width: 82, height: 68 }, palette.rank)
      painter.text({ value: `#${index + 1}`, x: 491 + shift, y: middle + 20, size: 58, weight: 400, color: palette.ink, align: "center" })
    }
    const animal = value.animal
    if (animal) {
      const bounds = animal.visibleBounds
      const scale = Math.max(1, Math.min(6, Math.floor(Math.min(170 / bounds.width, 104 / bounds.height))))
      painter.sprite(index, {
        x: (frame % animal.frameCount) * animal.frameWidth + bounds.left,
        y: bounds.top, width: bounds.width, height: bounds.height,
      }, {
        x: Math.round(620 + shift - bounds.width * scale / 2),
        y: middle + 46 - bounds.height * scale, width: bounds.width * scale, height: bounds.height * scale,
      })
    }
    const level = `Level ${value.level}`
    const levelWidth = painter.measure(level, 55, 400)
    const nameX = 731 + shift
    const nameWidth = 1542 - levelWidth - 24 - nameX
    let size = 78
    let lines = wrapCardName(value.name, nameWidth, size, painter)
    while ((lines.length > 2 || lines.length * size > 100) && size > 12) {
      size -= 2
      lines = wrapCardName(value.name, nameWidth, size, painter)
    }
    lines.forEach((line, lineIndex) => painter.text({ value: line, x: nameX,
      y: middle + size * 0.35 - (lines.length - 1) * (size + 4) / 2 + lineIndex * (size + 4),
      size, weight: 900, color: palette.ink,
    }))
    painter.text({ value: level, x: 1542, y: middle + 20, size: 55, weight: 400, color: palette.muted, align: "right" })
  }
  painter.text({ value: VALUES_CARD_COPY.invitation, x: 800, y: 856, size: 68, weight: 700, color: palette.muted, align: "center" })
}
