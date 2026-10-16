import type { CustomValueFieldValidation } from "@game/data/src/CustomValueValidation"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { View } from "react-native"
import { Text } from "@/components/ui/text"

export default function NativeCustomValueFieldFeedback({
  field,
  maximumGraphemeCount,
  showValidationMessage,
  validation,
}: {
  readonly field: "name" | "definition"
  readonly maximumGraphemeCount: number
  readonly showValidationMessage: boolean
  readonly validation: CustomValueFieldValidation
}) {
  const localizedCopy = useLocaleCatalog()
  const customValueValidationMessages =
    localizedCopy.interfaceCopy.customValueValidation

  const validationMessage = validation.validationCode
    ? customValueValidationMessages[field][validation.validationCode]
    : null

  return (
    <View className="flex-row flex-wrap items-start justify-between gap-2">
      <Text className="text-sm font-bold text-black">
        {localizedCopy.interfaceCopy.screen.characterCount(
          String(validation.graphemeCount),
          String(maximumGraphemeCount),
        )}
      </Text>
      {showValidationMessage && validationMessage ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          className="min-w-0 flex-1 text-right text-sm font-black text-red-700"
        >
          {validationMessage}
        </Text>
      ) : null}
    </View>
  )
}
