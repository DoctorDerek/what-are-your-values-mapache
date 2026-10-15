import { describe, expect, it } from "vitest"
import { CANONICAL_VALUES } from "./CanonicalValues"
import { createLocaleFormatters } from "./LocaleFormatters"
import { SHIPPED_LOCALES } from "./LocaleRegistry"
import { AUTHORED_LOCALIZATION_CATALOGS } from "./LocalizationCatalog"
import type { LocalizationIssue } from "./LocalizationRecovery"
import { resolveLocalizationCatalog } from "./ResolveLocalizationCatalog"

describe("authored localization quality gate", () => {
  it("ships exactly the approved catalogs", () => {
    expect(Object.keys(AUTHORED_LOCALIZATION_CATALOGS)).toEqual(SHIPPED_LOCALES)
  })

  it.each(SHIPPED_LOCALES)("rejects every recovery diagnostic in authored %s", (locale) => {
    const authored = AUTHORED_LOCALIZATION_CATALOGS[locale]
    expect(resolveLocalizationCatalog(locale, authored).issues).toEqual([])
    expect(authored.values.map(([id]) => id).sort()).toEqual(
      CANONICAL_VALUES.map(({ id }) => id).sort(),
    )
    const issues: LocalizationIssue[] = []
    const formatters = createLocaleFormatters(authored.metadata.languageTag, (issue) => issues.push(issue))
    for (const value of [0, 1, 2, 103, 1000]) {
      expect(formatters.integer(value).trim()).not.toBe("")
      expect(formatters.percent(value / 1000).trim()).not.toBe("")
      expect(formatters.plural(value)).toBeTruthy()
      expect(authored.hub.level(value).trim()).not.toBe("")
      expect(authored.card.rank(String(value)).trim()).not.toBe("")
    }
    for (const format of ["gif", "png"] as const) {
      expect(authored.card.save(format).trim()).not.toBe("")
      expect(authored.card.share(format).trim()).not.toBe("")
    }
    expect(formatters.date("2026-10-15T00:00:00.000Z")).toBeTruthy()
    expect(issues).toEqual([])
  })
})
