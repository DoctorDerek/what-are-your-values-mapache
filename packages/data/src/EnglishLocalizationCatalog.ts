import { CANONICAL_VALUES } from "./CanonicalValues"
import { ENGLISH_INTERFACE_COPY } from "./EnglishInterfaceCopy"
import { FIRST_ARRIVAL_PRESENTATION } from "./FirstArrivalPresentation"
import { introductionCopy } from "./IntroductionCopy"
import type { AuthoredLocalizationCatalog } from "./LocalizationCatalog"
import { PERSONAL_HUB_COPY } from "./PersonalHubCopy"
import { VALUES_CARD_COPY } from "./ValuesCardCopy"

export const ENGLISH_LOCALIZATION_CATALOG: AuthoredLocalizationCatalog =
  Object.freeze({
    interfaceCopy: ENGLISH_INTERFACE_COPY,
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
    values: Object.freeze(
      CANONICAL_VALUES.map((value) =>
        Object.freeze([
          value.id,
          Object.freeze({
            name: value.englishName,
            definition: value.sourceDefinition,
          }),
        ] as const),
      ),
    ),
    seo: Object.freeze({
      title:
        "What Are Your Values, Mapache? A Free Game To Find What You Value in Life",
      description:
        "What Are Your Values, Mapache? is a fast-paced, value-sorting autobattler to help you find out what you value in life.",
    }),
  })
