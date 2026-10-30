export const playerDataPortabilityCopy = Object.freeze({
  activity: {
    creatingBackup: "Creating backup…",
    checkingBackup: "Checking backup…",
    creatingSafetyBackup: "Creating safety backup…",
    restoringBackup: "Restoring backup…",
    applyingReset: "Applying reset…",
    deletingData: "Deleting data…",
    creatingDiagnostic: "Creating diagnostic file…",
  },
  preview: {
    backupCreated: "Backup Created",
    sourceApplication: "Source Application",
    sourceBuild: "Source Build",
    saveSchema: "Save Schema",
    totalComparisons: "Total Comparisons",
    canonicalCatalog: "Included Values Catalog",
    includedValues: "Included Values",
    customValues: "Custom Values",
    activeValues: "Active Values",
    currentCycle: "Current Cycle",
    cyclePairings: "Cycle Pairings",
    deckRevision: "Deck Revision",
    progressGeneration: "Progress Generation",
    achievements: "Achievements",
    achievementProgressGeneration: "Achievement Progress Generation",
    language: "Language",
    replacement: "Replacement",
  },
  screenTitle: "Import & Export",
  introduction:
    "Your progress, Custom Values, achievements, language, and settings are stored on this device. Export a JSON backup to keep a portable copy or move your data between supported apps for What Are Your Values, Mapache?",
  exportTitle: "Export Data",
  exportDescription:
    "Save a versioned JSON backup of your progress, Custom Values, achievements, language, settings, and other portable data for What Are Your Values, Mapache? Exporting does not upload your data to us.",
  exportAction: "Export Data",
  exportSuccess: "Your backup for What Are Your Values, Mapache? is ready.",
  exportFailure:
    "What Are Your Values, Mapache? could not create a backup. Your saved data was not changed. Please try again or check available device storage.",
  importTitle: "Import Data",
  importDescription:
    "Choose a JSON backup for What Are Your Values, Mapache? The app will validate it and show you a preview before replacing data on this device.",
  chooseBackupAction: "Choose Backup",
  importPreviewTitle: "Review Import",
  technicalDetails: "Technical details",
  importPreviewWarning:
    "Importing this backup will replace the current data for What Are Your Values, Mapache? on this device. A local safety backup will be created first.",
  importCancelAction: "Cancel",
  importReplaceAction: "Import & Replace",
  importCancelled: "Import canceled. Your data was not changed.",
  importSuccess: "Backup restored. Your imported progress is ready.",
  importSuccessSummary: "Backup restored",
  importInvalid:
    "This file is not a valid backup for What Are Your Values, Mapache? Your data was not changed.",
  importNewer:
    "This backup was created by a newer version of What Are Your Values, Mapache? and cannot be opened safely here. Update the app and try again. Your data was not changed.",
  importUnsupported:
    "This backup uses a format version What Are Your Values, Mapache? cannot open safely. Your data was not changed.",
  importUnsafe:
    "This backup is too large or contains data What Are Your Values, Mapache? cannot process safely. Your data was not changed.",
  importRestoreFailure:
    "What Are Your Values, Mapache? could not restore this backup. Your saved data was not changed. Please try again.",
})
