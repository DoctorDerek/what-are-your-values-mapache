import { describe, expect, it, vi } from "vitest"
import { createActiveDeck } from "./ActiveDeck"
import { DEFAULT_HEROES99_APPEARANCE } from "./Heroes99Appearance"
import { getLocaleCatalog } from "./LocalizationCatalog"
import { createInitialValueProgress } from "./ValueProgress"
import { rankValues } from "./ValueRanking"
import { createValuesCardModel, readValuesCardPalette } from "./ValuesCard"
import {
  getValuesCardLoopFrameCount,
  paintValuesCard,
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
    expect(card.values).toHaveLength(5)
    expect(card.values[0].name).toBe("Acceptance")
    expect(card.appearance).not.toBe(DEFAULT_HEROES99_APPEARANCE)
    expect(Object.isFrozen(card.values)).toBe(true)
    expect(card).not.toHaveProperty("playerData")
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
