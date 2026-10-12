import { cx } from "classix"
import type { ReactNode } from "react"
import { Modal, ScrollView, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

type NativeInformationPanelFrameProps = Readonly<{
  title: string
  children: ReactNode
  primaryActionLabel: string
  onPrimaryAction: () => void
  isPrimaryActionPending?: boolean
  accessibleCloseLabel?: string
  modal?: boolean
  presentation?: "standard" | "introduction"
  titleContent?: ReactNode
  titleDecoration?: ReactNode
  decoration?: ReactNode
  beforePrimaryAction?: ReactNode
  afterActions?: ReactNode
}>

function NativeInformationPanelFrame({
  title,
  children,
  primaryActionLabel,
  onPrimaryAction,
  isPrimaryActionPending = false,
  accessibleCloseLabel,
  modal = false,
  presentation = "standard",
  titleContent = title,
  titleDecoration,
  decoration,
  beforePrimaryAction,
  afterActions,
}: NativeInformationPanelFrameProps) {
  const isIntroduction = presentation === "introduction"
  return (
    <MapacheScreen
      accessibilityLabel={modal ? title : undefined}
      accessibilityViewIsModal={modal || undefined}
      role={modal ? "dialog" : undefined}
    >
      <View className={cx("flex-1", isIntroduction ? "p-4 xl:p-8" : "p-5")}>
        <View
          className={cx(
            "relative m-auto w-full flex-1 border-4 border-black bg-white shadow-[8px_8px_0px_0px_#000000]",
            isIntroduction
              ? "max-h-184 max-w-4xl overflow-visible"
              : "max-h-full max-w-3xl overflow-hidden",
          )}
        >
          {decoration}
          <View
            className={cx(
              "relative z-20 border-b-4 border-black",
              isIntroduction ? "px-2.5 py-4 xl:px-8 xl:py-6" : "p-5",
            )}
          >
            {titleDecoration}
            <Text
              variant="h1"
              className={cx(
                "relative z-20 text-center font-black",
                isIntroduction
                  ? "text-mapache-vivid-primary-cyan text-[28px] leading-tight xl:text-4xl"
                  : "text-mapache-vivid-primary-raspberry text-4xl tracking-tight uppercase",
                accessibleCloseLabel && "pr-14",
              )}
              {...(isIntroduction && {
                adjustsFontSizeToFit: true,
                numberOfLines: 2,
                minimumFontScale: 0.7,
              })}
            >
              {titleContent}
            </Text>
            {accessibleCloseLabel ? (
              <Button
                accessibilityLabel={accessibleCloseLabel}
                size="icon"
                variant="outline"
                className="absolute top-3 right-3"
                onPress={onPrimaryAction}
              >
                <Text>×</Text>
              </Button>
            ) : null}
          </View>

          <ScrollView
            className="relative z-20 min-h-0 flex-1"
            contentContainerClassName={
              isIntroduction ? "gap-4 px-5 py-4 xl:px-8 xl:py-6" : "gap-4 p-5"
            }
          >
            {children}
          </ScrollView>

          <View
            className={cx(
              "relative z-20 border-t-4 border-black",
              isIntroduction ? "gap-3 px-4 pt-3 pb-5 xl:px-8" : "p-5",
            )}
          >
            {beforePrimaryAction}
            <Button
              size="large"
              onPress={onPrimaryAction}
              disabled={isPrimaryActionPending}
              accessibilityState={{
                busy: isPrimaryActionPending,
                disabled: isPrimaryActionPending,
              }}
            >
              <Text
                {...(isIntroduction && {
                  className: "text-4xl leading-none font-black uppercase",
                })}
              >
                {primaryActionLabel}
              </Text>
            </Button>
          </View>
          {afterActions}
        </View>
      </View>
    </MapacheScreen>
  )
}

export default function NativeInformationPanel(
  props: NativeInformationPanelFrameProps,
) {
  return <NativeInformationPanelFrame {...props} />
}

export function ReopenedNativeInformationPanel({
  open,
  onOpenChange,
  ...frameProps
}: NativeInformationPanelFrameProps &
  Readonly<{
    open: boolean
    onOpenChange: (open: boolean) => void
  }>) {
  return (
    <Modal
      animationType="fade"
      presentationStyle="fullScreen"
      visible={open}
      onRequestClose={() => onOpenChange(false)}
    >
      <NativeInformationPanelFrame {...frameProps} modal />
    </Modal>
  )
}
