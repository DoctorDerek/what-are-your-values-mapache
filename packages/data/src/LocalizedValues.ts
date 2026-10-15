import { CANONICAL_VALUES } from "./CanonicalValues"
import { LOCALIZATION_EMERGENCY_COPY } from "./LocalizationEmergencyCopy"
import {
  isLocalizationObject,
  readLocalizationField,
  resolveLocalizedText,
  type LocalizationIssue,
} from "./LocalizationRecovery"
import type { CanonicalValueId, LocalizedValueCopy } from "./Value"

function readValueEntries(input: unknown, locale: string) {
  const entries = new Map<string, unknown>()
  const canonicalIds: ReadonlySet<string> = new Set(
    CANONICAL_VALUES.map((value) => value.id),
  )
  const issues: LocalizationIssue[] = []
  if (!Array.isArray(input)) {
    issues.push({
      locale,
      key: "values",
      reason: input == null ? "missing" : "invalid-type",
      fallback: "english",
    })
    return { entries, issues }
  }
  for (const [index, entry] of input.entries()) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      typeof entry[0] !== "string"
    ) {
      issues.push({
        locale,
        key: `values[${index}]`,
        reason: "invalid-type",
        fallback: null,
      })
      continue
    }
    const [id, copy]: [string, unknown] = [entry[0], entry[1]]
    if (!canonicalIds.has(id)) {
      issues.push({
        locale,
        key: `values[${index}]`,
        reason: "unexpected-key",
        fallback: null,
      })
      continue
    }
    if (entries.has(id)) {
      issues.push({
        locale,
        key: `values.${id}`,
        reason: "duplicate",
        fallback: null,
      })
      continue
    }
    entries.set(id, copy)
    if (isLocalizationObject(copy))
      for (const key of Object.keys(copy))
        if (key !== "name" && key !== "definition")
          issues.push({
            locale,
            key: `values.${id}.[unexpected]`,
            reason: "unexpected-key",
            fallback: null,
          })
  }
  return { entries, issues }
}

export function resolveLocalizedValues(
  locale: string,
  input: unknown,
  englishInput: unknown,
): Readonly<{
  values: ReadonlyMap<CanonicalValueId, LocalizedValueCopy>
  issues: readonly LocalizationIssue[]
}> {
  const selected = readValueEntries(input, locale)
  const english = readValueEntries(englishInput, "en")
  const issues = [...selected.issues]
  const values = new Map<CanonicalValueId, LocalizedValueCopy>()
  for (const value of CANONICAL_VALUES) {
    const selectedCopy = selected.entries.get(value.id)
    const englishCopy = english.entries.get(value.id)
    const name = resolveLocalizedText(
      locale,
      `values.${value.id}.name`,
      readLocalizationField(selectedCopy, "name"),
      readLocalizationField(englishCopy, "name"),
      resolveLocalizedText(
        "en",
        `values.${value.id}.name`,
        value.englishName,
        undefined,
        `${LOCALIZATION_EMERGENCY_COPY.valueName} ${value.catalogOrdinal}`,
      ).value,
    )
    const definition = resolveLocalizedText(
      locale,
      `values.${value.id}.definition`,
      readLocalizationField(selectedCopy, "definition"),
      readLocalizationField(englishCopy, "definition"),
      resolveLocalizedText(
        "en",
        `values.${value.id}.definition`,
        value.sourceDefinition,
        undefined,
        "",
      ).value,
    )
    issues.push(...name.issues, ...definition.issues)
    values.set(
      value.id,
      Object.freeze({ name: name.value, definition: definition.value }),
    )
  }
  return { values, issues: Object.freeze(issues) }
}
