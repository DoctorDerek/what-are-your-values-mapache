import {
  BATTLE_ANIMATION_SPEED_MODES,
  DEFAULT_BATTLE_ANIMATION_SPEED,
  type BattleAnimationSpeed,
} from "./BattleAnimationSpeed"
import { readString, readTuple } from "./PersistenceValidation"

export const PLAYER_SETTINGS_CODEC_VERSION = 2 as const

export const SUPPORTED_LOCALES = ["en"] as const
export const REDUCED_MOTION_PREFERENCES = ["system", "on", "off"] as const
export const CONTROL_HINT_PREFERENCES = ["auto", "always", "off"] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export type ReducedMotionPreference =
  (typeof REDUCED_MOTION_PREFERENCES)[number]
export type ControlHintPreference = (typeof CONTROL_HINT_PREFERENCES)[number]

export type PlayerSettings = {
  readonly locale: SupportedLocale
  readonly reducedMotion: ReducedMotionPreference
  readonly controlHints: ControlHintPreference
  readonly battleAnimationSpeed: BattleAnimationSpeed
}

export type EncodedPlayerSettings = readonly [
  version: number,
  locale: string,
  reducedMotion: string,
  controlHints: string,
  battleAnimationSpeed?: string,
]

function readOption<const TOption extends string>(
  value: unknown,
  options: readonly TOption[],
  label: string,
) {
  const candidate = readString(value, label)
  if (!options.includes(candidate as TOption)) {
    throw new Error(`Unsupported ${label}: ${candidate}`)
  }

  return candidate as TOption
}

export function createPlayerSettings(
  settings: Omit<PlayerSettings, "battleAnimationSpeed"> &
    Partial<Pick<PlayerSettings, "battleAnimationSpeed">>,
): PlayerSettings {
  return Object.freeze({
    locale: readOption(settings.locale, SUPPORTED_LOCALES, "locale"),
    reducedMotion: readOption(
      settings.reducedMotion,
      REDUCED_MOTION_PREFERENCES,
      "reduced-motion preference",
    ),
    controlHints: readOption(
      settings.controlHints,
      CONTROL_HINT_PREFERENCES,
      "control-hint preference",
    ),
    battleAnimationSpeed: readOption(
      settings.battleAnimationSpeed ?? DEFAULT_BATTLE_ANIMATION_SPEED,
      BATTLE_ANIMATION_SPEED_MODES,
      "Battle animation speed",
    ),
  })
}

export function createInitialPlayerSettings() {
  return createPlayerSettings({
    locale: "en",
    reducedMotion: "system",
    controlHints: "auto",
  })
}

export function encodePlayerSettings(
  settings: PlayerSettings,
): EncodedPlayerSettings {
  const validated = createPlayerSettings(settings)

  const legacySettings = [
    1,
    validated.locale,
    validated.reducedMotion,
    validated.controlHints,
  ] as const
  return validated.battleAnimationSpeed === DEFAULT_BATTLE_ANIMATION_SPEED
    ? legacySettings
    : [
        PLAYER_SETTINGS_CODEC_VERSION,
        validated.locale,
        validated.reducedMotion,
        validated.controlHints,
        validated.battleAnimationSpeed,
      ]
}

export function decodePlayerSettings(value: unknown) {
  const version = Array.isArray(value) ? value[0] : null
  if (version !== 1 && version !== PLAYER_SETTINGS_CODEC_VERSION) {
    throw new Error(
      `Unsupported Player Settings codec version: ${String(version)}`,
    )
  }
  const tuple = readTuple(value, version === 1 ? 4 : 5, "Player Settings")

  const settings = createPlayerSettings({
    locale: readOption(tuple[1], SUPPORTED_LOCALES, "locale"),
    reducedMotion: readOption(
      tuple[2],
      REDUCED_MOTION_PREFERENCES,
      "reduced-motion preference",
    ),
    controlHints: readOption(
      tuple[3],
      CONTROL_HINT_PREFERENCES,
      "control-hint preference",
    ),
    battleAnimationSpeed:
      version === 1
        ? DEFAULT_BATTLE_ANIMATION_SPEED
        : readOption(
            tuple[4],
            BATTLE_ANIMATION_SPEED_MODES,
            "Battle animation speed",
          ),
  })

  if (
    JSON.stringify(encodePlayerSettings(settings)) !== JSON.stringify(value)
  ) {
    throw new Error("Player Settings encoding is not canonical")
  }

  return settings
}
