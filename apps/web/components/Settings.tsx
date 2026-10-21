"use client"

import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type {
  PlayerDataResetKind,
  PlayerDataResetReview as PlayerDataResetReviewState,
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
import { useEffect, useRef } from "react"
import LanguageSelector from "@/components/LanguageSelector"
import MapacheScreen from "@/components/MapacheScreen"
import PlayerDataResetActions from "@/components/PlayerDataResetActions"
import PlayerDataResetReview from "@/components/PlayerDataResetReview"
import { Button } from "@/components/ui/button"

type SettingsOption<TValue extends string> = {
  readonly value: TValue
  readonly label: string
  readonly description: string
}

function SettingsRadioGroup<TValue extends string>({
  disabled,
  groupName,
  heading,
  options,
  selectedValue,
  onValueChange,
}: Readonly<{
  disabled: boolean
  groupName: string
  heading: string
  options: readonly SettingsOption<TValue>[]
  selectedValue: TValue
  onValueChange: (value: TValue) => void
}>) {
  const localizedCopy = useLocaleCatalog()

  return (
    <fieldset
      disabled={disabled}
      className="text-mapache-vivid-dark w-full min-w-0 border-4 border-black bg-white p-[12px] shadow-[8px_8px_0px_0px_#000000] xl:p-8"
    >
      <legend
        aria-label={heading}
        className="w-full max-w-full border-b-4 border-black bg-white pb-[12px] text-xl leading-tight font-black text-balance hyphens-manual xl:px-2 xl:pb-4 xl:text-4xl xl:uppercase"
      >
        {getWrappableSettingsText(heading, localizedCopy.metadata.languageTag)}
      </legend>
      <div className="mt-[16px] grid grid-cols-1 gap-[16px] xl:mt-5 xl:grid-cols-3 xl:gap-4">
        {options.map((option) => {
          const isSelected = option.value === selectedValue
          const descriptionId = `${groupName}-${option.value}-description`

          return (
            <label
              key={option.value}
              className={cx(
                "flex min-w-0 cursor-pointer flex-wrap items-start gap-[12px] border-4 border-black p-[12px] shadow-[5px_5px_0px_0px_#000000] xl:gap-4 xl:p-4",
                isSelected
                  ? "bg-mapache-vivid-primary-cyan text-black"
                  : "bg-white",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={isSelected}
                aria-label={option.label}
                aria-describedby={descriptionId}
                onChange={() => onValueChange(option.value)}
                className="mt-[3px] size-[24px] shrink-0 accent-black xl:mt-1 xl:size-6"
              />
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-xl font-black [overflow-wrap:anywhere] hyphens-auto xl:uppercase">
                    {getWrappableSettingsText(
                      option.label,
                      localizedCopy.metadata.languageTag,
                    )}
                  </span>
                  {isSelected ? (
                    <span
                      aria-hidden="true"
                      className="hidden shrink-0 border-2 border-black bg-black px-2 py-1 text-sm font-black text-white uppercase xl:inline"
                    >
                      {localizedCopy.interfaceCopy.screen.selected}
                    </span>
                  ) : null}
                </span>
                <span
                  id={descriptionId}
                  className="mt-2 block text-base leading-relaxed font-bold [overflow-wrap:anywhere] hyphens-auto"
                >
                  {option.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function Settings({
  activity,
  customValueCount,
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
  issue: string | null
  notice: string | null
  resetReview: PlayerDataResetReviewState | null
  settings: PlayerSettings
  onCancelReset: () => void
  onClose: () => void
  onConfirmReset: (review: PlayerDataResetReviewState) => void
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

  const headingRef = useRef<HTMLHeadingElement>(null)
  const issueRef = useRef<HTMLParagraphElement>(null)
  const resetActionFocusTargetIdRef = useRef<string | null>(null)
  const previousResetReviewRef = useRef(resetReview)
  const isBusy = activity !== null
  const isNavigationBlocked = isBusy || resetReview !== null

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    issueRef.current?.focus()
  }, [issue])

  useEffect(() => {
    if (
      previousResetReviewRef.current &&
      !resetReview &&
      resetActionFocusTargetIdRef.current
    ) {
      document.getElementById(resetActionFocusTargetIdRef.current)?.focus()
    }

    previousResetReviewRef.current = resetReview
  }, [resetReview])

  const handleRequestReset = (
    resetKind: PlayerDataResetKind,
    focusTargetId: string,
  ) => {
    resetActionFocusTargetIdRef.current = focusTargetId
    onRequestReset(resetKind)
  }

  return (
    <MapacheScreen
      spacing="readable-xl"
      viewport="fixed"
      className="flex flex-col"
    >
      <header className="mx-auto flex w-full max-w-5xl shrink-0 flex-col items-stretch gap-[16px] xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <h1
          ref={headingRef}
          tabIndex={-1}
          aria-label={PLAYER_SETTINGS_COPY.title}
          className="text-mapache-vivid-primary-cyan text-[2rem] leading-[1.15] font-black text-balance hyphens-manual drop-shadow-[5px_5px_0px_#000000] outline-none xl:text-6xl xl:uppercase"
        >
          {getWrappableSettingsText(
            PLAYER_SETTINGS_COPY.title,
            localizedCopy.metadata.languageTag,
          )}
        </h1>
        <nav
          aria-label={localizedCopy.interfaceCopy.screen.settingsActions}
          className="flex flex-wrap gap-[12px] xl:gap-3"
        >
          <Button
            type="button"
            variant="secondary"
            disabled={isNavigationBlocked}
            onClick={onOpenMenu}
            wrap
            typographyClassName="text-base xl:text-lg"
            className="min-w-0 flex-1 max-xl:px-[8px] max-xl:py-[12px]"
          >
            {PRODUCT_MENU_COPY.openAction}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isNavigationBlocked}
            onClick={onClose}
            wrap
            typographyClassName="text-base xl:text-lg"
            className="min-w-0 flex-1 max-xl:px-[8px] max-xl:py-[12px]"
          >
            {PLAYER_SETTINGS_COPY.closeAction}
          </Button>
        </nav>
      </header>

      <div
        aria-busy={isBusy}
        className="mx-auto mt-[24px] min-h-0 w-full max-w-5xl flex-1 overflow-y-auto overscroll-contain p-[4px] pr-[12px] pb-[48px] xl:mt-6 xl:p-1 xl:pr-3 xl:pb-12"
      >
        <div className="flex flex-col gap-6">
          {activity ? (
            <p
              role="status"
              className="bg-mapache-vivid-primary-cyan text-mapache-vivid-dark border-4 border-black p-4 text-xl font-black uppercase shadow-[6px_6px_0px_0px_#000000]"
            >
              {activity}
            </p>
          ) : null}
          {notice ? (
            <p
              role="status"
              className="bg-mapache-vivid-secondary-green text-mapache-vivid-dark border-4 border-black p-4 text-xl font-black shadow-[6px_6px_0px_0px_#000000]"
            >
              {notice}
            </p>
          ) : null}
          {issue ? (
            <p
              ref={issueRef}
              role="alert"
              tabIndex={-1}
              className="bg-mapache-vivid-primary-orange border-4 border-black p-4 text-xl font-black text-white shadow-[6px_6px_0px_0px_#000000] outline-none"
            >
              {issue}
            </p>
          ) : null}

          {resetReview ? (
            <PlayerDataResetReview
              key={resetReview.confirmationId}
              isBusy={isBusy}
              review={resetReview}
              onCancel={onCancelReset}
              onConfirm={onConfirmReset}
              onExport={onExport}
            />
          ) : (
            <>
              <section
                aria-labelledby="settings-language-heading"
                className="text-mapache-vivid-dark w-full min-w-0 border-4 border-black bg-white p-[12px] shadow-[8px_8px_0px_0px_#000000] xl:p-8"
              >
                <h2
                  id="settings-language-heading"
                  className="border-b-4 border-black pb-[12px] text-xl leading-tight font-black xl:pb-4 xl:text-4xl xl:uppercase"
                >
                  {PLAYER_SETTINGS_COPY.languageHeading}
                </h2>
                <div className="mt-5">
                  <LanguageSelector
                    locale={settings.locale}
                    labelPlacement="section"
                    disabled={isBusy}
                    onLocaleChange={(locale) =>
                      onUpdateSettings(
                        createPlayerSettings({ ...settings, locale }),
                      )
                    }
                  />
                </div>
              </section>

              <SettingsRadioGroup
                disabled={isBusy}
                groupName="reduced-motion-setting"
                heading={PLAYER_SETTINGS_COPY.reducedMotionHeading}
                options={REDUCED_MOTION_SETTING_OPTIONS}
                selectedValue={settings.reducedMotion}
                onValueChange={(reducedMotion) =>
                  onUpdateSettings(
                    createPlayerSettings({ ...settings, reducedMotion }),
                  )
                }
              />

              <SettingsRadioGroup
                disabled={isBusy}
                groupName="control-hints-setting"
                heading={PLAYER_SETTINGS_COPY.controlHintsHeading}
                options={CONTROL_HINT_SETTING_OPTIONS}
                selectedValue={settings.controlHints}
                onValueChange={(controlHints) =>
                  onUpdateSettings(
                    createPlayerSettings({ ...settings, controlHints }),
                  )
                }
              />

              <PlayerDataResetActions
                customValueCount={customValueCount}
                isBusy={isBusy}
                playerDataResetKinds={SETTINGS_PLAYER_DATA_RESET_KINDS}
                onRequestReset={handleRequestReset}
              />
            </>
          )}
        </div>
      </div>
    </MapacheScreen>
  )
}
