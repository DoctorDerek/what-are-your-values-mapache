export const CONTROLS_COPY = Object.freeze({
  title: "Controls",
  stopDescription:
    "Stop battling. If your progress changed, review your results before returning home.",
  closeAction: "Close",
})

export const CONTROL_ACTION_LABELS = Object.freeze({
  "select-first-value": "Select First Value",
  "select-second-value": "Select Second Value",
  undo: "Undo",
  redo: "Redo",
  menu: "Menu",
  stop: "Stop",
  "move-focus": "Move Focus",
  "confirm-focused-value": "Confirm Focused Value",
  back: "Back",
} as const)

export type ControlActionId = keyof typeof CONTROL_ACTION_LABELS

export function orderControlBindings<
  Binding extends Readonly<{ actionId: ControlActionId }>,
>(bindings: readonly Binding[]): readonly Binding[] {
  const actionOrder = Object.keys(CONTROL_ACTION_LABELS)
  return [...bindings].sort(
    (first, second) =>
      actionOrder.indexOf(first.actionId) -
      actionOrder.indexOf(second.actionId),
  )
}

export const WEB_CONTROL_GROUPS = Object.freeze([
  Object.freeze({
    id: "touch-pointer",
    title: "Touch & Pointer",
    bindings: Object.freeze([
      Object.freeze({
        actionId: "select-first-value",
        input: "Tap or primary-click the first value card",
      }),
      Object.freeze({
        actionId: "select-second-value",
        input: "Tap or primary-click the second value card",
      }),
      Object.freeze({ actionId: "undo", input: "Activate Undo" }),
      Object.freeze({ actionId: "redo", input: "Activate Redo" }),
      Object.freeze({ actionId: "menu", input: "Activate Menu" }),
      Object.freeze({ actionId: "stop", input: "Activate Stop" }),
    ]),
  }),
  Object.freeze({
    id: "keyboard",
    title: "Keyboard",
    bindings: Object.freeze([
      Object.freeze({
        actionId: "select-first-value",
        input: "1 or A",
      }),
      Object.freeze({
        actionId: "select-second-value",
        input: "2 or D",
      }),
      Object.freeze({
        actionId: "move-focus",
        input: "Tab, Shift+Tab, or Arrow keys",
      }),
      Object.freeze({
        actionId: "confirm-focused-value",
        input: "Enter or Space",
      }),
      Object.freeze({
        actionId: "undo",
        input: "Z, Ctrl+Z, or Cmd+Z",
      }),
      Object.freeze({
        actionId: "redo",
        input: "Y, Ctrl+Y, or Cmd+Shift+Z",
      }),
      Object.freeze({ actionId: "menu", input: "Escape" }),
      Object.freeze({
        actionId: "stop",
        input: "Activate the visible Stop control",
      }),
    ]),
  }),
] as const satisfies readonly {
  readonly id: string
  readonly title: string
  readonly bindings: readonly {
    readonly actionId: ControlActionId
    readonly input: string
  }[]
}[])

export const NATIVE_CONTROL_GROUPS = Object.freeze([
  Object.freeze({
    id: "touch",
    title: "Touch",
    bindings: Object.freeze([
      Object.freeze({
        actionId: "select-first-value",
        input: "Tap the first value card",
      }),
      Object.freeze({
        actionId: "select-second-value",
        input: "Tap the second value card",
      }),
      Object.freeze({ actionId: "undo", input: "Tap Undo" }),
      Object.freeze({ actionId: "redo", input: "Tap Redo" }),
      Object.freeze({ actionId: "menu", input: "Tap Menu" }),
      Object.freeze({ actionId: "stop", input: "Tap Stop" }),
    ]),
  }),
] as const satisfies readonly {
  readonly id: string
  readonly title: string
  readonly bindings: readonly {
    readonly actionId: ControlActionId
    readonly input: string
  }[]
}[])
