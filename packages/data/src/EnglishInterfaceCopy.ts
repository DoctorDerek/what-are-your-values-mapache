import {
  BATTLE_ANIMATION_SPEED_GROUP_LABEL,
  BATTLE_ANIMATION_SPEED_OPTIONS,
} from "./BattleAnimationSpeedCopy"
import {
  CONTROLLER_BINDINGS,
  CONTROLLER_BUTTON_LABELS,
  CONTROLLER_COPY,
} from "./ControllerControls"
import {
  CONTROL_ACTION_LABELS,
  CONTROLS_COPY,
  NATIVE_CONTROL_GROUPS,
  WEB_CONTROL_GROUPS,
} from "./Controls"
import { CUSTOM_VALUE_INVITATION_COPY } from "./CustomValueInvitationCopy"
import { customValueValidationMessages } from "./CustomValueValidationMessages"
import { HEROES99_CHOICE_COPY } from "./Heroes99ChoiceCopy"
import { DRESSING_ROOM_COPY } from "./Heroes99DressingRoom"
import { INFORMATION_PANELS } from "./InformationPanels"
import { playerDataPortabilityCopy } from "./PlayerDataPortabilityCopy"
import { playerDataRecoveryCopy } from "./PlayerDataRecoveryCopy"
import {
  playerDataResetBackupReadyNotice,
  playerDataResetCopy,
} from "./PlayerDataResetCopy"
import {
  CONTROL_HINT_SETTING_OPTIONS,
  PLAYER_SETTINGS_COPY,
  REDUCED_MOTION_SETTING_OPTIONS,
} from "./PlayerSettingsCopy"
import { presentationLoadingCopy } from "./PresentationLoadingCopy"
import { PRODUCT_MENU_COPY, PRODUCT_MENU_DESTINATIONS } from "./ProductMenu"
import { PROGRESSION_COPY } from "./ProgressionCopy"
import { RESULTS_COPY } from "./ResultsCopy"
import { RUNTIME_RECOVERY_COPY } from "./RuntimeRecoveryCopy"
import { SCREEN_COPY } from "./ScreenCopy"
import { VALUE_RANK_COPY } from "./ValueRankMedal"
import { webWriterConflictCopy } from "./WebWriterConflictCopy"

type LocalizedResource<Source> = Source extends (
  ...parameters: infer Parameters
) => string
  ? (...parameters: Parameters) => string
  : Source extends string
    ? string
    : Source extends object
      ? {
          readonly [Key in keyof Source]: Key extends
            "id" | "kind" | "value" | "command" | "actionId" | "url"
            ? Source[Key]
            : LocalizedResource<Source[Key]>
        }
      : Source

const englishInterfaceSource = Object.freeze({
  screen: SCREEN_COPY,
  progression: PROGRESSION_COPY,
  battleSpeed: {
    label: BATTLE_ANIMATION_SPEED_GROUP_LABEL,
    options: BATTLE_ANIMATION_SPEED_OPTIONS,
  },
  controls: CONTROLS_COPY,
  controlActions: CONTROL_ACTION_LABELS,
  webControls: WEB_CONTROL_GROUPS,
  nativeControls: NATIVE_CONTROL_GROUPS,
  controller: CONTROLLER_COPY,
  controllerBindings: CONTROLLER_BINDINGS,
  controllerButtonLabels: CONTROLLER_BUTTON_LABELS,
  rank: VALUE_RANK_COPY,
  customValues: CUSTOM_VALUE_INVITATION_COPY,
  customValueValidation: customValueValidationMessages,
  dressingRoom: DRESSING_ROOM_COPY,
  heroChoices: HEROES99_CHOICE_COPY,
  information: INFORMATION_PANELS,
  portability: playerDataPortabilityCopy,
  recovery: playerDataRecoveryCopy,
  resets: playerDataResetCopy,
  resetBackupReady: playerDataResetBackupReadyNotice,
  settings: PLAYER_SETTINGS_COPY,
  reducedMotionOptions: REDUCED_MOTION_SETTING_OPTIONS,
  controlHintOptions: CONTROL_HINT_SETTING_OPTIONS,
  loading: presentationLoadingCopy,
  menu: PRODUCT_MENU_COPY,
  menuDestinations: PRODUCT_MENU_DESTINATIONS,
  results: RESULTS_COPY,
  runtimeRecovery: RUNTIME_RECOVERY_COPY,
  writerConflict: webWriterConflictCopy,
})

