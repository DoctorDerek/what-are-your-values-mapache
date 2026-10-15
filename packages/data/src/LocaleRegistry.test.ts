import { afterEach, describe, expect, it, vi } from "vitest"
import { createLocaleFormatters } from "./LocaleFormatters"
import {
  CANDIDATE_LOCALES,
  defineShippedLocales,
  resolveLocale,
  SHIPPED_LOCALES,
} from "./LocaleRegistry"
import type { LocalizationIssue } from "./LocalizationRecovery"

afterEach(() => vi.unstubAllGlobals())

describe("locale resolution", () => {
  const shippedLocales = defineShippedLocales(["en", "es-MX", "fr"] as const)

  it("keeps candidates unavailable until explicitly shipped", () => {
    expect(CANDIDATE_LOCALES).toContain("es-MX")
    expect(SHIPPED_LOCALES).toEqual(["en"])
    expect(
      resolveLocale({ explicitLocale: "es-MX", preferredLanguages: ["fr"] }),
    ).toBe("en")
    expect(() => defineShippedLocales(["fr"])).toThrow("English")
    expect(() => defineShippedLocales(["en", "en"])).toThrow("duplicates")
  })

  it("prioritizes explicit selection, route, exact preferences, then safe base languages", () => {
    expect(
      resolveLocale({
        shippedLocales,
        explicitLocale: "fr",
        routeLocale: "es-MX",
        preferredLanguages: ["en"],
      }),
    ).toBe("fr")
    expect(
      resolveLocale({
        shippedLocales,
        explicitLocale: "de",
        routeLocale: "es-MX",
        preferredLanguages: ["fr"],
      }),
    ).toBe("es-MX")
    expect(
      resolveLocale({
        shippedLocales,
        preferredLanguages: ["de", "es-mx", "fr"],
      }),
    ).toBe("es-MX")
    expect(
      resolveLocale({ shippedLocales, preferredLanguages: ["fr-CA", "es-MX"] }),
    ).toBe("es-MX")
    expect(
      resolveLocale({ shippedLocales, preferredLanguages: ["fr-CA"] }),
    ).toBe("fr")
    expect(
      resolveLocale({ shippedLocales, preferredLanguages: ["es-ES"] }),
    ).toBe("en")
    expect(
      resolveLocale({
        shippedLocales,
        preferredLanguages: ["invalid_language", "", "en-US"],
      }),
    ).toBe("en")
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

  it.each(["invalid_language", "zz-ZZ"])(
    "uses deterministic English for an invalid or unavailable language: %s",
    (languageTag) => {
      const issues: LocalizationIssue[] = []
      const formatter = createLocaleFormatters(languageTag, (issue) =>
        issues.push(issue),
      )
      expect(formatter.integer(1234)).toBe("1,234")
      expect(formatter.percent(0.25)).toBe("25%")
      expect(formatter.date("2026-10-15T00:00:00.000Z")).toBe("Oct 15, 2026")
      expect(formatter.plural(1)).toBe("one")
      expect(issues).toHaveLength(4)
      expect(
        issues.every(
          ({ locale, fallback }) =>
            locale === languageTag && fallback === "english",
        ),
      ).toBe(true)
    },
  )

  it("keeps required formatting usable without Intl and reports each fallback", () => {
    vi.stubGlobal("Intl", undefined)
    const issues: LocalizationIssue[] = []
    const formatter = createLocaleFormatters("en-US", (issue) =>
      issues.push(issue),
    )
    expect(formatter.integer(1234.5)).toBe("1235")
    expect(formatter.integer(-1.5)).toBe("-2")
    expect(formatter.percent(-0.125)).toBe("-13%")
    expect(formatter.date("2026-10-15T00:30:00.000+02:00")).toBe("2026-10-14")
    expect(formatter.plural(-1)).toBe("one")
    expect(formatter.plural(2)).toBe("other")
    expect(formatter.integer(Number.NaN)).toBe("Number unavailable")
    expect(formatter.percent(Number.POSITIVE_INFINITY)).toBe(
      "Number unavailable",
    )
    expect(formatter.date("invalid")).toBe("Date unavailable")
    expect(
      issues.filter(({ fallback }) => fallback === "emergency"),
    ).toHaveLength(9)
    expect(createLocaleFormatters("en-US").integer(7)).toBe("7")
  })

  it("contains formatting failures after construction without claiming a valid date", () => {
    const issues: LocalizationIssue[] = []
    const formatter = createLocaleFormatters("en-US", (issue) =>
      issues.push(issue),
    )
    expect(issues).toEqual([])
    expect(formatter.date("invalid")).toBe("Date unavailable")
    expect(issues).toEqual([
      {
        locale: "en-US",
        key: "formatters.date",
        reason: "formatter-failed",
        fallback: "english",
      },
      {
        locale: "en",
        key: "formatters.date",
        reason: "formatter-failed",
        fallback: "emergency",
      },
    ])
    expect(formatter.date("2026-10-15T00:00:00.000Z")).toBe("Oct 15, 2026")
  })
})
