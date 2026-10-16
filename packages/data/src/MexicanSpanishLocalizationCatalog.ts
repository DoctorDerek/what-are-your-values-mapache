import type { AuthoredLocalizationCatalog } from "./LocalizationCatalog"
import { MEXICAN_SPANISH_INTERFACE_COPY } from "./MexicanSpanishInterfaceCopy"
import { MEXICAN_SPANISH_PRESENTATION_COPY } from "./MexicanSpanishPresentationCopy"
import { MEXICAN_SPANISH_VALUES } from "./MexicanSpanishValues"

export const MEXICAN_SPANISH_LOCALIZATION_CATALOG: AuthoredLocalizationCatalog =
  Object.freeze({
    ...MEXICAN_SPANISH_PRESENTATION_COPY,
    interfaceCopy: MEXICAN_SPANISH_INTERFACE_COPY,
    values: MEXICAN_SPANISH_VALUES,
  })
