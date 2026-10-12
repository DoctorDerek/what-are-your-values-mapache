import {
  PLAYER_SETTINGS_COPY,
  PLAYER_SETTINGS_LANGUAGE_OPTIONS,
  type LanguageSelectorProps,
} from "@game/machines/src/PlayerSettingsPresentation"
import { useState } from "react"
import { Modal, Pressable, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeLanguageSelector({
  locale,
  disabled = false,
  onLocaleChange,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = PLAYER_SETTINGS_LANGUAGE_OPTIONS.find(
    ({ value }) => value === locale,
  )

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={PLAYER_SETTINGS_COPY.languageHeading}
        accessibilityValue={{ text: selectedOption?.label }}
        accessibilityState={{ disabled, expanded: isOpen }}
        disabled={disabled}
        onPress={() => setIsOpen(true)}
        className="min-h-12 flex-row items-center justify-between gap-3 border-3 border-black bg-white px-3 py-2 shadow-[3px_3px_0_#000] active:bg-gray-100"
      >
        <Text className="font-semibold text-black">
          {PLAYER_SETTINGS_COPY.languageHeading}
        </Text>
        <Text className="font-semibold text-black">
          {selectedOption?.label} ▾
        </Text>
      </Pressable>
      <Modal
        transparent
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 p-6">
          <View
            accessibilityViewIsModal
            className="w-full max-w-lg gap-4 border-4 border-black bg-white p-5"
          >
            <Text accessibilityRole="header" className="text-xl font-black">
              {PLAYER_SETTINGS_COPY.languageHeading}
            </Text>
            {PLAYER_SETTINGS_LANGUAGE_OPTIONS.map(({ value, label }) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: value === locale }}
                onPress={() => {
                  onLocaleChange(value)
                  setIsOpen(false)
                }}
                className="active:bg-mapache-vivid-primary-cyan min-h-12 justify-center border-2 border-black p-3"
              >
                <Text className="font-bold text-black">{label}</Text>
              </Pressable>
            ))}
            <Button variant="outline" onPress={() => setIsOpen(false)}>
              <Text>{PLAYER_SETTINGS_COPY.closeAction}</Text>
            </Button>
          </View>
        </View>
      </Modal>
    </>
  )
}
