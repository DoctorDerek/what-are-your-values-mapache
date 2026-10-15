import { LOCALIZATION_EMERGENCY_COPY } from "./LocalizationEmergencyCopy"
import type { LocalizationIssue } from "./LocalizationRecovery"

type ReportFormattingIssue = (issue: LocalizationIssue) => void

function createFormattingOperation<Input, Output extends string>(
  languageTag: string,
  key: string,
  create: (languageTag: string) => (value: Input) => Output,
  emergency: (value: Input) => Output,
  reportIssue?: ReportFormattingIssue,
) {
  let selected: ((value: Input) => Output) | undefined
  try {
    if (Intl.NumberFormat.supportedLocalesOf(languageTag).length === 0)
      throw new RangeError("Unsupported formatting language")
    selected = create(languageTag)
  } catch {
    reportIssue?.({ locale: languageTag, key, reason: "formatter-failed", fallback: "english" })
  }
  return (value: Input): Output => {
    if (selected) {
      try {
        return selected(value)
      } catch {
        reportIssue?.({ locale: languageTag, key, reason: "formatter-failed", fallback: "english" })
      }
    }
    try {
      return create("en-US")(value)
    } catch {
      reportIssue?.({ locale: "en", key, reason: "formatter-failed", fallback: "emergency" })
      return emergency(value)
    }
  }
}

export function createLocaleFormatters(
  languageTag: string,
  reportIssue?: ReportFormattingIssue,
) {
  const integer = createFormattingOperation(
    languageTag, "formatters.integer",
    (locale) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format,
    (value: number) => Number.isFinite(value)
      ? String(Math.sign(value) * Math.round(Math.abs(value)))
      : LOCALIZATION_EMERGENCY_COPY.numberUnavailable,
    reportIssue,
  )
  const percent = createFormattingOperation(
    languageTag, "formatters.percent",
    (locale) => new Intl.NumberFormat(locale, { style: "percent" }).format,
    (value: number) => Number.isFinite(value)
      ? `${Math.sign(value) * Math.round(Math.abs(value) * 100)}%`
      : LOCALIZATION_EMERGENCY_COPY.numberUnavailable,
    reportIssue,
  )
  const date = createFormattingOperation(
    languageTag, "formatters.date",
    (locale) => {
      const formatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
      return (isoUtc: string) => formatter.format(new Date(isoUtc))
    },
    (isoUtc: string) => {
      const parsed = new Date(isoUtc)
      return Number.isFinite(parsed.getTime())
        ? parsed.toISOString().slice(0, 10)
        : LOCALIZATION_EMERGENCY_COPY.dateUnavailable
    },
    reportIssue,
  )
  const plural = createFormattingOperation(
    languageTag, "formatters.plural",
    (locale) => {
      const formatter = new Intl.PluralRules(locale)
      return (value: number) => formatter.select(value)
    },
    (value: number): Intl.LDMLPluralRule => Math.abs(value) === 1 ? "one" : "other",
    reportIssue,
  )
  return Object.freeze({ integer, percent, date, plural })
}
