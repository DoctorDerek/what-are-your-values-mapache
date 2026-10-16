import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeCustomValueDeleteConfirmation({
  displayName,
  isPersistencePending,
  onCancel,
  onConfirm,
}: {
  readonly displayName: string
  readonly isPersistencePending: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
}) {
  const localizedCopy = useLocaleCatalog()

  return (
    <View
      accessibilityLabel={localizedCopy.interfaceCopy.screen.removeValue(
        displayName,
      )}
      accessibilityRole="alert"
      className="border-mapache-vivid-secondary-red gap-4 border-4 bg-white p-4"
    >
      <Text
        accessibilityRole="header"
        className="text-2xl font-black text-black uppercase"
      >
        {localizedCopy.interfaceCopy.screen.removeValue(displayName)}
      </Text>
      <Text className="text-base leading-6 font-bold text-black">
        {localizedCopy.interfaceCopy.screen.customDeleteConsequences}
      </Text>
      <View className="flex-row gap-3">
        <Button
          className="min-w-0 flex-1"
          disabled={isPersistencePending}
          variant="secondary"
          onPress={onCancel}
        >
          <Text>{localizedCopy.interfaceCopy.screen.cancel}</Text>
        </Button>
        <Button
          className="min-w-0 flex-1"
          disabled={isPersistencePending}
          variant="destructive"
          onPress={onConfirm}
        >
          <Text>
            {isPersistencePending
              ? localizedCopy.interfaceCopy.screen.deleting
              : localizedCopy.interfaceCopy.screen.removeValueAction}
          </Text>
        </Button>
      </View>
    </View>
  )
}
