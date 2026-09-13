import { validateCustomValueDraft } from "./CustomValueValidation"
import {
  normalizeValueNameForComparison,
  type CustomValueDefinition,
} from "./Value"

export type CustomValueDraft = Readonly<{ name: string; definition: string }>

export function validateCustomValueBatch(
  drafts: readonly CustomValueDraft[],
  existingCustomValues: readonly CustomValueDefinition[],
) {
  return drafts.map((draft, index) => {
    const validation = validateCustomValueDraft({
      ...draft,
      existingCustomValues,
    })
    const hasDraftDuplicate = drafts.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        normalizeValueNameForComparison(other.name) ===
          normalizeValueNameForComparison(draft.name),
    )
    return hasDraftDuplicate
      ? {
          ...validation,
          isValid: false,
          name: {
            ...validation.name,
            validationCode: "duplicate_name" as const,
          },
        }
      : validation
  })
}
