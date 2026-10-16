export type LocalizationIssueReason =
  | "missing"
  | "blank"
  | "invalid-type"
  | "invalid-value"
  | "formatter-failed"
  | "duplicate"
  | "unexpected-key"

export type LocalizationIssue = Readonly<{
  locale: string
  key: string
  reason: LocalizationIssueReason
  fallback: "english" | "emergency" | null
}>

export type LocalizationResolution<Value> = Readonly<{
  value: Value
  source: "selected" | "english" | "emergency"
  issues: readonly LocalizationIssue[]
}>

export function isLocalizationObject(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function readLocalizationField(value: unknown, key: string): unknown {
  return isLocalizationObject(value) && Object.hasOwn(value, key)
    ? value[key]
    : undefined
}

export function isLocalizedText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function textIssue(value: unknown): LocalizationIssueReason {
  if (value === undefined || value === null) return "missing"
  if (typeof value !== "string") return "invalid-type"
  return value.trim().length === 0 ? "blank" : "invalid-value"
}

function resolveCandidates<Value>(
  locale: string,
  key: string,
  selected: unknown,
  english: unknown,
  emergency: Value,
  isValid: (value: unknown) => value is Value,
  selectedIssue: LocalizationIssueReason,
  englishIssue: LocalizationIssueReason,
): LocalizationResolution<Value> {
  if (isValid(selected))
    return { value: selected, source: "selected", issues: [] }
  const source = isValid(english) ? "english" : "emergency"
  const issues: LocalizationIssue[] = [
    { locale, key, reason: selectedIssue, fallback: source },
  ]
  if (source === "emergency" && locale !== "en")
    issues.push({ locale: "en", key, reason: englishIssue, fallback: source })
  return {
    value: isValid(english) ? english : emergency,
    source,
    issues,
  }
}

export function resolveLocalizedText(
  locale: string,
  key: string,
  selected: unknown,
  english: unknown,
  emergency: string,
  isValid: (value: unknown) => value is string = isLocalizedText,
): LocalizationResolution<string> {
  return resolveCandidates(
    locale,
    key,
    selected,
    english,
    emergency,
    isValid,
    textIssue(selected),
    textIssue(english),
  )
}

export function isLocalizationLanguageTag(value: unknown): value is string {
  if (!isLocalizedText(value)) return false
  try {
    return Intl.getCanonicalLocales(value).length === 1
  } catch {
    return false
  }
}

export function resolveLocalizedTextList(
  locale: string,
  key: string,
  selected: unknown,
  english: unknown,
  emergency: readonly string[],
): LocalizationResolution<readonly string[]> {
  const isTextList = (value: unknown): value is readonly string[] =>
    Array.isArray(value) &&
    value.length > 0 &&
    Array.from(value).every(isLocalizedText)
  return resolveCandidates(
    locale,
    key,
    selected,
    english,
    emergency,
    isTextList,
    selected == null ? "missing" : "invalid-type",
    english == null ? "missing" : "invalid-type",
  )
}

function invokeLocalizedFormatter(
  formatter: unknown,
  parameters: readonly unknown[],
) {
  if (typeof formatter !== "function")
    return {
      value: undefined,
      reason:
        formatter == null ? ("missing" as const) : ("invalid-type" as const),
    }
  try {
    const value: unknown = formatter(...parameters)
    return { value, reason: textIssue(value) }
  } catch {
    return { value: undefined, reason: "formatter-failed" as const }
  }
}

export function resolveLocalizedFormatter<
  Parameters extends readonly unknown[],
>(
  locale: string,
  key: string,
  selected: unknown,
  english: unknown,
  emergency: (...parameters: Parameters) => string,
  parameters: Parameters,
): LocalizationResolution<string> {
  const result = invokeLocalizedFormatter(selected, parameters)
  if (isLocalizedText(result.value))
    return { value: result.value, source: "selected", issues: [] }
  const fallback = invokeLocalizedFormatter(english, parameters)
  return resolveCandidates(
    locale,
    key,
    result.value,
    fallback.value,
    emergency(...parameters),
    isLocalizedText,
    result.reason,
    fallback.reason,
  )
}
