import { CANONICAL_VALUES } from "./CanonicalValues"
import { FIRST_ARRIVAL_PRESENTATION } from "./FirstArrivalPresentation"
import { introductionCopy } from "./IntroductionCopy"
import {
  DEFAULT_LOCALE,
  SHIPPED_LOCALES,
  type SupportedLocale,
} from "./LocaleRegistry"
import { PERSONAL_HUB_COPY } from "./PersonalHubCopy"
import type { CanonicalValueId, LocalizedValueCopy } from "./Value"
import { VALUES_CARD_COPY } from "./ValuesCardCopy"

type LocalizedCopy<Copy> = {
  readonly [Key in keyof Copy]: Copy[Key] extends string
    ? string
    : Copy[Key] extends readonly string[]
      ? readonly string[]
      : Copy[Key]
}

export type LocalizationCatalog = Readonly<{
  metadata: Readonly<{
    languageTag: string
    languageName: string
    webPath: string
    openGraphLocale: string
  }>
  introduction: LocalizedCopy<typeof introductionCopy>
  firstArrival: LocalizedCopy<
    Pick<
      typeof FIRST_ARRIVAL_PRESENTATION,
      | "titleLines"
      | "gameCredit"
      | "creatorCredit"
      | "creatorWebsiteLabel"
      | "websiteErrorTitle"
      | "websiteErrorMessage"
    >
  >
  language: Readonly<{ heading: string; closeAction: string }>
  hub: LocalizedCopy<typeof PERSONAL_HUB_COPY>
  card: LocalizedCopy<typeof VALUES_CARD_COPY>
  values: ReadonlyMap<CanonicalValueId, LocalizedValueCopy>
  seo: Readonly<{ title: string; description: string }>
}>

export function defineLocalizedValues(
  entries: readonly (readonly [CanonicalValueId, LocalizedValueCopy])[],
): ReadonlyMap<CanonicalValueId, LocalizedValueCopy> {
  const values = new Map(
    entries.map(([id, copy]) => [id, Object.freeze({ ...copy })]),
  )
  if (
    values.size !== entries.length ||
    values.size !== CANONICAL_VALUES.length ||
    CANONICAL_VALUES.some(({ id }) => !values.has(id))
  )
    throw new Error(
      "Localized values must contain every canonical identity exactly once",
    )
  if (
    [...values.values()].some(
      ({ name, definition }) => !name.trim() || !definition.trim(),
    )
  )
    throw new Error("Localized value names and definitions must not be blank")
  return values
}

const englishCatalog: LocalizationCatalog = Object.freeze({
  metadata: Object.freeze({
    languageTag: "en-US",
    languageName: "English (US)",
    webPath: "/",
    openGraphLocale: "en_US",
  }),
  introduction: introductionCopy,
  firstArrival: Object.freeze({
    titleLines: FIRST_ARRIVAL_PRESENTATION.titleLines,
    gameCredit: FIRST_ARRIVAL_PRESENTATION.gameCredit,
    creatorCredit: FIRST_ARRIVAL_PRESENTATION.creatorCredit,
    creatorWebsiteLabel: FIRST_ARRIVAL_PRESENTATION.creatorWebsiteLabel,
    websiteErrorTitle: FIRST_ARRIVAL_PRESENTATION.websiteErrorTitle,
    websiteErrorMessage: FIRST_ARRIVAL_PRESENTATION.websiteErrorMessage,
  }),
  language: Object.freeze({ heading: "Language", closeAction: "Back" }),
  hub: PERSONAL_HUB_COPY,
  card: VALUES_CARD_COPY,
  values: defineLocalizedValues(
    CANONICAL_VALUES.map((value) => [
      value.id,
      { name: value.englishName, definition: value.sourceDefinition },
    ]),
  ),
  seo: Object.freeze({
    title:
      "What Are Your Values, Mapache? A Free Game To Find What You Value in Life",
    description:
      "What Are Your Values, Mapache? is a fast-paced, value-sorting autobattler to help you find out what you value in life.",
  }),
})

const shippedCatalogs = Object.freeze({ en: englishCatalog } satisfies Record<
  SupportedLocale,
  LocalizationCatalog
>)

export function getLocaleCatalog(
  locale: SupportedLocale = DEFAULT_LOCALE,
): LocalizationCatalog {
  return shippedCatalogs[locale]
}

export const SHIPPED_LANGUAGE_OPTIONS = Object.freeze(
  SHIPPED_LOCALES.map((locale) =>
    Object.freeze({
      value: locale,
      label: getLocaleCatalog(locale).metadata.languageName,
    }),
  ),
)
