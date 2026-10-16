import { describe, expect, it } from "vitest"
import {
  ENGLISH_INTERFACE_COPY,
  INTERFACE_FORMATTER_SAMPLES,
} from "./EnglishInterfaceCopy"
import { ENGLISH_LOCALIZATION_CATALOG } from "./EnglishLocalizationCatalog"
import { SHIPPED_LOCALES } from "./LocaleRegistry"
import { AUTHORED_LOCALIZATION_CATALOGS } from "./LocalizationCatalog"
import { isLocalizationObject } from "./LocalizationRecovery"
import { resolveLocalizationCatalog } from "./ResolveLocalizationCatalog"
import { resolveLocalizedResource } from "./ResolveLocalizedResource"

describe("shared interface localization", () => {
  it("rejects a blank authored source instead of teaching the quality gate to allow blanks", () => {
    const blank = { action: "" }
    const result = resolveLocalizedResource({
      locale: "en",
      key: "interfaceCopy.screen",
      reference: blank,
      selected: blank,
      english: blank,
      formatterSamples: {},
    })
    expect(result.issues).toContainEqual({
      locale: "en",
      key: "interfaceCopy.screen.action",
      reason: "blank",
      fallback: "emergency",
    })
    expect(result.value.action.trim()).not.toBe("")
  })
  it.each(SHIPPED_LOCALES)(
    "exercises every authored formatter in the raw %s catalog quality gate",
    (locale) => {
      const paths: string[] = []
      const visit = (value: unknown, path: string) => {
        if (typeof value === "function") {
          paths.push(path)
          const samples = INTERFACE_FORMATTER_SAMPLES[path]
          expect(samples, path).toBeDefined()
          expect(samples.length, path).toBeGreaterThan(0)
          for (const parameters of samples) {
            const output: unknown = value(...parameters)
            expect(typeof output, path).toBe("string")
            expect(output, path).not.toMatch(/undefined|null|NaN/)
            for (const parameter of parameters.flat()) {
              if (typeof parameter === "string") {
                expect(
                  String(output).toLocaleLowerCase(),
                  `${path}: ${parameter}`,
                ).toContain(parameter.toLocaleLowerCase())
              }
            }
          }
        } else if (Array.isArray(value)) {
          value.forEach((entry, index) => visit(entry, `${path}.${index}`))
        } else if (isLocalizationObject(value)) {
          for (const [key, entry] of Object.entries(value))
            visit(entry, `${path}.${key}`)
        }
      }
      visit(
        AUTHORED_LOCALIZATION_CATALOGS[locale].interfaceCopy,
        "interfaceCopy",
      )
      expect(paths.toSorted()).toEqual(
        Object.keys(INTERFACE_FORMATTER_SAMPLES).toSorted(),
      )
    },
  )

  it("keeps valid selected text while repairing nested blanks and preserving structural action IDs", () => {
    const english = ENGLISH_LOCALIZATION_CATALOG
    const selected = {
      ...english,
      interfaceCopy: {
        ...english.interfaceCopy,
        screen: {
          ...english.interfaceCopy.screen,
          close: "⟦Close⟧",
          cancel: " ",
        },
        menuDestinations: english.interfaceCopy.menuDestinations.map(
          (destination, index) =>
            index === 0
              ? { ...destination, id: "wrong-action", label: "⟦Destination⟧" }
              : destination,
        ),
      },
    }
    const result = resolveLocalizationCatalog("es-MX", selected)
    expect(result.catalog.interfaceCopy.screen.close).toBe("⟦Close⟧")
    expect(result.catalog.interfaceCopy.screen.cancel).toBe("Cancel")
    expect(result.catalog.interfaceCopy.menuDestinations[0]).toEqual({
      ...english.interfaceCopy.menuDestinations[0],
      label: "⟦Destination⟧",
    })
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          locale: "es-MX",
          key: "interfaceCopy.screen.cancel",
          reason: "blank",
          fallback: "english",
        },
        {
          locale: "es-MX",
          key: "interfaceCopy.menuDestinations.0.id",
          reason: "invalid-value",
          fallback: "english",
        },
      ]),
    )
    expect(selected.interfaceCopy.screen.cancel).toBe(" ")
  })

  it("recovers complete messages when both selected and English formatters fail without retaining private text", () => {
    const privateText = "A private player value"
    const damaged = {
      ...ENGLISH_LOCALIZATION_CATALOG,
      interfaceCopy: {
        ...ENGLISH_INTERFACE_COPY,
        screen: {
          ...ENGLISH_INTERFACE_COPY.screen,
          [privateText]: "unexpected",
          valueLevel: () => {
            throw new Error(privateText)
          },
          valueResult: () => false,
        },
        heroChoices: null,
        controlDescriptions: [],
      },
    }
    const result = resolveLocalizationCatalog("es-MX", damaged, damaged)
    expect(result.catalog.interfaceCopy.screen.valueLevel("12")).toBe(
      "Level 12",
    )
    expect(
      result.catalog.interfaceCopy.screen.valueResult(
        "3",
        privateText,
        "12",
        "400",
      ),
    ).toBe(`Rank 3, ${privateText}, Level 12, 400 total XP.`)
    expect(result.catalog.interfaceCopy.heroChoices.skin("2")).toBe("Skin 2")
    expect(result.catalog.interfaceCopy.controlDescriptions).toEqual(
      ENGLISH_INTERFACE_COPY.controlDescriptions,
    )
    expect(result.issues.length).toBeGreaterThan(0)
    expect(JSON.stringify(result.issues)).not.toContain(privateText)
    expect(result.issues).toContainEqual({
      locale: "es-MX",
      key: "interfaceCopy.heroChoices",
      reason: "missing",
      fallback: "emergency",
    })
  })

  it("contains a parameter-specific formatter defect when the actual player message is rendered", () => {
    const authored = {
      ...ENGLISH_LOCALIZATION_CATALOG,
      interfaceCopy: {
        ...ENGLISH_INTERFACE_COPY,
        screen: {
          ...ENGLISH_INTERFACE_COPY.screen,
          removeValue: (name: string) => {
            if (name === "Private “Craftsmanship”")
              throw new Error("Invalid branch")
            return `⟦Remove ${name}?⟧`
          },
        },
      },
    }
    const { catalog } = resolveLocalizationCatalog("es-MX", authored)
    expect(catalog.interfaceCopy.screen.removeValue("Fun")).toBe(
      "⟦Remove Fun?⟧",
    )
    expect(
      catalog.interfaceCopy.screen.removeValue("Private “Craftsmanship”"),
    ).toBe("Remove Private “Craftsmanship”?")
  })
})
