export const CANDIDATE_LOCALES = [
  "en",
  "zh-Hans",
  "ru",
  "es-MX",
  "pt-BR",
  "de",
  "ko",
  "fr",
  "ja",
  "tr",
  "pl",
  "zh-Hant",
  "es-ES",
  "it",
  "th",
] as const

export type CandidateLocale = (typeof CANDIDATE_LOCALES)[number]
export const DEFAULT_LOCALE = "en" as const

export function defineShippedLocales<
  const Locales extends readonly CandidateLocale[],
>(locales: Locales) {
  if (
    !locales.includes(DEFAULT_LOCALE) ||
    new Set(locales).size !== locales.length
  )
    throw new Error(
      "Shipped locales must include English and contain no duplicates",
    )
  return Object.freeze(locales)
}

export const SHIPPED_LOCALES = defineShippedLocales([DEFAULT_LOCALE] as const)
export type SupportedLocale = (typeof SHIPPED_LOCALES)[number]

function canonicalizeLanguageTag(languageTag: string) {
  try {
    return Intl.getCanonicalLocales(languageTag)[0] ?? null
  } catch {
    return null
  }
}

export function resolveLocale<
  Locale extends CandidateLocale = SupportedLocale,
>({
  explicitLocale,
  routeLocale,
  preferredLanguages = [],
  shippedLocales = SHIPPED_LOCALES,
}: {
  readonly explicitLocale?: string | null
  readonly routeLocale?: string | null
  readonly preferredLanguages?: readonly string[]
  readonly shippedLocales?: readonly (Locale | typeof DEFAULT_LOCALE)[]
} = {}): Locale | typeof DEFAULT_LOCALE {
  const match = (languageTag: string | null | undefined) => {
    const canonicalTag = languageTag
      ? canonicalizeLanguageTag(languageTag)
      : null
    return shippedLocales.find((locale) => locale === canonicalTag)
  }
  const selected = match(explicitLocale) ?? match(routeLocale)
  if (selected) return selected
  const exact = preferredLanguages
    .map(match)
    .find((locale) => locale !== undefined)
  if (exact) return exact
  for (const languageTag of preferredLanguages) {
    const canonicalTag = canonicalizeLanguageTag(languageTag)
    if (!canonicalTag) continue
    const baseLanguage = canonicalTag.split("-")[0]
    const baseMatch = match(baseLanguage)
    if (baseMatch) return baseMatch
  }
  return DEFAULT_LOCALE
}
