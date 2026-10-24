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
  presentation?: "standard" | "introduction" | "reference"
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
  const isStandard = presentation === "standard"
  const Header = isStandard ? ScrollView : View
  return (
    <MapacheScreen
      accessibilityLabel={modal ? title : undefined}
      accessibilityViewIsModal={modal || undefined}
      role={modal ? "dialog" : undefined}
    >
      <View className={cx("min-h-0 flex-1", !isIntroduction && "p-3")}>
        <View
          className={cx(
            "relative w-full flex-1 bg-white",
            isIntroduction
              ? "overflow-visible"
              : "m-auto max-h-full max-w-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_#000000]",
          )}
        >
          {decoration}
          <Header
            className={cx(
              "relative z-20 border-black",
              isIntroduction
                ? "min-h-24 justify-center border-b-6 px-4 py-5 xl:min-h-32 xl:px-8 xl:py-6"
                : isStandard
                  ? "max-h-[40%] shrink-0 grow-0 border-b-4"
                  : "border-b-4 px-4 py-5",
            )}
            {...(isStandard && {
              contentContainerClassName: "p-4",
            })}
          >
            {titleDecoration}
            <Text
              variant="h1"
              className={cx(
                "relative z-20 font-black",
                isIntroduction
                  ? "ios:font-[AvenirNextCondensed-Heavy] android:font-[sans-serif-condensed] web:font-arrival-title text-mapache-vivid-primary-cyan text-center text-[36.4px] leading-[35px] tracking-normal xl:text-[62.4px] xl:leading-[60px]"
                  : isStandard
                    ? "text-mapache-vivid-primary-cyan text-left text-xl"
                    : "text-mapache-vivid-primary-cyan text-center text-2xl uppercase",
                accessibleCloseLabel && "pr-14",
                accessibleCloseLabel && isStandard && "min-h-12",
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
          </Header>

          <ScrollView
            className={cx(
              "relative z-20 min-h-0 flex-1",
              isIntroduction && "mx-auto w-full max-w-4xl",
            )}
            contentContainerClassName={
              isIntroduction
                ? "gap-4 px-5 py-5 xl:px-10 xl:py-7"
                : "gap-4 px-4 py-4"
            }
          >
            {children}
          </ScrollView>

          <View
            className={cx(
              "relative z-20 border-black",
              isIntroduction
                ? "border-t-6"
                : "shrink-0 border-t-4 px-4 pt-3 pb-5",
            )}
          >
            <View
              className={cx(
                isIntroduction &&
                  "mx-auto w-full max-w-xl gap-3 px-6 pt-4 pb-5",
              )}
            >
              {beforePrimaryAction}
              <Button
                size={isIntroduction ? "large" : "compact"}
                onPress={onPrimaryAction}
                disabled={isPrimaryActionPending}
                accessibilityState={{
                  busy: isPrimaryActionPending,
                  disabled: isPrimaryActionPending,
                }}
              >
                <Text
                  {...(isIntroduction && {
                    className: "text-3xl leading-none font-black uppercase",
                  })}
                  {...(!isIntroduction && {
                    className:
                      "text-center text-xl font-black text-black uppercase",
                  })}
                >
                  {primaryActionLabel}
                </Text>
              </Button>
            </View>
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
