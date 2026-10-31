import {
  ENGLISH_INTERFACE_COPY,
  INTERFACE_FORMATTER_SAMPLES,
} from "./EnglishInterfaceCopy"
import { ENGLISH_LOCALIZATION_CATALOG } from "./EnglishLocalizationCatalog"
import type { LocalizationCatalog } from "./LocalizationCatalog"
import { LOCALIZATION_EMERGENCY_COPY as emergency } from "./LocalizationEmergencyCopy"
import {
  isLocalizationLanguageTag,
  isLocalizationObject,
  isLocalizedText,
  readLocalizationField,
  resolveLocalizedFormatter,
  resolveLocalizedText,
  resolveLocalizedTextList,
  type LocalizationIssue,
} from "./LocalizationRecovery"
import { resolveLocalizedValues } from "./LocalizedValues"
import { resolveLocalizedResource } from "./ResolveLocalizedResource"
import { VALUES_CARD_COPY } from "./ValuesCardCopy"

export function resolveLocalizationCatalog(
  locale: string,
  input: unknown,
  englishInput: unknown = ENGLISH_LOCALIZATION_CATALOG,
): Readonly<{
  catalog: LocalizationCatalog
  issues: readonly LocalizationIssue[]
}> {
  const issues: LocalizationIssue[] = []
  const field = (source: unknown, section: string, key: string) =>
    readLocalizationField(readLocalizationField(source, section), key)
  const text = (
    section: string,
    key: string,
    lastResort: string = emergency.unavailable,
    isValid = isLocalizedText,
  ) => {
    const resolution = resolveLocalizedText(
      locale,
      `${section}.${key}`,
      field(input, section, key),
      field(englishInput, section, key),
      lastResort,
      isValid,
    )
    issues.push(...resolution.issues)
    return resolution.value
  }
  const list = (
    section: string,
    key: string,
    lastResort: readonly string[],
  ) => {
    const resolution = resolveLocalizedTextList(
      locale,
      `${section}.${key}`,
      field(input, section, key),
      field(englishInput, section, key),
      lastResort,
    )
    issues.push(...resolution.issues)
    return Object.freeze([...resolution.value])
  }
  const formatter = <Parameters extends readonly unknown[]>(
    section: string,
    key: string,
    lastResort: (...parameters: Parameters) => string,
    samples: readonly Parameters[],
  ) => {
    const selected = field(input, section, key)
    const english = field(englishInput, section, key)
    const resolve = (parameters: Parameters) =>
      resolveLocalizedFormatter(
        locale,
        `${section}.${key}`,
        selected,
        english,
        lastResort,
        parameters,
      )
    for (const parameters of samples) issues.push(...resolve(parameters).issues)
    return (...parameters: Parameters) => resolve(parameters).value
  }
  const values = resolveLocalizedValues(
    locale,
    readLocalizationField(input, "values"),
    readLocalizationField(englishInput, "values"),
  )
  issues.push(...values.issues)
  const interfaceCopy = resolveLocalizedResource({
    locale,
    key: "interfaceCopy",
    reference: ENGLISH_INTERFACE_COPY,
    selected: readLocalizationField(input, "interfaceCopy"),
    english: readLocalizationField(englishInput, "interfaceCopy"),
    formatterSamples: INTERFACE_FORMATTER_SAMPLES,
  })
  issues.push(...interfaceCopy.issues)
  const formatLabel = (key: "gif" | "png") => {
    const resolution = resolveLocalizedResource({
      locale,
      key: `card.${key}`,
      reference: VALUES_CARD_COPY[key],
      selected: field(input, "card", key),
      english: field(englishInput, "card", key),
      formatterSamples: {},
    })
    issues.push(...resolution.issues)
    return resolution.value
  }
  const catalog: LocalizationCatalog = Object.freeze({
    interfaceCopy: interfaceCopy.value,
    metadata: Object.freeze({
      languageTag: text(
        "metadata",
        "languageTag",
        "en-US",
        isLocalizationLanguageTag,
      ),
      languageName: text("metadata", "languageName", emergency.english),
      webPath: text("metadata", "webPath", "/"),
      openGraphLocale: text("metadata", "openGraphLocale", "en_US"),
    }),
    introduction: Object.freeze({
      title: text("introduction", "title", emergency.title),
      tagline: text("introduction", "tagline", ""),
      body: list("introduction", "body", []),
      startAction: text("introduction", "startAction", emergency.start),
      closeAction: text("introduction", "closeAction", emergency.close),
      accessibleCloseLabel: text(
        "introduction",
        "accessibleCloseLabel",
        emergency.close,
      ),
    }),
    firstArrival: Object.freeze({
      titleLines: list("firstArrival", "titleLines", [emergency.title]),
      gameCredit: text("firstArrival", "gameCredit", ""),
      creatorCredit: text("firstArrival", "creatorCredit", ""),
      creatorWebsiteLabel: text(
        "firstArrival",
        "creatorWebsiteLabel",
        "DoctorDerek.com",
      ),
      websiteErrorTitle: text("firstArrival", "websiteErrorTitle"),
      websiteErrorMessage: text("firstArrival", "websiteErrorMessage"),
    }),
    language: Object.freeze({
      heading: text("language", "heading", emergency.language),
      closeAction: text("language", "closeAction", emergency.back),
    }),
    hub: Object.freeze({
      rankedTitle: text("hub", "rankedTitle", emergency.myValues),
      rankedTitleLines: list("hub", "rankedTitleLines", [emergency.myValues]),
      unrankedTitle: text("hub", "unrankedTitle", emergency.myValues),
      rankedList: text("hub", "rankedList", emergency.myValues),
      unrankedList: text("hub", "unrankedList", emergency.myValues),
      unrankedNotice: text("hub", "unrankedNotice", ""),
      remainingValues: text("hub", "remainingValues", emergency.myValues),
      battle: text("hub", "battle", emergency.battle),
      browse: text("hub", "browse", emergency.browse),
      add: text("hub", "add", emergency.add),
      actions: text("hub", "actions", emergency.actions),
      level: formatter("hub", "level", emergency.level, [[1], [2], [1000]]),
    }),
    card: Object.freeze({
      title: text("card", "title", emergency.shareCard),
      gif: formatLabel("gif"),
      png: formatLabel("png"),
      format: text("card", "format", emergency.imageFormat),
      includeHero: text("card", "includeHero", emergency.includeHero),
      includeLevels: text("card", "includeLevels", emergency.includeLevels),
      back: text("card", "back", emergency.back),
      preparing: text("card", "preparing"),
      delivering: text("card", "delivering"),
      retry: text("card", "retry", emergency.retry),
      failure: text("card", "failure"),
      deliveryFailure: text("card", "deliveryFailure"),
      unsupportedShare: text("card", "unsupportedShare"),
      downloadStarted: text("card", "downloadStarted"),
      handoff: text("card", "handoff"),
      saved: text("card", "saved"),
      cancelled: text("card", "cancelled"),
      details: text("card", "details", emergency.details),
      invitation: text("card", "invitation", ""),
      preview: text("card", "preview", emergency.preview),
      rank: formatter("card", "rank", emergency.rank, [["1"], ["103"]]),
      save: formatter("card", "save", emergency.save, [["gif"], ["png"]]),
      share: formatter("card", "share", emergency.share, [["gif"], ["png"]]),
    }),
    values: values.values,
    seo: Object.freeze({
      title: text("seo", "title", emergency.title),
      description: text("seo", "description", ""),
    }),
  })
  if (isLocalizationObject(input)) {
    for (const key of Object.keys(input)) {
      if (!Object.hasOwn(catalog, key))
        issues.push({
          locale,
          key: "[unexpected]",
          reason: "unexpected-key",
          fallback: null,
        })
    }
    for (const [section, copy] of Object.entries(catalog)) {
      const authoredSection = readLocalizationField(input, section)
      if (section === "values" || !isLocalizationObject(authoredSection))
        continue
      for (const key of Object.keys(authoredSection))
        if (!Object.hasOwn(copy, key))
          issues.push({
            locale,
            key: `${section}.[unexpected]`,
            reason: "unexpected-key",
            fallback: null,
          })
    }
  }
  return {
    catalog,
    issues: Object.freeze(
      issues
        .filter(
          (issue, index) =>
            issues.findIndex(
              (candidate) =>
                candidate.locale === issue.locale &&
                candidate.key === issue.key &&
                candidate.reason === issue.reason &&
                candidate.fallback === issue.fallback,
            ) === index,
        )
        .map((issue) => Object.freeze(issue)),
    ),
  }
}
