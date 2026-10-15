import { describe, expect, it } from "vitest"
import { createActiveDeck } from "./ActiveDeck"
import { CANONICAL_VALUES } from "./CanonicalValues"
import { introductionCopy } from "./IntroductionCopy"
import {
  getLocaleCatalog,
  SHIPPED_LANGUAGE_OPTIONS,
} from "./LocalizationCatalog"
import {
  createCustomValueId,
  getValueDisplayDefinition,
  getValueDisplayName,
  type CustomValueDefinition,
} from "./Value"
import { createInitialValueProgress } from "./ValueProgress"
import { rankValues } from "./ValueRanking"
import { filterRankedValuesByQuery } from "./ValueSearch"

describe("localization catalogs", () => {
  const english = getLocaleCatalog()
  it("reuses the unchanged English source and every canonical identity", () => {
    expect(english.introduction).toEqual(introductionCopy)
    expect(english.values.size).toBe(103)
    expect(SHIPPED_LANGUAGE_OPTIONS).toEqual([
      { value: "en", label: "English (US)" },
    ])
    for (const value of CANONICAL_VALUES) {
      expect(getValueDisplayName(value, english.values)).toBe(value.englishName)
      expect(getValueDisplayDefinition(value, english.values)).toBe(
        value.sourceDefinition,
      )
    }
  })

  it("retains canonical identity and meaning when a translation is absent", () => {
    const value = CANONICAL_VALUES[0]
    expect(getValueDisplayName(value, new Map())).toBe(value.englishName)
    expect(getValueDisplayDefinition(value, new Map())).toBe(value.sourceDefinition)
    const blank = new Map([[value.id, { name: " ", definition: "" }]])
    expect(getValueDisplayName(value, blank)).toBe(value.englishName)
    expect(getValueDisplayDefinition(value, blank)).toBe(value.sourceDefinition)
    expect(getValueDisplayName({ ...value, englishName: "" }, blank)).toBe("Value 1")
    expect(getValueDisplayDefinition({ ...value, sourceDefinition: "" }, blank)).toBe("")
  })

  it("searches localized and English meanings without translating private custom text or reordering ranks", () => {
    const source = CANONICAL_VALUES[0]
    const values = new Map(english.values)
    values.set(source.id, {
      name: "⟦Expanded localized value⟧",
      definition: "⟦Distinct localized meaning⟧",
    })
    const custom: CustomValueDefinition = {
      kind: "custom",
      id: createCustomValueId("custom:00000000-0000-4000-8000-000000000071"),
      name: "Private “Craftsmanship”",
      definition: "Mi significado privado.",
      creationOrdinal: 1,
      createdAt: "2026-10-13T00:00:00.000Z",
      updatedAt: "2026-10-13T00:00:00.000Z",
    }
    expect(getValueDisplayName(custom, values)).toBe(custom.name)
    expect(getValueDisplayDefinition(custom, values)).toBe(custom.definition)
    const deck = createActiveDeck([custom])
    const ranked = rankValues(deck, createInitialValueProgress(deck))
    expect(
      filterRankedValuesByQuery(ranked, "localized", values).map(
        ({ definition }) => definition.id,
      ),
    ).toEqual([source.id])
    expect(
      filterRankedValuesByQuery(ranked, source.englishName, values).some(
        ({ definition }) => definition.id === source.id,
      ),
    ).toBe(true)
    expect(
      filterRankedValuesByQuery(ranked, "privado", values).map(
        ({ definition }) => definition.id,
      ),
    ).toEqual([custom.id])
    expect(filterRankedValuesByQuery(ranked, "", values)).toBe(ranked)
  })
})
