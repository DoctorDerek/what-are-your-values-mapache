import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { cx } from "classix"
import type { ComponentProps, ReactElement } from "react"
import { Modal, ScrollView, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeUnsavedChangesDialog({
  visible,
  animationType,
  onShow,
  onDiscard,
  onKeepEditing,
  onSave,
  discardDisabled = false,
  saveDisabled = false,
  titleClassName,
  contentClassName,
  edgeSpacing = "standard",
  discardAction,
  primaryActions,
}: {
  visible: boolean
  animationType?: ComponentProps<typeof Modal>["animationType"]
  onShow?: ComponentProps<typeof Modal>["onShow"]
  onKeepEditing: () => void
  titleClassName: string
  contentClassName?: string
  edgeSpacing?: "compact" | "standard"
} & (
  | {
      discardAction: ReactElement
      primaryActions: ReactElement
      onDiscard?: never
      onSave?: never
      discardDisabled?: never
      saveDisabled?: never
      onRestoreFocus: () => void
    }
  | {
      discardAction?: never
      primaryActions?: never
      onDiscard: () => void
      onSave: () => void
      discardDisabled?: boolean
      saveDisabled?: boolean
      onRestoreFocus?: () => void
    }
)) {
  const copy = useLocaleCatalog().interfaceCopy.dressingRoom
  return (
    <Modal
      transparent
      visible={visible}
      animationType={animationType}
      onShow={onShow}
      onRequestClose={onKeepEditing}
    >
      <MapacheScreen
        className={cx(
          "items-center justify-end bg-black/70 xl:justify-center",
          edgeSpacing === "compact" ? "p-3 xl:pb-3" : "p-4 xl:pb-4",
          "pb-[min(64px,max(16px,8vh))]",
        )}
      >
        <View
          accessibilityViewIsModal
          role="dialog"
          accessibilityLabel={copy.keepTitle}
          className={cx(
            "max-h-full min-h-0 w-full shrink border-4 border-black bg-white",
            contentClassName,
          )}
        >
          <ScrollView
            className="min-h-0 shrink"
            contentContainerClassName="gap-4 p-[16px]"
            keyboardShouldPersistTaps="handled"
          >
            <Text
              accessibilityRole="header"
              className={cx("font-black text-black", titleClassName)}
            >
              {copy.keepTitle}
            </Text>
            {discardAction ?? (
              <Button
                size="compact"
                variant="outline"
                disabled={discardDisabled}
                onPress={onDiscard}
              >
                <Text>{copy.discard}</Text>
              </Button>
            )}
          </ScrollView>
          <View className="shrink-0 flex-row flex-wrap gap-3 border-t-4 border-black p-3 pb-5">
            {primaryActions ?? (
              <>
                <Button
                  size="compact"
                  className="basis-readable-action min-w-0 flex-1"
                  variant="secondary"
                  onPress={onKeepEditing}
                >
                  <Text>{copy.keepEditing}</Text>
                </Button>
                <Button
                  size="compact"
                  className="basis-readable-action min-w-0 flex-1"
                  disabled={saveDisabled}
                  onPress={onSave}
                >
                  <Text>{copy.saveReturn}</Text>
                </Button>
              </>
            )}
          </View>
        </View>
      </MapacheScreen>
    </Modal>
  )
}
