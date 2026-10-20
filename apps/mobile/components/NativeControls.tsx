import { orderControlBindings } from "@game/data/src/Controls"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { View } from "react-native"
import { ReopenedNativeInformationPanel } from "@/components/NativeInformationPanel"
import { Text } from "@/components/ui/text"

export default function NativeControls({
  open,
  onOpenChange,
}: {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}) {
  const localizedCopy = useLocaleCatalog()
  const CONTROL_ACTION_LABELS = localizedCopy.interfaceCopy.controlActions
  const CONTROLS_COPY = localizedCopy.interfaceCopy.controls
  const NATIVE_CONTROL_GROUPS = localizedCopy.interfaceCopy.nativeControls

  return (
    <ReopenedNativeInformationPanel
      open={open}
      accessibleCloseLabel={CONTROLS_COPY.closeAction}
      primaryActionLabel={CONTROLS_COPY.closeAction}
      title={CONTROLS_COPY.title}
      presentation="reference"
      onOpenChange={onOpenChange}
      onPrimaryAction={() => onOpenChange(false)}
    >
      <View className="gap-6">
        {NATIVE_CONTROL_GROUPS.map((group) => (
          <View key={group.id}>
            <Text
              variant="h2"
              className="text-xl leading-7 font-black text-black"
            >
              {group.title}
            </Text>
            <View className="flex-row flex-wrap">
              {orderControlBindings(group.bindings).map((binding) => (
              <View
                key={binding.actionId}
                className="w-full flex-row items-start gap-3 border-b-2 border-gray-200 py-3 xl:w-1/2 xl:pr-4"
              >
                <Text className="min-w-0 flex-[0.8] text-sm leading-5 font-bold text-gray-800">
                  {binding.input}
                </Text>
                <View className="min-w-0 flex-[1.2]">
                  <Text className="text-base leading-6 font-black text-black">
                    {CONTROL_ACTION_LABELS[binding.actionId]}
                  </Text>
                  {binding.actionId === "stop" && (
                    <Text className="mt-1 text-sm leading-5 font-medium text-gray-700">
                      {CONTROLS_COPY.stopDescription}
                    </Text>
                  )}
                </View>
              </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ReopenedNativeInformationPanel>
  )
}
