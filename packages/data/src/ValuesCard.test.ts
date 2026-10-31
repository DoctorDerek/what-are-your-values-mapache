import { describe, expect, it, vi } from "vitest"
import { createActiveDeck } from "./ActiveDeck"
import { DEFAULT_HEROES99_APPEARANCE } from "./Heroes99Appearance"
import { getLocaleCatalog } from "./LocalizationCatalog"
import { resolveLocalizationCatalog } from "./ResolveLocalizationCatalog"
import { createInitialValueProgress } from "./ValueProgress"
import { rankValues } from "./ValueRanking"
import {
  createValuesCardModel,
  getValuesCardMedals,
  readValuesCardPalette,
} from "./ValuesCard"
import {
  getValuesCardLoopFrameCount,
  paintValuesCard,
  type CardText,
  type ValuesCardPainter,
} from "./ValuesCardScene"

function model() {
  const deck = createActiveDeck([])
  return createValuesCardModel(
    rankValues(deck, createInitialValueProgress(deck)),
    DEFAULT_HEROES99_APPEARANCE,
    { mode: "typography-only" },
  )
}

describe("values-card composition", () => {
  it.each(["en", "es-MX"] as const)(
    "centers all optional-content combinations as one truthful block in %s",
    (locale) => {
      const copy = getLocaleCatalog(locale)
      const card = {
        ...model(),
        hasComparisons: true,
        title: copy.hub.rankedTitle,
        invitation: copy.card.invitation,
        values: model().values.map((value, index) => ({
          ...value,
          name: index === 0 ? "Mi valor “私の価値”" : value.name,
          levelLabel: copy.hub.level(index + 1),
        })),
      }
      const original = structuredClone(card.values)
      const palette = readValuesCardPalette([
        "#009dae",
        "#71dfe7",
        "#c2fff9",
        "#ffe652",
        "#18233e",
        "#384873",
        "#000000",
        "#ffffff",
      ])
      for (const includeHero of [true, false])
        for (const includeLevels of [true, false]) {
          const bounds: { left: number; right: number }[] = []
          const text: CardText[] = []
          const painter: ValuesCardPainter = {
            measure: (value, size) => [...value].length * size * 0.5,
            rectangle: (rectangle) => {
              if (rectangle.width === 82)
                bounds.push({
                  left: rectangle.x,
                  right: rectangle.x + rectangle.width,
                })
            },
            sprite: (key, _source, rectangle) => {
              if (key !== "hero")
                bounds.push({
                  left: rectangle.x,
                  right: rectangle.x + rectangle.width,
                })
            },
            text: (item) => {
              text.push(item)
              if (item.y <= 170 || item.y >= 780) return
              const width = painter.measure(item.value, item.size, item.weight)
              const left =
                item.x -
                (item.align === "right"
                  ? width
                  : item.align === "center"
                    ? width / 2
                    : 0)
              bounds.push({ left, right: left + width })
            },
          }
          paintValuesCard({
            painter,
            model: card,
            palette,
            frame: 0,
            hero: includeHero ? { width: 23, height: 29 } : null,
            includeLevels,
          })
          expect(card.values).toEqual(original)
          expect(
            text.filter((item) =>
              card.values.some((value) => value.levelLabel === item.value),
            ),
          ).toHaveLength(includeLevels ? card.values.length : 0)
          expect(text.some((item) => item.value === card.values[0].name)).toBe(
            true,
          )
          if (includeHero && includeLevels) {
            expect(
              text.find((item) => item.value === card.values[0].name)?.x,
            ).toBe(731)
          } else {
            const left = Math.min(...bounds.map((item) => item.left))
            const right = Math.max(...bounds.map((item) => item.right))
            expect((left + right) / 2).toBeCloseTo(includeHero ? 996 : 800)
            expect(left).toBeGreaterThan(12)
            expect(right).toBeLessThan(1588)
          }
        }
    },
  )

  it("builds the shared preview and export model despite a lost catalog", () => {
    const { catalog, issues } = resolveLocalizationCatalog("en", null, null)
    const deck = createActiveDeck([])
    const ranked = rankValues(deck, createInitialValueProgress(deck))
    const before = structuredClone(ranked)
    const card = createValuesCardModel(
      ranked,
      DEFAULT_HEROES99_APPEARANCE,
      { mode: "typography-only" },
      catalog,
    )
    expect(issues.length).toBeGreaterThan(100)
    expect(card.values[0].name).toBe("Acceptance")
    expect(card.values[0].levelLabel).toBe("Level 1")
    expect(card.values[0].rankLabel).toBe("#1")
    expect(card.copy.share("gif")).toBe("Share GIF")
    expect(card.copy.save("png")).toBe("Save PNG")
    expect(ranked).toEqual(before)
  })

  it("freezes selected catalog text into the model used by both renderers", () => {
    const english = getLocaleCatalog()
    const translations = new Map(
      [...english.values].map(([id, copy]) => [
        id,
        { ...copy, name: `⟦${copy.name}⟧` },
      ]),
    )
    const deck = createActiveDeck([])
    const card = createValuesCardModel(
      rankValues(deck, createInitialValueProgress(deck)),
      DEFAULT_HEROES99_APPEARANCE,
      { mode: "typography-only" },
      {
        ...english,
        values: translations,
        hub: {
          ...english.hub,
          unrankedTitle: "⟦Expanded values heading⟧",
          level: (level) => `⟦Level ${level}⟧`,
        },
        card: {
          ...english.card,
          invitation: "⟦Localized invitation⟧",
          rank: (rank) => `⟦${rank}⟧`,
        },
      },
    )
    translations.clear()
    const painter: ValuesCardPainter = {
      rectangle: vi.fn(),
      sprite: vi.fn(),
      text: vi.fn(),
      measure: (text, size) => text.length * size * 0.52,
    }
    paintValuesCard({
      painter,
      model: { ...card, hasComparisons: true },
      palette: readValuesCardPalette([
        "#009dae",
        "#71dfe7",
        "#c2fff9",
        "#ffe652",
        "#18233e",
        "#384873",
        "#1e1e1e",
        "#ffffff",
      ]),
      frame: 0,
      hero: null,
    })
    for (const value of [
      "⟦Expanded values heading⟧",
      "⟦Localized invitation⟧",
      "⟦Level 1⟧",
      "⟦1⟧",
      card.values[0].name,
    ])
      expect(painter.text).toHaveBeenCalledWith(
        expect.objectContaining({ value }),
      )
    expect(card.values[0].name).toBe("⟦Acceptance⟧")
    expect(card.copy.invitation).toBe(card.invitation)
  })

  it("copies presentation data without inventing rankings for an unplayed deck", () => {
    const card = model()
    expect(card.title).toBe("My Values")
    expect(card.hasComparisons).toBe(false)
    expect(getValuesCardMedals(card)).toEqual([])
    expect(card.values).toHaveLength(5)
    expect(card.values[0].name).toBe("Acceptance")
    expect(card.appearance).not.toBe(DEFAULT_HEROES99_APPEARANCE)
    expect(Object.isFrozen(card.values)).toBe(true)
    expect(card).not.toHaveProperty("playerData")
  })

  it("shares current-rank medal identity with the export scene without replacing rank or level labels", () => {
    const deck = createActiveDeck([])
    const ranked = rankValues(deck, createInitialValueProgress(deck))
    const card = createValuesCardModel(
      ranked.map((value, index) =>
        index === 0
          ? {
              ...value,
              progress: {
                ...value.progress,
                totalXp: 4,
                profileWins: 1,
                profileComparisons: 1,
                currentCycleWins: 1,
              },
            }
          : value,
      ),
      DEFAULT_HEROES99_APPEARANCE,
      { mode: "typography-only" },
      getLocaleCatalog("es-MX"),
    )
    expect(card.values.map(({ medal }) => medal)).toEqual(Array(5).fill("gold"))
    expect(getValuesCardMedals(card)).toEqual(["gold"])
    const painter: ValuesCardPainter = {
      rectangle: vi.fn(),
      sprite: vi.fn(),
      text: vi.fn(),
      measure: (value, size) => value.length * size * 0.52,
    }
    paintValuesCard({
      painter,
      model: card,
      palette: readValuesCardPalette([
        "#009dae",
        "#71dfe7",
        "#c2fff9",
        "#ffe652",
        "#18233e",
        "#384873",
        "#1e1e1e",
        "#ffffff",
      ]),
      frame: 0,
      hero: null,
    })
    expect(painter.sprite).toHaveBeenCalledTimes(5)
    expect(painter.sprite).toHaveBeenCalledWith(
      "gold",
      { x: 0, y: 0, width: 256, height: 256 },
      expect.objectContaining({ width: 72, height: 72 }),
      "smooth",
    )
    for (const value of card.values)
      for (const text of [value.name, value.rankLabel, value.levelLabel])
        expect(painter.text).toHaveBeenCalledWith(
          expect.objectContaining({ value: text }),
        )
  })

  it("uses complete idle loops including the hero rather than arbitrary frame truncation", () => {
    expect(getValuesCardLoopFrameCount(model(), true)).toBe(6)
    expect(getValuesCardLoopFrameCount(model(), false)).toBe(1)
    const card = {
      ...model(),
      values: model().values.map((value) => ({
        ...value,
        animal: {
          kind: "character" as const,
          animalId: "bat" as const,
          animationId: "idle",
          relativePath: "idle.png",
          asset: 1,
          frameCount: 8,
          frameWidth: 32,
          frameHeight: 32,
          visibleBounds: { left: 0, top: 0, width: 20, height: 20 },
        },
      })),
    }
    expect(getValuesCardLoopFrameCount(card, true)).toBe(24)
  })

  it("paints full-width mint, optional hero, exact names and only the approved invitation", () => {
    const painter: ValuesCardPainter = {
      rectangle: vi.fn(),
      sprite: vi.fn(),
      text: vi.fn(),
      measure: (value, size) => value.length * size * 0.52,
    }
    const card = model()
    const palette = readValuesCardPalette([
      "#009dae",
      "#71dfe7",
      "#c2fff9",
      "#ffe652",
      "#18233e",
      "#384873",
      "#1e1e1e",
      "#ffffff",
    ])
    paintValuesCard({ painter, model: card, palette, frame: 0, hero: null })
    expect(painter.rectangle).toHaveBeenCalledWith(
      { x: 12, y: 170, width: 1576, height: 610 },
      palette.values,
    )
    for (const { name } of card.values)
      expect(painter.text).toHaveBeenCalledWith(
        expect.objectContaining({ value: name }),
      )
    expect(painter.sprite).not.toHaveBeenCalled()
    expect(painter.text).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "Play free at WhatAreYourValuesMapache.com",
        weight: 700,
        size: 56,
        color: palette.invitationText,
      }),
    )
  })

  it("rejects unavailable theme data rather than creating an unrelated palette", () => {
    expect(() => readValuesCardPalette([undefined])).toThrow("colors")
  })

  it("fits the complete Spanish heading and invitation within both export renderers’ frame", () => {
    const spanish = getLocaleCatalog("es-MX")
    const painted: CardText[] = []
    const painter: ValuesCardPainter = {
      rectangle: vi.fn(),
      sprite: vi.fn(),
      text: (text) => painted.push(text),
      measure: (value, size) => value.length * size * 0.52,
    }
    paintValuesCard({
      painter,
      model: {
        ...model(),
        title: spanish.hub.rankedTitle,
        invitation: spanish.card.invitation,
      },
      palette: readValuesCardPalette([
        "#009dae",
        "#71dfe7",
        "#c2fff9",
        "#ffe652",
        "#18233e",
        "#384873",
        "#1e1e1e",
        "#ffffff",
      ]),
      frame: 0,
      hero: null,
    })
    for (const value of [spanish.hub.rankedTitle, spanish.card.invitation]) {
      const text = painted.find((entry) => entry.value === value)
      expect(text).toBeDefined()
      if (!text) throw new Error(`Missing card text: ${value}`)
      const width = painter.measure(text.value, text.size, text.weight)
      expect(text.x - width / 2).toBeGreaterThanOrEqual(48)
      expect(text.x + width / 2).toBeLessThanOrEqual(1552)
      expect(text.align).toBe("center")
    }
  })

  it("paints one ranked heading and an integrated invitation inside the frame", () => {
    const painter: ValuesCardPainter = {
      rectangle: vi.fn(),
      sprite: vi.fn(),
      text: vi.fn(),
      measure: (value, size) => value.length * size * 0.52,
    }
    const palette = readValuesCardPalette([
      "#009dae",
      "#71dfe7",
      "#c2fff9",
      "#ffe652",
      "#18233e",
      "#384873",
      "#1e1e1e",
      "#ffffff",
    ])
    paintValuesCard({
      painter,
      model: {
        ...model(),
        hasComparisons: true,
        title: "My Top Five Life Values",
      },
      palette,
      frame: 0,
      hero: null,
    })
    expect(painter.text).toHaveBeenCalledWith({
      value: "My Top Five Life Values",
      x: 800,
      y: 125,
      size: 96,
      weight: 900,
      color: palette.ink,
      align: "center",
    })
    expect(painter.text).not.toHaveBeenCalledWith(
      expect.objectContaining({ value: "Life Values" }),
    )
    expect(painter.rectangle).toHaveBeenLastCalledWith(
      { x: 12, y: 780, width: 1576, height: 108 },
      palette.invitationBackground,
    )
  })
})
