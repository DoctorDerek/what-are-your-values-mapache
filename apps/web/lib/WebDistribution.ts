import {
  DEFAULT_LOCALE,
  SHIPPED_LOCALES,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"

export const CANONICAL_WEB_ORIGIN =
  "https://whatareyourvaluesmapache.com" as const

export const SHIPPED_ENGLISH_WEB_PATH =
  getLocaleCatalog(DEFAULT_LOCALE).metadata.webPath

export const CANONICAL_WEB_ROOT_URL =
  `${CANONICAL_WEB_ORIGIN}${SHIPPED_ENGLISH_WEB_PATH}` as const

export function getCanonicalLocaleUrl(locale: SupportedLocale) {
  return new URL(
    getLocaleCatalog(locale).metadata.webPath,
    CANONICAL_WEB_ORIGIN,
  ).href
}

export function getWebRouteLocale(localePath: readonly string[] = []) {
  const pathname = `/${localePath.join("/")}`
  return SHIPPED_LOCALES.find(
    (locale) => getLocaleCatalog(locale).metadata.webPath === pathname,
  )
}

export function getStaticLocaleRouteParams() {
  return SHIPPED_LOCALES.map((locale) => ({
    localePath: getLocaleCatalog(locale)
      .metadata.webPath.split("/")
      .filter(Boolean),
  }))
}

export function isCanonicalProductionDeployment(
  vercelEnvironment: string | undefined,
) {
  return vercelEnvironment === "production"
}
