import { caseFold } from "unicode-case-folding"
import { LOCALIZATION_EMERGENCY_COPY } from "./LocalizationEmergencyCopy"
import { readLocalizationField, resolveLocalizedText } from "./LocalizationRecovery"

declare const canonicalValueIdBrand: unique symbol
declare const customValueIdBrand: unique symbol

export const CANONICAL_CATALOG_VERSION = "wayvm-103-v1" as const
export const SOURCE_CATALOG_VERSION = "pvcs-2011-100-v1" as const

export type CanonicalCatalogVersion =
  typeof CANONICAL_CATALOG_VERSION | typeof SOURCE_CATALOG_VERSION

export type CanonicalValueId = (`pvcs-2011:${string}` | `wayvm:${string}`) & {
  readonly [canonicalValueIdBrand]: "canonical"
}

export type CustomValueId = `custom:${string}` & {
  readonly [customValueIdBrand]: "custom"
}

export type ValueId = CanonicalValueId | CustomValueId

export type CanonicalValueDefinition = {
  readonly kind: "canonical"
  readonly id: CanonicalValueId
  readonly sourceOrdinal: number | null
  readonly catalogOrdinal: number
  readonly englishName: string
  readonly sourceDefinition: string
}

export type CustomValueDefinition = {
  readonly kind: "custom"
  readonly id: CustomValueId
  readonly name: string
  readonly definition: string
  readonly creationOrdinal: number
  readonly createdAt: string
  readonly updatedAt: string
}

export type ActiveValueDefinition =
  CanonicalValueDefinition | CustomValueDefinition

export type ValuePair = readonly [first: ValueId, second: ValueId]

export type LocalizedValueCopy = Readonly<{ name: string; definition: string }>

export function getValueDisplayName(
  value: ActiveValueDefinition,
  translations?: ReadonlyMap<CanonicalValueId, LocalizedValueCopy>,
) {
  if (value.kind === "custom") return value.name
  const selected = translations instanceof Map
    ? readLocalizationField(translations.get(value.id), "name")
    : value.englishName
  return resolveLocalizedText(
    "en", `values.${value.id}.name`, selected, value.englishName,
    `${LOCALIZATION_EMERGENCY_COPY.valueName} ${value.catalogOrdinal}`,
  ).value
}

export function getValueDisplayDefinition(
  value: ActiveValueDefinition,
  translations?: ReadonlyMap<CanonicalValueId, LocalizedValueCopy>,
) {
  if (value.kind === "custom") return value.definition
  const selected = translations instanceof Map
    ? readLocalizationField(translations.get(value.id), "definition")
    : value.sourceDefinition
  return resolveLocalizedText(
    "en", `values.${value.id}.definition`, selected, value.sourceDefinition, "",
  ).value
}

export function normalizeValueNameForComparison(value: string) {
  return caseFold(value.trim().replace(/\s+/gu, " ").normalize("NFKC"))
}

const canonicalValueIdPattern = /^(?:pvcs-2011|wayvm):[a-z0-9]+(?:-[a-z0-9]+)*$/
const customValueIdPattern =
  /^custom:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isCanonicalValueId(value: string): value is CanonicalValueId {
  return canonicalValueIdPattern.test(value)
}

export function isCanonicalCatalogVersion(
  value: unknown,
): value is CanonicalCatalogVersion {
  return value === CANONICAL_CATALOG_VERSION || value === SOURCE_CATALOG_VERSION
}

export function isCustomValueId(value: string): value is CustomValueId {
  return customValueIdPattern.test(value)
}

export function createCanonicalValueId(value: string) {
  if (!isCanonicalValueId(value)) {
    throw new Error(`Invalid canonical value ID: ${value}`)
  }

  return value
}

export function createCustomValueId(value: string) {
  if (!isCustomValueId(value)) {
    throw new Error(`Invalid Custom Value ID: ${value}`)
  }

  return value
}
