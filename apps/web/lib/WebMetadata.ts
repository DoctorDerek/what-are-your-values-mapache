import {
  DEFAULT_LOCALE,
  SHIPPED_LOCALES,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import type { Metadata } from "next"
import {
  CANONICAL_WEB_ROOT_URL,
  getCanonicalLocaleUrl,
  isCanonicalProductionDeployment,
} from "@/lib/WebDistribution"

export const WEB_METADATA_TITLE = getLocaleCatalog().seo.title

export const WEB_METADATA_DESCRIPTION = getLocaleCatalog().seo.description

const SHIPPED_LANGUAGE_ALTERNATES = Object.freeze({
  ...Object.fromEntries(
    SHIPPED_LOCALES.map((locale) => [locale, getCanonicalLocaleUrl(locale)]),
  ),
  "x-default": CANONICAL_WEB_ROOT_URL,
} as const)

export function createWebMetadata(
  vercelEnvironment: string | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  const indexingIsPermitted = isCanonicalProductionDeployment(vercelEnvironment)
  const catalog = getLocaleCatalog(locale)
  const canonicalUrl = getCanonicalLocaleUrl(locale)

  return {
    metadataBase: new URL(CANONICAL_WEB_ROOT_URL),
    title: catalog.seo.title,
    description: catalog.seo.description,
    alternates: {
      canonical: canonicalUrl,
      languages: SHIPPED_LANGUAGE_ALTERNATES,
    },
    robots: {
      index: indexingIsPermitted,
      follow: indexingIsPermitted,
    },
    openGraph: {
      type: "website",
      locale: catalog.metadata.openGraphLocale,
      url: canonicalUrl,
      siteName: catalog.introduction.title,
      title: catalog.seo.title,
      description: catalog.seo.description,
    },
    twitter: {
      card: "summary",
      title: catalog.seo.title,
      description: catalog.seo.description,
    },
  } satisfies Metadata
}
