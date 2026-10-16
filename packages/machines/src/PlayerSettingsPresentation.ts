import type { SupportedLocale } from "@game/data/src/LocaleRegistry"
import {
  getLocaleCatalog,
  type LocalizationCatalog,
} from "@game/data/src/LocalizationCatalog"
import type { PlayerDataResetKind } from "./PlayerDataReset"
import type {
  ControlHintPreference,
  ReducedMotionPreference,
} from "./PlayerSettings"

export type LanguageSelectorProps = Readonly<{
  locale: SupportedLocale
  disabled?: boolean
  onLocaleChange: (locale: SupportedLocale) => void
}>

export const SETTINGS_PLAYER_DATA_RESET_KINDS = Object.freeze([
  "reset-levels-and-experience",
  "reset-achievements",
  "delete-all-data",
] as const satisfies readonly PlayerDataResetKind[])

export const CONTROL_HINT_INPUT_MODALITIES = Object.freeze([
  "keyboard",
  "touch-pointer",
] as const)

export type ControlHintInputModality =
  (typeof CONTROL_HINT_INPUT_MODALITIES)[number]

export type ValueChoicePosition = "first" | "second"

export function resolveShouldReduceMotion(
  preference: ReducedMotionPreference,
  systemShouldReduceMotion: boolean,
) {
  return (
    preference === "on" || (preference === "system" && systemShouldReduceMotion)
  )
}

export function getInitialWebControlHintInputModality(maxTouchPoints: number) {
  return maxTouchPoints > 0 ? "touch-pointer" : "keyboard"
}

export function getValueChoiceControlHint({
  preference,
  inputModality,
  position,
  localization = getLocaleCatalog(),
}: {
  readonly preference: ControlHintPreference
  readonly inputModality: ControlHintInputModality
  readonly position: ValueChoicePosition
  readonly localization?: LocalizationCatalog
}) {
  if (
    preference === "off" ||
    (preference === "auto" && inputModality !== "keyboard")
  )
    return null

  if (inputModality === "touch-pointer")
    return localization.interfaceCopy.screen.tap

  return position === "first" ? "[1 / A]" : "[2 / D]"
}
