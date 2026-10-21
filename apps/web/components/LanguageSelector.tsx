"use client"

import {
  getLocaleCatalog,
  SHIPPED_LANGUAGE_OPTIONS,
} from "@game/data/src/LocalizationCatalog"
import { type LanguageSelectorProps } from "@game/machines/src/PlayerSettingsPresentation"
import { cx } from "classix"

export default function LanguageSelector({
  locale,
  disabled = false,
  labelPlacement = "inline",
  onLocaleChange,
}: LanguageSelectorProps) {
  const { language: copy, metadata } = getLocaleCatalog(locale)
  const isSectionLabel = labelPlacement === "section"
  return (
    <label
      className={cx(
        "relative flex min-h-12 min-w-0 items-center gap-3 border-3 border-black bg-white px-3 font-semibold text-black shadow-[3px_3px_0_#000] focus-within:outline-3 focus-within:outline-offset-4 focus-within:outline-black",
        isSectionLabel && "max-xl:p-[12px]",
      )}
    >
      <span className={cx(isSectionLabel && "max-xl:sr-only")}>
        {copy.heading}
      </span>
      <select
        value={locale}
        disabled={disabled}
        className={cx(
          "min-h-11 min-w-0 flex-1 cursor-pointer bg-white text-base disabled:cursor-wait",
          isSectionLabel &&
            "max-xl:absolute max-xl:inset-0 max-xl:h-full max-xl:w-full max-xl:max-w-full max-xl:opacity-0",
        )}
        onChange={(event) => {
          const option = SHIPPED_LANGUAGE_OPTIONS.find(
            ({ value }) => value === event.currentTarget.value,
          )
          if (option) onLocaleChange(option.value)
        }}
      >
        {SHIPPED_LANGUAGE_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {isSectionLabel && (
        <span
          aria-hidden="true"
          className={cx(
            "pointer-events-none flex w-full min-w-0 items-center gap-[12px] text-base leading-[1.4] xl:hidden",
            disabled && "opacity-50",
          )}
        >
          <span className="min-w-0 flex-1">{metadata.languageName}</span>
          <span className="size-[10px] shrink-0 rotate-45 border-r-3 border-b-3 border-black" />
        </span>
      )}
    </label>
  )
}
