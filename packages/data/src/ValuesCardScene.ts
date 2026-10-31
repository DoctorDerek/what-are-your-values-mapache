import { HEROES99_IDLE_FRAME_COUNT } from "./Heroes99SpatialArchitecture"
import { SEETHING_SWARM_CALM_FRAME_DURATION_MS } from "./SeethingSwarmAnimalPresentation"
import {
  FLUENT_MEDAL_SOURCE_SIZE,
  type ValueRankMedalColor,
} from "./ValueRankMedal"
import {
  VALUES_CARD_SIZE,
  type ValuesCardModel,
  type ValuesCardPalette,
} from "./ValuesCard"
import { layoutValuesCardValues } from "./ValuesCardValueLayout"

export type CardRectangle = Readonly<{
  x: number
  y: number
  width: number
  height: number
}>
export type CardText = Readonly<{
  value: string
  x: number
  y: number
  size: number
  weight: 400 | 700 | 900
  color: string
  align?: "left" | "center" | "right"
}>
export type ValuesCardPainter = Readonly<{
  rectangle: (bounds: CardRectangle, color: string) => void
  text: (text: CardText) => void
  measure: (value: string, size: number, weight: CardText["weight"]) => number
  sprite: (
    key: number | "hero" | ValueRankMedalColor,
    source: CardRectangle,
    target: CardRectangle,
    sampling?: "pixel" | "smooth",
  ) => void
}>

export function getValuesCardLoopFrameCount<Asset>(
  model: ValuesCardModel<Asset>,
  includeHero: boolean,
) {
  const greatestCommonDivisor = (a: number, b: number): number =>
    b === 0 ? a : greatestCommonDivisor(b, a % b)
  return model.values.reduce(
    (count, value) => {
      const frames = value.animal?.frameCount ?? 1
      return (count * frames) / greatestCommonDivisor(count, frames)
    },
    includeHero ? HEROES99_IDLE_FRAME_COUNT : 1,
  )
}

export const VALUES_CARD_FRAME_DURATION_MS =
  SEETHING_SWARM_CALM_FRAME_DURATION_MS

function fitSingleLineCardText(
  value: string,
  maximumSize: number,
  weight: CardText["weight"],
  painter: ValuesCardPainter,
) {
  const width = VALUES_CARD_SIZE.width - 2 * 48
  return Math.min(
    maximumSize,
    Math.floor(
      (width * maximumSize) / painter.measure(value, maximumSize, weight),
    ),
  )
}

export function paintValuesCard<Asset>({
  painter,
  model,
  palette,
  frame,
  hero,
  includeLevels = true,
}: {
  painter: ValuesCardPainter
  model: ValuesCardModel<Asset>
  palette: ValuesCardPalette
  frame: number
  hero: Readonly<{ width: number; height: number }> | null
  includeLevels?: boolean
}): void {
  painter.rectangle({ x: 0, y: 0, ...VALUES_CARD_SIZE }, palette.frame)
  painter.rectangle(
    { x: 12, y: 12, width: 1576, height: 876 },
    palette.background,
  )
  painter.rectangle({ x: 12, y: 170, width: 1576, height: 610 }, palette.values)
  painter.text({
    value: model.title,
    x: 800,
    y: 125,
    size: fitSingleLineCardText(model.title, 96, 900, painter),
    weight: 900,
    color: palette.ink,
    align: "center",
  })
  if (hero) {
    const scale = Math.max(
      1,
      Math.floor(Math.min(420 / hero.width, 570 / hero.height)),
    )
    painter.sprite(
      "hero",
      { x: (frame % HEROES99_IDLE_FRAME_COUNT) * hero.width, y: 0, ...hero },
      {
        x: Math.round(242 - (hero.width * scale) / 2),
        y: 770 - hero.height * scale,
        width: hero.width * scale,
        height: hero.height * scale,
      },
    )
  }
  const layout = layoutValuesCardValues(
    model,
    painter,
    hero !== null,
    includeLevels,
  )
  const shift = layout.columnShift
  for (const {
    value,
    index,
    middle,
    size,
    lines,
    animal: target,
  } of layout.rows) {
    if (model.hasComparisons) {
      painter.rectangle(
        { x: 450 + shift, y: middle - 40, width: 82, height: 68 },
        palette.rank,
      )
      painter.text({
        value: value.rankLabel,
        x: 491 + shift,
        y: middle + 20,
        size: 58,
        weight: 400,
        color: palette.ink,
        align: "center",
      })
      if (value.medal)
        painter.sprite(
          value.medal,
          { x: 0, y: 0, ...FLUENT_MEDAL_SOURCE_SIZE },
          { x: 540 + shift, y: middle - 36, width: 72, height: 72 },
          "smooth",
        )
    }
    const animal = value.animal
    if (animal && target) {
      const bounds = animal.visibleBounds
      painter.sprite(
        index,
        {
          x: (frame % animal.frameCount) * animal.frameWidth + bounds.left,
          y: bounds.top,
          width: bounds.width,
          height: bounds.height,
        },
        { ...target, x: target.x + layout.adjustment },
      )
    }
    lines.forEach((line, lineIndex) =>
      painter.text({
        value: line,
        x: layout.nameX,
        y:
          middle +
          size * 0.35 -
          ((lines.length - 1) * (size + 4)) / 2 +
          lineIndex * (size + 4),
        size,
        weight: 900,
        color: palette.ink,
      }),
    )
    if (includeLevels)
      painter.text({
        value: value.levelLabel,
        x: layout.levelX,
        y: middle + 20,
        size: 55,
        weight: 400,
        color: palette.muted,
        align: "right",
      })
  }
  painter.rectangle(
    { x: 12, y: 780, width: 1576, height: 108 },
    palette.invitationBackground,
  )
  painter.text({
    value: model.invitation,
    x: 800,
    y: 856,
    size: fitSingleLineCardText(model.invitation, 56, 700, painter),
    weight: 700,
    color: palette.invitationText,
    align: "center",
  })
}
