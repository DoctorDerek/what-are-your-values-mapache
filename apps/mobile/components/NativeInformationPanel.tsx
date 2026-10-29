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
  const Header = ScrollView
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
                ? "max-h-[40%] min-h-[min(96px,20vh)] shrink grow-0 border-b-6"
                : isStandard
                  ? "max-h-[40%] shrink-0 grow-0 border-b-4"
                  : "max-h-[40%] shrink-0 grow-0 border-b-4",
            )}
            contentContainerClassName={
              isIntroduction
                ? "justify-center px-4 py-[min(20px,max(4px,calc(100vh-430px)))] xl:px-8 xl:py-6"
                : "p-4"
            }
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
              "relative z-20 flex-1",
              isIntroduction
                ? "mx-auto min-h-[min(160px,25vh)] w-full max-w-4xl"
                : "min-h-0",
            )}
            contentContainerClassName={
              isIntroduction
                ? "gap-4 px-5 py-[min(20px,max(8px,calc(100vh-430px)))] xl:px-10 xl:py-7"
                : "gap-4 px-4 py-4"
            }
          >
            {children}
          </ScrollView>

          <ScrollView
            className={cx(
              "relative z-20 shrink-0 grow-0 border-black",
              isIntroduction
                ? "max-h-[35%] border-t-6"
                : "max-h-[45%] border-t-4 px-4 pt-3 pb-5",
            )}
          >
            <View
              className={cx(
                isIntroduction &&
                  "mx-auto w-full flex-row flex-wrap items-center justify-center gap-3 px-6 pt-[min(16px,max(8px,calc(100vh-430px)))] pb-[min(20px,max(12px,calc(100vh-430px)))] xl:max-w-xl xl:flex-col",
              )}
            >
              {beforePrimaryAction && (
                <View
                  className={cx(
                    isIntroduction &&
                      "basis-readable-setting max-w-xl min-w-0 shrink grow xl:w-full xl:basis-auto",
                  )}
                >
                  {beforePrimaryAction}
                </View>
              )}
              <Button
                className={cx(
                  isIntroduction &&
                    "basis-readable-setting max-w-xl min-w-0 shrink grow xl:w-full xl:basis-auto",
                )}
                size={isIntroduction ? "arrival" : "compact"}
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
          </ScrollView>
          {afterActions && (
            <ScrollView className="relative z-20 max-h-[40%] min-h-[min(128px,20vh)] shrink grow-0">
              {afterActions}
            </ScrollView>
          )}
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
