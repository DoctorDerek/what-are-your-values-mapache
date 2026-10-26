import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { ScrollView, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeCustomValueDeleteConfirmation({
  displayName,
  isPersistencePending,
  onCancel,
  onConfirm,
  persistenceIssue = null,
}: {
  readonly displayName: string
  readonly isPersistencePending: boolean
  readonly onCancel: () => void
  readonly onConfirm: () => void
  readonly persistenceIssue?: string | null
}) {
  const localizedCopy = useLocaleCatalog()

  return (
    <View
      accessibilityLabel={localizedCopy.interfaceCopy.screen.removeValue(
        displayName,
      )}
      accessibilityRole="alert"
      className="border-mapache-vivid-secondary-red min-h-0 flex-1 border-4 bg-white"
    >
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName="gap-4 p-4"
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
        {persistenceIssue && (
          <Text
            accessibilityRole="alert"
            className="bg-mapache-vivid-primary-orange p-3 font-bold text-black"
          >
            {localizedCopy.interfaceCopy.screen.changeNotSaved}
          </Text>
        )}
      </ScrollView>
      <View className="shrink-0 flex-row flex-wrap gap-3 border-t-4 border-black p-3 pb-5">
        <Button
          size="compact"
          className="basis-readable-action min-w-0 shrink grow"
          disabled={isPersistencePending}
          variant="secondary"
          onPress={onCancel}
        >
          <Text>{localizedCopy.interfaceCopy.screen.cancel}</Text>
        </Button>
        <Button
          size="compact"
          className="basis-readable-action min-w-0 shrink grow"
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
