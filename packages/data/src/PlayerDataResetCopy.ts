type PlayerDataResetCopy = {
  readonly actionLabel: string
  readonly summary: string
  readonly confirmationTitle: string
  readonly confirmationBody: readonly string[]
  readonly successAnnouncement: string
}

export const playerDataResetCopy = Object.freeze({
  "delete-all-custom-values": Object.freeze({
    actionLabel: "Delete All Custom Values",
    summary:
      "Remove every Custom Value while keeping progress for included values, achievements, and settings.",
    confirmationTitle: "Delete All Custom Values?",
    confirmationBody: Object.freeze([
      "This permanently removes every Custom Value, its XP, level, and win/loss counters, and removes it from future battles.",
      "It keeps the 103 included values and their progress, achievements and lifetime achievement progress, language, accessibility settings, controls, avatar customization, and other preferences.",
      "Your battles return to the 103 included values. Battle matching restarts, and Undo and Redo history clears.",
      "This cannot be undone after you confirm. Export your data first if you may want it later.",
    ]),
    successAnnouncement:
      "All Custom Values were deleted. Your included values kept their progress. Achievements and settings were kept.",
  }),
  "reset-levels-and-experience": Object.freeze({
    actionLabel: "Reset Levels & Experience",
    summary:
      "Return every active value to Level 1 with 0 XP while keeping Custom Values, achievements, and settings.",
    confirmationTitle: "Reset Levels & Experience?",
    confirmationBody: Object.freeze([
      "This returns every active value to Level 1 with 0 XP, clears value win/loss counters, restarts the current pair cycle, and clears Undo and Redo history.",
      "Your value ranking starts over with all values tied.",
      "It keeps your Custom Value definitions, achievements and lifetime achievement progress, language, accessibility settings, controls, avatar customization, and other preferences.",
      "This cannot be undone after you confirm. Export your data first if you may want it later.",
    ]),
    successAnnouncement:
      "Levels and experience were reset. Custom Values, achievements, and settings were kept.",
  }),
  "reset-achievements": Object.freeze({
    actionLabel: "Reset Achievements",
    summary:
      "Clear local achievement unlocks and achievement-only progress while keeping your values and ranking.",
    confirmationTitle: "Reset Achievements?",
    confirmationBody: Object.freeze([
      "This clears unlocked achievements and achievement-only progress, including the lifetime battle count used for achievement milestones.",
      "It keeps your included and Custom Values, XP, levels, value win/loss counters, current pair cycle, Undo and Redo history, language, accessibility settings, controls, avatar customization, and other preferences.",
      "After reset, achievements require new qualifying progress. A milestone you already reached does not unlock again just because you reset achievements. Use Reset Levels & Experience too if you want to earn level milestones again from the beginning.",
      "This cannot be undone after you confirm. Export your data first if you may want it later.",
    ]),
    successAnnouncement:
      "Achievements and achievement progress were reset. Your values, ranking, and settings were kept.",
  }),
  "delete-all-data": Object.freeze({
    actionLabel: "Delete All Data",
    summary:
      "Remove all player data for What Are Your Values, Mapache? from this device or browser profile and return to Introduction.",
    confirmationTitle: "Delete All Data?",
    confirmationBody: Object.freeze([
      "This permanently removes all player data for What Are Your Values, Mapache? from this device or browser profile, including levels, experience, Custom Values, achievements, battle matching, Undo and Redo history, language, settings, local backups, and control mappings.",
      "You will return to Introduction. This does not uninstall the app or remove the offline program files needed to open it. This cannot be undone. Export your data first if you may want it later.",
    ]),
    successAnnouncement:
      "All local player data for What Are Your Values, Mapache? was deleted.",
  }),
}) satisfies Readonly<Record<string, PlayerDataResetCopy>>

export const playerDataResetBackupReadyNotice =
  "Your private backup is ready. Review the reset when you are ready." as const
