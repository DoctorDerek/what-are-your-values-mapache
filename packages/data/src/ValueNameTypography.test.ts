import { describe, expect, it } from "vitest"
import { CANONICAL_VALUES } from "./CanonicalValues"
import { getLocaleCatalog } from "./LocalizationCatalog"
import { createCustomValueId, type CustomValueDefinition } from "./Value"
import { getWrappableValueDisplayName } from "./ValueNameTypography"

describe("Value name typography", () => {
  it("uses selected value text without applying English word breaks to another language", () => {
    const value = CANONICAL_VALUES[0]
    const translations = new Map([
      [
        value.id,
        { name: "Acceptance localizada", definition: "Selected meaning" },
      ],
    ])
    expect(getWrappableValueDisplayName(value, translations, "es-MX")).toBe(
      "Acceptance localizada",
    )
    expect(getWrappableValueDisplayName(value, translations, "en-US")).toBe(
      "Accep\u00adtance localizada",
    )
  })
  it("preserves every canonical name and identity while adding optional display breaks", () => {
    for (const value of CANONICAL_VALUES) {
      const original = { ...value }
      expect(getWrappableValueDisplayName(value).replaceAll("\u00ad", "")).toBe(
        value.englishName,
      )
      expect(value).toEqual(original)
    }
  })

  it("preserves all Spanish source names and supplies syllabic breaks for narrow Battle headings", () => {
    const catalog = getLocaleCatalog("es-MX")
    for (const value of CANONICAL_VALUES) {
      const original = catalog.values.get(value.id)!
      const displayName = getWrappableValueDisplayName(
        value,
        catalog.values,
        catalog.metadata.languageTag,
      )
      expect(displayName.replaceAll("\u00ad", "")).toBe(original.name)
      expect(displayName).not.toMatch(/[aeiouáéíóúü]\u00ad[aeiouáéíóúü]/iu)
      expect(catalog.values.get(value.id)).toBe(original)
    }
    for (const [name, expected] of [
      ["Cooperation", "Coo\u00adpe\u00adra\u00adción"],
      ["Independence", "Inde\u00adpen\u00adden\u00adcia"],
      ["Self-Knowledge", "Auto\u00adcono\u00adci\u00admien\u00adto"],
    ]) {
      const value = CANONICAL_VALUES.find(
        ({ englishName }) => englishName === name,
      )!
      expect(getWrappableValueDisplayName(value, catalog.values, "es-MX")).toBe(
        expected,
      )
    }
  })

  it("gives narrow-screen problem words meaningful optional breaks without replacing existing hyphens", () => {
    for (const [name, displayName] of [
      ["Mindfulness", "Mind\u00adful\u00adness"],
      ["Self-Acceptance", "Self-Accep\u00adtance"],
      ["Self-Knowledge", "Self-Knowl\u00adedge"],
      ["Non-Conformity", "Non-Con\u00adform\u00adity"],
    ]) {
      const value = CANONICAL_VALUES.find(
        ({ englishName }) => englishName === name,
      )!
      expect(getWrappableValueDisplayName(value)).toBe(displayName)
    }
  })

  it("does not apply the English catalog break dictionary to player-authored names", () => {
    const value: CustomValueDefinition = {
      kind: "custom",
      id: createCustomValueId("custom:00000000-0000-4000-8000-000000000001"),
      name: "Mindfulness / Autoconocimiento / 自由",
      definition: "My own meaning.",
      creationOrdinal: 1,
      createdAt: "2026-10-11T00:00:00.000Z",
      updatedAt: "2026-10-11T00:00:00.000Z",
    }
    expect(getWrappableValueDisplayName(value)).toBe(value.name)
    expect(getWrappableValueDisplayName(value, undefined, "es-MX")).toBe(
      value.name,
    )
  })
})
