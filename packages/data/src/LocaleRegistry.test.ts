import { describe, expect, it } from "vitest"
import { createLocaleFormatters } from "./LocaleFormatters"
import { CANDIDATE_LOCALES, defineShippedLocales, resolveLocale, SHIPPED_LOCALES } from "./LocaleRegistry"

describe("locale resolution", () => {
  const shippedLocales = defineShippedLocales(["en", "es-MX", "fr"] as const)

  it("keeps candidates unavailable until explicitly shipped", () => {
    expect(CANDIDATE_LOCALES).toContain("es-MX")
    expect(SHIPPED_LOCALES).toEqual(["en"])
    expect(resolveLocale({ explicitLocale: "es-MX", preferredLanguages: ["fr"] })).toBe("en")
    expect(() => defineShippedLocales(["fr"])).toThrow("English")
    expect(() => defineShippedLocales(["en", "en"])).toThrow("duplicates")
  })

  it("prioritizes explicit selection, route, exact preferences, then safe base languages", () => {
    expect(resolveLocale({ shippedLocales, explicitLocale: "fr", routeLocale: "es-MX", preferredLanguages: ["en"] })).toBe("fr")
    expect(resolveLocale({ shippedLocales, explicitLocale: "de", routeLocale: "es-MX", preferredLanguages: ["fr"] })).toBe("es-MX")
    expect(resolveLocale({ shippedLocales, preferredLanguages: ["de", "es-mx", "fr"] })).toBe("es-MX")
    expect(resolveLocale({ shippedLocales, preferredLanguages: ["fr-CA", "es-MX"] })).toBe("es-MX")
    expect(resolveLocale({ shippedLocales, preferredLanguages: ["fr-CA"] })).toBe("fr")
    expect(resolveLocale({ shippedLocales, preferredLanguages: ["es-ES"] })).toBe("en")
    expect(resolveLocale({ shippedLocales, preferredLanguages: ["invalid_language", "", "en-US"] })).toBe("en")
    expect(resolveLocale()).toBe("en")
  })

  it("formats canonical numbers and UTC dates through Intl", () => {
    const english = createLocaleFormatters("en-US")
    expect(english.integer(1234)).toBe("1,234")
    expect(english.percent(0.25)).toBe("25%")
    expect(english.date("2026-10-13T00:00:00.000Z")).toBe("Oct 13, 2026")
    expect(english.plural(1)).toBe("one")
    expect(english.plural(2)).toBe("other")
    expect(createLocaleFormatters("de-DE").integer(1234)).toBe("1.234")
  })
})
