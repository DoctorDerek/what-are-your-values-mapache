import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import type { MetadataRoute } from "next"

export function createWebManifest(
  locale: SupportedLocale = DEFAULT_LOCALE,
): MetadataRoute.Manifest {
  const catalog = getLocaleCatalog(locale)
  return {
    id: "/",
    lang: catalog.metadata.languageTag,
    name: catalog.introduction.title,
    short_name: "WAYVM",
    description: catalog.introduction.tagline,
    start_url: catalog.metadata.webPath,
    scope: "/",
    display: "standalone",
    background_color: "#1e1e1e",
    theme_color: "#008b8b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
