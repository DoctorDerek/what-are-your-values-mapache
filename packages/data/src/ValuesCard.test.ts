import { DEFAULT_HEROES99_APPEARANCE } from "./Heroes99Appearance"
import { createActiveDeck } from "./ActiveDeck"
import { createInitialValueProgress } from "./ValueProgress"
import { rankValues } from "./ValueRanking"
import { createValuesCardModel, readValuesCardPalette } from "./ValuesCard"
import { getValuesCardLoopFrameCount, paintValuesCard, type ValuesCardPainter } from "./ValuesCardScene"
import { describe, expect, it, vi } from "vitest"

function model() {
  const deck = createActiveDeck([])
  return createValuesCardModel(rankValues(deck, createInitialValueProgress(deck)), DEFAULT_HEROES99_APPEARANCE, { mode: "typography-only" })
}

describe("values-card composition", () => {
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
    const card = { ...model(), values: model().values.map((value) => ({ ...value, animal: {
      kind: "character" as const, animalId: "bat" as const, animationId: "idle", relativePath: "idle.png", asset: 1,
      frameCount: 8, frameWidth: 32, frameHeight: 32, visibleBounds: { left: 0, top: 0, width: 20, height: 20 },
    } })) }
    expect(getValuesCardLoopFrameCount(card, true)).toBe(24)
  })

  it("paints full-width mint, optional hero, exact names and only the approved invitation", () => {
    const painter: ValuesCardPainter = { rectangle: vi.fn(), sprite: vi.fn(), text: vi.fn(), measure: (value, size) => value.length * size * 0.52 }
    const card = model()
    const palette = readValuesCardPalette(["#009dae", "#71dfe7", "#c2fff9", "#ffe652", "#18233e", "#384873"])
    paintValuesCard({ painter, model: card, palette, frame: 0, hero: null })
    expect(painter.rectangle).toHaveBeenCalledWith({ x: 12, y: 170, width: 1576, height: 610 }, palette.values)
    for (const { name } of card.values) expect(painter.text).toHaveBeenCalledWith(expect.objectContaining({ value: name }))
    expect(painter.sprite).not.toHaveBeenCalled()
    expect(painter.text).toHaveBeenCalledWith(expect.objectContaining({ value: "Play free at WhatAreYourValuesMapache.com", weight: 700 }))
  })

  it("rejects unavailable theme data rather than creating an unrelated palette", () => {
    expect(() => readValuesCardPalette([undefined])).toThrow("colors")
  })
})
