import { LOCALIZATION_EMERGENCY_COPY } from "./LocalizationEmergencyCopy"
import {
  isLocalizationObject,
  isLocalizedText,
  readLocalizationField,
  resolveLocalizedFormatter,
  resolveLocalizedText,
  type LocalizationIssue,
} from "./LocalizationRecovery"

const structuralKeys = new Set([
  "id",
  "kind",
  "value",
  "command",
  "actionId",
  "url",
])

function matchesResourceShape<Resource>(
  value: unknown,
  reference: Resource,
): value is Resource {
  if (Array.isArray(reference))
    return (
      Array.isArray(value) &&
      value.length === reference.length &&
      Array.from(reference).every((entry, index) =>
        matchesResourceShape(value[index], entry),
      )
    )
  if (isLocalizationObject(reference))
    return (
      isLocalizationObject(value) &&
      Object.keys(value).length === Object.keys(reference).length &&
      Object.entries(reference).every(([key, entry]) =>
        matchesResourceShape(readLocalizationField(value, key), entry),
      )
    )
  return typeof value === typeof reference
}

export function resolveLocalizedResource<Resource>({
  locale,
  key,
  reference,
  selected,
  english,
  formatterSamples,
}: {
  readonly locale: string
  readonly key: string
  readonly reference: Resource
  readonly selected: unknown
  readonly english: unknown
  readonly formatterSamples: Readonly<
    Record<string, readonly (readonly unknown[])[]>
  >
}): Readonly<{ value: Resource; issues: readonly LocalizationIssue[] }> {
  const issues: LocalizationIssue[] = []
  const recover = (
    path: string,
    shape: unknown,
    candidate: unknown,
    fallback: unknown,
    structural = false,
  ): unknown => {
    if (typeof shape === "string") {
      const allowsEmpty =
        path === "interfaceCopy.customValueValidation.definition.duplicate_name"
      const resolution = resolveLocalizedText(
        locale,
        path,
        candidate,
        fallback,
        allowsEmpty || isLocalizedText(shape)
          ? shape
          : LOCALIZATION_EMERGENCY_COPY.unavailable,
        (value): value is string =>
          typeof value === "string" &&
          (structural
            ? value === shape
            : allowsEmpty || isLocalizedText(value)),
      )
      issues.push(...resolution.issues)
      return resolution.value
    }
    if (typeof shape === "function") {
      const resolve = (parameters: readonly unknown[]) =>
        resolveLocalizedFormatter(
          locale,
          path,
          candidate,
          fallback,
          (...values) =>
            resolveLocalizedFormatter<readonly unknown[]>(
              locale,
              path,
              shape,
              undefined,
              () => LOCALIZATION_EMERGENCY_COPY.unavailable,
              values,
            ).value,
          parameters,
        )
      for (const parameters of formatterSamples[path] ?? [[]])
        issues.push(...resolve(parameters).issues)
      return (...parameters: readonly unknown[]) => resolve(parameters).value
    }
    if (Array.isArray(shape)) {
      if (!Array.isArray(candidate) || candidate.length !== shape.length)
        issues.push({
          locale,
          key: path,
          reason: candidate == null ? "missing" : "invalid-value",
          fallback:
            Array.isArray(fallback) && fallback.length === shape.length
              ? "english"
              : "emergency",
        })
      return Object.freeze(
        Array.from(shape, (entry, index) =>
          recover(
            `${path}.${index}`,
            entry,
            Array.isArray(candidate) ? candidate[index] : undefined,
            Array.isArray(fallback) ? fallback[index] : undefined,
          ),
        ),
      )
    }
    if (isLocalizationObject(shape)) {
      if (!isLocalizationObject(candidate))
        issues.push({
          locale,
          key: path,
          reason: candidate == null ? "missing" : "invalid-type",
          fallback: isLocalizationObject(fallback) ? "english" : "emergency",
        })
      if (isLocalizationObject(candidate))
        for (const field of Object.keys(candidate))
          if (!Object.hasOwn(shape, field))
            issues.push({
              locale,
              key: `${path}.[unexpected]`,
              reason: "unexpected-key",
              fallback: null,
            })
      return Object.freeze(
        Object.fromEntries(
          Object.entries(shape).map(([field, entry]) => [
            field,
            recover(
              `${path}.${field}`,
              entry,
              readLocalizationField(candidate, field),
              readLocalizationField(fallback, field),
              structuralKeys.has(field),
            ),
          ]),
        ),
      )
    }
    if (candidate !== shape)
      issues.push({
        locale,
        key: path,
        reason: "invalid-value",
        fallback: null,
      })
    return shape
  }
  const value = recover(key, reference, selected, english)
  return {
    value: matchesResourceShape(value, reference) ? value : reference,
    issues: Object.freeze(issues),
  }
}
