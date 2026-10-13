export function createLocaleFormatters(languageTag: string) {
  const integer = new Intl.NumberFormat(languageTag, { maximumFractionDigits: 0 })
  const percent = new Intl.NumberFormat(languageTag, { style: "percent" })
  const date = new Intl.DateTimeFormat(languageTag, { dateStyle: "medium", timeZone: "UTC" })
  const plural = new Intl.PluralRules(languageTag)
  return Object.freeze({
    integer: (value: number) => integer.format(value),
    percent: (value: number) => percent.format(value),
    date: (isoUtc: string) => date.format(new Date(isoUtc)),
    plural: (value: number) => plural.select(value),
  })
}
