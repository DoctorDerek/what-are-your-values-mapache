"use client"

import {
  PLAYER_SETTINGS_COPY,
  PLAYER_SETTINGS_LANGUAGE_OPTIONS,
  type LanguageSelectorProps,
} from "@game/machines/src/PlayerSettingsPresentation"

export default function LanguageSelector({
  locale,
  disabled = false,
  onLocaleChange,
}: LanguageSelectorProps) {
  return (
    <label className="flex min-h-12 items-center gap-3 border-3 border-black bg-white px-3 font-semibold text-black shadow-[3px_3px_0_#000] focus-within:outline-3 focus-within:outline-offset-4 focus-within:outline-black">
      <span>{PLAYER_SETTINGS_COPY.languageHeading}</span>
      <select
        value={locale}
        disabled={disabled}
        className="min-h-11 min-w-0 flex-1 cursor-pointer bg-white text-base disabled:cursor-wait"
        onChange={(event) => {
          const option = PLAYER_SETTINGS_LANGUAGE_OPTIONS.find(
            ({ value }) => value === event.currentTarget.value,
          )
          if (option) onLocaleChange(option.value)
        }}
      >
        {PLAYER_SETTINGS_LANGUAGE_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  )
}
