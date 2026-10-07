import {
  DEFAULT_HEROES99_APPEARANCE,
  readHeroes99Appearance,
  type Heroes99Appearance,
} from "@game/data/src/Heroes99Appearance"
import {
  decodeAchievementState,
  encodeAchievementState,
  type EncodedAchievementState,
} from "./AchievementStateCodec"
import {
  decodeBattleProfile,
  encodeBattleProfile,
  type EncodedBattleProfile,
} from "./BattleProfileCodec"
import { readIsoTimestamp, readTuple } from "./PersistenceValidation"
import { createPlayerData, type PlayerData } from "./PlayerData"
import {
  decodePlayerSettings,
  encodePlayerSettings,
  type EncodedPlayerSettings,
} from "./PlayerSettings"

export const PLAYER_DATA_CODEC_VERSION = 2 as const
export type PlayerDataCodecVersion = 1 | typeof PLAYER_DATA_CODEC_VERSION

export type EncodedPlayerData =
  | readonly [
      version: 1,
      profile: EncodedBattleProfile,
      achievements: EncodedAchievementState,
      settings: EncodedPlayerSettings,
      progressGenerationStartedAt: string,
    ]
  | readonly [
      version: typeof PLAYER_DATA_CODEC_VERSION,
      profile: EncodedBattleProfile,
      achievements: EncodedAchievementState,
      settings: EncodedPlayerSettings,
      progressGenerationStartedAt: string,
      appearance: Heroes99Appearance,
    ]

export function encodePlayerData(
  playerData: PlayerData,
  version: PlayerDataCodecVersion = PLAYER_DATA_CODEC_VERSION,
): EncodedPlayerData {
  const validated = createPlayerData(playerData)

  const fields = [
    encodeBattleProfile(validated.profile),
    encodeAchievementState(validated.achievements),
    encodePlayerSettings(validated.settings),
    validated.progressGenerationStartedAt,
  ] as const
  return version === 1
    ? [1, ...fields]
    : [PLAYER_DATA_CODEC_VERSION, ...fields, validated.appearance]
}

export function readPlayerDataCodecVersion(
  value: unknown,
): PlayerDataCodecVersion {
  if (
    !Array.isArray(value) ||
    (value[0] !== 1 && value[0] !== PLAYER_DATA_CODEC_VERSION)
  ) {
    throw new Error("Unsupported Player Data codec version")
  }
  return value[0]
}

export function decodePlayerData(value: unknown) {
  const version = readPlayerDataCodecVersion(value)
  const tuple = readTuple(value, version === 1 ? 5 : 6, "Player Data")

  const profile = decodeBattleProfile(tuple[1])
  const playerData = createPlayerData({
    profile,
    achievements: decodeAchievementState(profile.activeDeck, tuple[2]),
    settings: decodePlayerSettings(tuple[3]),
    progressGenerationStartedAt: readIsoTimestamp(
      tuple[4],
      "Progress generation start timestamp",
    ),
    appearance:
      version === 1
        ? DEFAULT_HEROES99_APPEARANCE
        : readHeroes99Appearance(tuple[5]),
  })

  if (
    JSON.stringify(encodePlayerData(playerData, version)) !==
    JSON.stringify(value)
  ) {
    throw new Error("Player Data encoding is not canonical")
  }

  return playerData
}
