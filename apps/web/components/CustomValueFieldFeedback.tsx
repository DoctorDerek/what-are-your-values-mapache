import type { CustomValueFieldValidation } from "@game/data/src/CustomValueValidation"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"

export default function CustomValueFieldFeedback({
  id,
  field,
  validation,
  maximumGraphemeCount,
  showValidationMessage,
}: {
  readonly id: string
  readonly field: "name" | "definition"
  readonly validation: CustomValueFieldValidation
  readonly maximumGraphemeCount: number
  readonly showValidationMessage: boolean
}) {
  const localizedCopy = useLocaleCatalog()
  const customValueValidationMessages =
    localizedCopy.interfaceCopy.customValueValidation

  const validationMessage = validation.validationCode
    ? customValueValidationMessages[field][validation.validationCode]
    : null

  return (
    <div id={id} className="flex flex-wrap items-start justify-between gap-2">
      <span className="text-sm font-bold">
        {localizedCopy.interfaceCopy.screen.characterCount(
          String(validation.graphemeCount),
          String(maximumGraphemeCount),
        )}
      </span>
      {showValidationMessage && validationMessage ? (
        <span role="alert" className="text-sm font-black text-black">
          {validationMessage}
        </span>
      ) : null}
    </div>
  )
}
