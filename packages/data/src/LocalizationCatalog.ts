import { ENGLISH_LOCALIZATION_CATALOG } from "./EnglishLocalizationCatalog"
import { FIRST_ARRIVAL_PRESENTATION } from "./FirstArrivalPresentation"
import { introductionCopy } from "./IntroductionCopy"
import {
  DEFAULT_LOCALE,
  SHIPPED_LOCALES,
  type SupportedLocale,
} from "./LocaleRegistry"
import { PERSONAL_HUB_COPY } from "./PersonalHubCopy"
import { resolveLocalizationCatalog } from "./ResolveLocalizationCatalog"
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

export type AuthoredLocalizationCatalog = Omit<LocalizationCatalog, "values"> &
  Readonly<{
    values: readonly (readonly [CanonicalValueId, LocalizedValueCopy])[]
  }>

export const AUTHORED_LOCALIZATION_CATALOGS = Object.freeze({
  en: ENGLISH_LOCALIZATION_CATALOG,
} satisfies Record<SupportedLocale, AuthoredLocalizationCatalog>)

export const LOCALIZATION_CATALOG_RESOLUTIONS = Object.freeze({
  en: resolveLocalizationCatalog("en", AUTHORED_LOCALIZATION_CATALOGS.en),
} satisfies Record<
  SupportedLocale,
  ReturnType<typeof resolveLocalizationCatalog>
>)

export function getLocaleCatalog(
  locale: SupportedLocale = DEFAULT_LOCALE,
): LocalizationCatalog {
  return (
    LOCALIZATION_CATALOG_RESOLUTIONS[locale] ??
    LOCALIZATION_CATALOG_RESOLUTIONS.en
  ).catalog
}

export const SHIPPED_LANGUAGE_OPTIONS = Object.freeze(
  SHIPPED_LOCALES.map((locale) =>
    Object.freeze({
      value: locale,
      label: getLocaleCatalog(locale).metadata.languageName,
    }),
  ),
)
