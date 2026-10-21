import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type {
  PlayerDataResetKind,
  PlayerDataResetReview,
} from "@game/machines/src/PlayerDataReset"
import {
  createPlayerSettings,
  type PlayerSettings,
} from "@game/machines/src/PlayerSettings"
import {
  getWrappableSettingsText,
  SETTINGS_PLAYER_DATA_RESET_KINDS,
} from "@game/machines/src/PlayerSettingsPresentation"
import { cx } from "classix"
import { Pressable, ScrollView, View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeLanguageSelector from "@/components/NativeLanguageSelector"
import NativeOperationMessages from "@/components/NativeOperationMessages"
import NativePlayerDataResetActions from "@/components/NativePlayerDataResetActions"
import NativePlayerDataResetReview from "@/components/NativePlayerDataResetReview"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

type NativeSettingsOption<TValue extends string> = {
  readonly value: TValue
  readonly label: string
  readonly description: string
}

function NativeSettingsRadioGroup<TValue extends string>({
  disabled,
  heading,
  options,
  selectedValue,
  onValueChange,
}: Readonly<{
  disabled: boolean
  heading: string
  options: readonly NativeSettingsOption<TValue>[]
  selectedValue: TValue
  onValueChange: (value: TValue) => void
}>) {
  const localizedCopy = useLocaleCatalog()

  return (
    <View
      accessibilityLabel={heading}
      accessibilityRole="radiogroup"
      className="min-w-0 gap-4 border-4 border-black bg-white p-3 shadow-[6px_6px_0px_0px_#000000] xl:gap-5 xl:p-8"
    >
      <Text
        accessibilityRole="header"
        accessibilityLabel={heading}
        android_hyphenationFrequency="normal"
        className="border-b-4 border-black pb-3 text-xl leading-tight font-black text-black xl:text-4xl xl:uppercase"
      >
        {getWrappableSettingsText(heading, localizedCopy.metadata.languageTag)}
      </Text>
      <View className="gap-4 xl:flex-row xl:flex-wrap">
        {options.map((option) => {
          const isSelected = option.value === selectedValue

          return (
            <Pressable
              key={option.value}
              accessibilityHint={option.description}
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected, disabled }}
              disabled={disabled}
              onPress={() => onValueChange(option.value)}
              className={cx(
                "xl:basis-readable-setting min-w-0 flex-row items-start gap-3 border-4 border-black p-3 shadow-[5px_5px_0px_0px_#000000] xl:shrink xl:grow xl:gap-4 xl:p-4",
                isSelected ? "bg-mapache-vivid-primary-cyan" : "bg-white",
                disabled && "opacity-50",
              )}
            >
              <View className="mt-1 size-6 shrink-0 items-center justify-center rounded-full border-4 border-black bg-white">
                {isSelected ? (
                  <View className="size-3 rounded-full bg-black" />
                ) : null}
              </View>
              <View className="min-w-0 flex-1 gap-2">
                <View className="min-w-0 flex-row flex-wrap items-center gap-2">
                  <Text
                    android_hyphenationFrequency="normal"
                    className="min-w-0 shrink text-xl font-black text-black xl:uppercase"
                  >
                    {getWrappableSettingsText(
                      option.label,
                      localizedCopy.metadata.languageTag,
                    )}
                  </Text>
                  {isSelected ? (
                    <Text className="hidden border-2 border-black bg-black px-2 py-1 text-sm font-black text-white uppercase xl:flex">
                      {localizedCopy.interfaceCopy.screen.selected}
                    </Text>
                  ) : null}
                </View>
                <Text
                  android_hyphenationFrequency="normal"
                  className="text-base leading-6 font-bold text-black"
                >
                  {option.description}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default function NativeSettings({
  activity,
  customValueCount,
  isNavigationPending,
  issue,
  notice,
  resetReview,
  settings,
  onCancelReset,
  onClose,
  onConfirmReset,
  onExport,
  onOpenMenu,
  onRequestReset,
  onUpdateSettings,
}: Readonly<{
  activity: string | null
  customValueCount: number
  isNavigationPending: boolean
  issue: string | null
  notice: string | null
  resetReview: PlayerDataResetReview | null
  settings: PlayerSettings
  onCancelReset: () => void
  onClose: () => void
  onConfirmReset: (review: PlayerDataResetReview) => void
  onExport: () => void
  onOpenMenu: () => void
  onRequestReset: (resetKind: PlayerDataResetKind) => void
  onUpdateSettings: (settings: PlayerSettings) => void
}>) {
  const localizedCopy = useLocaleCatalog()
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu
  const CONTROL_HINT_SETTING_OPTIONS =
    localizedCopy.interfaceCopy.controlHintOptions
  const PLAYER_SETTINGS_COPY = localizedCopy.interfaceCopy.settings
  const REDUCED_MOTION_SETTING_OPTIONS =
    localizedCopy.interfaceCopy.reducedMotionOptions

  const isBusy = activity !== null || isNavigationPending
  const isNavigationBlocked = isBusy || resetReview !== null

  return (
    <MapacheScreen>
      <View className="gap-4 border-b-4 border-black p-4 xl:p-8">
        <Text
          variant="h1"
          accessibilityLabel={PLAYER_SETTINGS_COPY.title}
          android_hyphenationFrequency="normal"
          className="text-mapache-vivid-primary-cyan text-left text-[2rem] leading-tight font-black tracking-tight xl:text-5xl xl:uppercase"
        >
          {getWrappableSettingsText(
            PLAYER_SETTINGS_COPY.title,
            localizedCopy.metadata.languageTag,
          )}
        </Text>
        <View className="flex-row gap-3">
          <Button
            className="flex-1"
            disabled={isNavigationBlocked}
            size="compact"
            variant="outline"
            onPress={onOpenMenu}
          >
            <Text>{PRODUCT_MENU_COPY.openAction}</Text>
          </Button>
          <Button
            className="flex-1"
            disabled={isNavigationBlocked}
            size="compact"
            variant="secondary"
            onPress={onClose}
          >
            <Text>{PLAYER_SETTINGS_COPY.closeAction}</Text>
          </Button>
        </View>
      </View>

      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName="gap-6 p-4 pb-12 xl:p-8 xl:pb-14"
        keyboardShouldPersistTaps="handled"
      >
        <View accessibilityState={{ busy: isBusy }} className="gap-6">
          <NativeOperationMessages
            activity={activity}
            issue={issue}
            notice={notice}
          />

          {resetReview ? (
            <NativePlayerDataResetReview
              key={resetReview.confirmationId}
              isBusy={isBusy}
              review={resetReview}
              onCancel={onCancelReset}
              onConfirm={onConfirmReset}
              onExport={onExport}
            />
          ) : (
            <>
              <View className="min-w-0 gap-4 border-4 border-black bg-white p-3 shadow-[6px_6px_0px_0px_#000000] xl:gap-5 xl:p-8">
                <Text
                  accessibilityRole="header"
                  className="border-b-4 border-black pb-3 text-xl leading-tight font-black text-black xl:text-4xl xl:uppercase"
                >
                  {PLAYER_SETTINGS_COPY.languageHeading}
                </Text>
                <NativeLanguageSelector
                  locale={settings.locale}
                  labelPlacement="section"
                  disabled={isBusy}
                  onLocaleChange={(locale) =>
                    onUpdateSettings(
                      createPlayerSettings({ ...settings, locale }),
                    )
                  }
                />
              </View>

              <NativeSettingsRadioGroup
                disabled={isBusy}
                heading={PLAYER_SETTINGS_COPY.reducedMotionHeading}
                options={REDUCED_MOTION_SETTING_OPTIONS}
                selectedValue={settings.reducedMotion}
                onValueChange={(reducedMotion) =>
                  onUpdateSettings(
                    createPlayerSettings({ ...settings, reducedMotion }),
                  )
                }
              />

              <NativeSettingsRadioGroup
                disabled={isBusy}
                heading={PLAYER_SETTINGS_COPY.controlHintsHeading}
                options={CONTROL_HINT_SETTING_OPTIONS}
                selectedValue={settings.controlHints}
                onValueChange={(controlHints) =>
                  onUpdateSettings(
                    createPlayerSettings({ ...settings, controlHints }),
                  )
                }
              />

              <NativePlayerDataResetActions
                customValueCount={customValueCount}
                isBusy={isBusy}
                playerDataResetKinds={SETTINGS_PLAYER_DATA_RESET_KINDS}
                onRequestReset={onRequestReset}
              />
            </>
          )}
        </View>
      </ScrollView>
    </MapacheScreen>
  )
}
