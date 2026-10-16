"use client"

import { useLocalePreference } from "@game/utils/src/LocaleContext"
import { SHIPPED_LOCALES } from "./LocaleRegistry"
import {
  getLocaleCatalog,
  type LocalizationCatalog,
} from "./LocalizationCatalog"

export default function useLocaleCatalog(override?: LocalizationCatalog) {
  const locale = useLocalePreference()
  return (
    override ??
    getLocaleCatalog(SHIPPED_LOCALES.find((candidate) => candidate === locale))
  )
}
