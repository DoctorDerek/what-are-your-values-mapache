import {
  DEFAULT_LOCALE,
  SHIPPED_LOCALES,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import {
  getWebEntryRedirect,
  PERMANENT_WEB_REDIRECTS,
} from "@/lib/WebEntryRedirects"

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
  const destination = getWebEntryRedirect(pathname)?.to ?? pathname
  return SHIPPED_LOCALES.find(
    (locale) => getLocaleCatalog(locale).metadata.webPath === destination,
  )
}

export function getStaticLocaleRouteParams() {
  return [
    ...SHIPPED_LOCALES.map(
      (locale) => getLocaleCatalog(locale).metadata.webPath,
    ),
    ...PERMANENT_WEB_REDIRECTS.map((redirect) => redirect.from),
  ].map((pathname) => ({
    localePath: pathname.split("/").filter(Boolean),
  }))
}

export function isCanonicalProductionDeployment(
  vercelEnvironment: string | undefined,
) {
  return vercelEnvironment === "production"
}
