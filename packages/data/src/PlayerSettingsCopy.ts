export const PLAYER_SETTINGS_COPY = Object.freeze({
  title: "Settings",
  closeAction: "Back",
  languageHeading: "Language",
  reducedMotionHeading: "Reduced Motion",
  controlHintsHeading: "Control Hints",
  resetHeading: "Reset or Delete",
  savingStatus: "Saving setting…",
})

export const REDUCED_MOTION_SETTING_OPTIONS = Object.freeze([
  Object.freeze({
    value: "system",
    label: "Follow System",
    description: "Use your device or browser motion setting.",
  }),
  Object.freeze({
    value: "on",
    label: "On",
    description: "Minimize movement.",
  }),
  Object.freeze({
    value: "off",
    label: "Off",
    description: "Use full motion.",
  }),
] as const satisfies readonly {
  readonly value: "system" | "on" | "off"
  readonly label: string
  readonly description: string
}[])

export const CONTROL_HINT_SETTING_OPTIONS = Object.freeze([
  Object.freeze({
    value: "auto",
    label: "Auto",
    description: "Show hints for your current input.",
  }),
  Object.freeze({
    value: "always",
    label: "Always",
    description: "Always show the current input hint.",
  }),
  Object.freeze({
    value: "off",
    label: "Off",
    description: "Hide control hints.",
  }),
] as const satisfies readonly {
  readonly value: "auto" | "always" | "off"
  readonly label: string
  readonly description: string
}[])