export type InterfaceCopy = LocalizedResource<typeof englishInterfaceSource>
export const ENGLISH_INTERFACE_COPY: InterfaceCopy = englishInterfaceSource

export const INTERFACE_FORMATTER_SAMPLES: Readonly<
  Record<string, readonly (readonly unknown[])[]>
> = Object.freeze({
  "interfaceCopy.results.profileLevel": [["1"], ["1,000"]],
  "interfaceCopy.results.profileXp": [["0"], ["10,000"]],
  ...Object.fromEntries(
    ["skin", "face", "style", "outfit", "palette"].map((key) => [
      `interfaceCopy.heroChoices.${key}`,
      [["1"], ["10"]],
    ]),
  ),
  ...Object.fromEntries(
    [
      "battleTitle",
      "battleReason",
      "battleRequirement",
      "levelTitle",
      "levelReason",
      "levelRequirement",
      "noEligibleValue",
      "topFiveProgress",
    ].map((key) => [`interfaceCopy.progression.${key}`, [["1"], ["1,000"]]]),
  ),
  ...Object.fromEntries(
    ["eligibleValue", "comparisonProgress", "reward"].map((key) => [
      `interfaceCopy.progression.${key}`,
      [
        ["1", "5"],
        ["99", "100"],
      ],
    ]),
  ),
  "interfaceCopy.progression.choice": [["Fun", "2", "1"]],
  "interfaceCopy.progression.nextPair": [["Fun", "Health"]],
  "interfaceCopy.progression.selection": [["Fun", "4", "Fun or Health"]],
  "interfaceCopy.progression.undo": [["Fun", "4", "Fun or Health"]],
  "interfaceCopy.progression.redo": [["Fun", "4", "Fun or Health"]],
  "interfaceCopy.progression.levelProgress": [["1", "20", "2"]],
  "interfaceCopy.screen.removeValue": [["Craftsmanship"]],
  "interfaceCopy.rank.rank": [[1], [103]],
  "interfaceCopy.rank.medal": [
    [1, "gold"],
    [10, "silver"],
    [15, "bronze"],
  ],
  ...Object.fromEntries(
    [
      "updateValue",
      "editValue",
      "removeDraft",
      "openValue",
      "valueDetails",
      "playGame",
      "publicInformation",
      "versionNumber",
      "xpTowardLevel",
    ].map((key) => [`interfaceCopy.screen.${key}`, [["Example"]]]),
  ),
  "interfaceCopy.screen.valuesShown": [
    [0, "0"],
    [1, "1"],
    [103, "103"],
  ],
  "interfaceCopy.screen.cardPreview": [
    ["My Top Five Life Values", ["Fun", "Health"]],
  ],
  "interfaceCopy.screen.characterCount": [["4", "40"]],
  "interfaceCopy.screen.levelProgress": [["2", "4", "20", "3"]],
  "interfaceCopy.screen.valueLevel": [["1"], ["1,000"]],
  "interfaceCopy.screen.compactLevel": [["1"], ["1,000"]],
  "interfaceCopy.screen.activeValues": [["103"], ["104"]],
  "interfaceCopy.screen.includedValueCount": [["103"]],
  "interfaceCopy.screen.achievementAnnouncement": [
    ["First Battle", "First pair compared."],
  ],
  "interfaceCopy.screen.dismissAchievement": [["First Battle"]],
  "interfaceCopy.screen.unlockedOn": [["Oct 15, 2026"]],
  "interfaceCopy.screen.achievementsUnlocked": [
    ["0", "40"],
    ["40", "40"],
  ],
  "interfaceCopy.screen.valueResult": [["1", "Fun", "5", "100"]],
  "interfaceCopy.screen.resultSummary": [
    ["Your values were re-ranked", "4", "2", "+4"],
  ],
  "interfaceCopy.screen.profileXpTowardLevel": [["2"]],
  "interfaceCopy.screen.xpFraction": [["4", "20"]],
  "interfaceCopy.dressingRoom.choices": [["Skin"], ["Weapon"]],
  "interfaceCopy.dressingRoom.palette": [["Hair"], ["Clothing"]],
})
