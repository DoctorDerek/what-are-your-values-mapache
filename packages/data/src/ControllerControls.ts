import type { ControlActionId } from "@game/data/src/Controls"

export type ControllerCommand =
  | "select-first-value"
  | "select-second-value"
  | "confirm"
  | "cancel"
  | "redo"
  | "back"
  | "menu"
  | "up"
  | "down"
  | "left"
  | "right"

export type ControllerFamily =
  "generic" | "xbox" | "playstation" | "nintendo" | "steam-deck" | "steam"

export type ControllerSample = Readonly<{
  buttons: readonly Readonly<{ pressed: boolean; value: number }>[]
  axes: readonly number[]
}>

export const CONTROLLER_DEAD_ZONE = 0.55
export const CONTROLLER_RELEASE_ZONE = 0.35
export const CONTROLLER_REPEAT_DELAY_MS = 450
export const CONTROLLER_REPEAT_INTERVAL_MS = 140

export const CONTROLLER_BINDINGS = [
  {
    command: "select-first-value",
    buttons: [4, 6],
    actionId: "select-first-value",
    input: "Left shoulder or trigger",
  },
  {
    command: "select-second-value",
    buttons: [5, 7],
    actionId: "select-second-value",
    input: "Right shoulder or trigger",
  },
  {
    command: "confirm",
    buttons: [0],
    actionId: "confirm-focused-value",
    input: "South face button",
  },
  {
    command: "cancel",
    buttons: [1],
    actionId: "undo",
    input: "East face button in battle; Cancel elsewhere",
  },
  {
    command: "redo",
    buttons: [3],
    actionId: "redo",
    input: "North face button in battle",
  },
  {
    command: "back",
    buttons: [8],
    actionId: "back",
    input: "View / Share / Minus",
  },
  {
    command: "menu",
    buttons: [9],
    actionId: "menu",
    input: "Start / Menu / Options / Plus",
  },
] as const satisfies readonly Readonly<{
  command: ControllerCommand
  buttons: readonly number[]
  actionId: ControlActionId
  input: string
}>[]

export const CONTROLLER_COPY = {
  title: "Controller",
  introduction:
    "Use a controller with a standard browser mapping. D-pad or left stick moves focus; the south face button activates it. In a focused scrolling panel, Up and Down scroll; Left and Right return to controls. Text entry and browser file dialogs use your keyboard or pointer.",
  activate: "Press a controller button to use controller hints.",
  unsupported:
    "This controller has no standard browser mapping. Keyboard, pointer, and touch remain available.",
  navigate: "D-pad or left stick",
} as const

export function identifyControllerFamily(id: string): ControllerFamily {
  if (/steam\s*deck/i.test(id)) return "steam-deck"
  if (/steam/i.test(id)) return "steam"
  if (/playstation|dualshock|dualsense|sony|054c/i.test(id))
    return "playstation"
  if (/nintendo|switch.*(?:pro|joy)|057e/i.test(id)) return "nintendo"
  if (/xbox|xinput|microsoft.*controller/i.test(id)) return "xbox"
  return "generic"
}

export function isControllerDirection(
  command: ControllerCommand,
): command is "up" | "down" | "left" | "right" {
  return (
    command === "up" ||
    command === "down" ||
    command === "left" ||
    command === "right"
  )
}

export function readControllerCommands(
  sample: ControllerSample,
  previous: ReadonlySet<ControllerCommand> = new Set(),
): ReadonlySet<ControllerCommand> {
  const commands = new Set<ControllerCommand>()
  for (const binding of CONTROLLER_BINDINGS) {
    if (
      binding.buttons.some(
        (index) =>
          sample.buttons[index]?.pressed ||
          (sample.buttons[index]?.value ?? 0) >= CONTROLLER_DEAD_ZONE,
      )
    )
      commands.add(binding.command)
  }
  const directions = [
    { command: "up", button: 12, axis: 1, sign: -1 },
    { command: "down", button: 13, axis: 1, sign: 1 },
    { command: "left", button: 14, axis: 0, sign: -1 },
    { command: "right", button: 15, axis: 0, sign: 1 },
  ] as const
  for (const { command, button, axis, sign } of directions) {
    const threshold = previous.has(command)
      ? CONTROLLER_RELEASE_ZONE
      : CONTROLLER_DEAD_ZONE
    if (
      sample.buttons[button]?.pressed ||
      (sample.axes[axis] ?? 0) * sign >= threshold
    )
      commands.add(command)
  }
  return commands
}

export function getControllerButtonLabel(
  family: ControllerFamily,
  command: ControllerCommand,
) {
  const labels = {
    generic: {
      confirm: "South",
      cancel: "East",
      redo: "North",
      "select-first-value": "L1 / L2",
      "select-second-value": "R1 / R2",
      menu: "Menu",
      back: "Back",
    },
    xbox: {
      confirm: "A",
      cancel: "B",
      redo: "Y",
      "select-first-value": "LB / LT",
      "select-second-value": "RB / RT",
      menu: "Menu",
      back: "View",
    },
    playstation: {
      confirm: "Cross",
      cancel: "Circle",
      redo: "Triangle",
      "select-first-value": "L1 / L2",
      "select-second-value": "R1 / R2",
      menu: "Options",
      back: "Share",
    },
    nintendo: {
      confirm: "B",
      cancel: "A",
      redo: "X",
      "select-first-value": "L / ZL",
      "select-second-value": "R / ZR",
      menu: "+",
      back: "−",
    },
    "steam-deck": {
      confirm: "A",
      cancel: "B",
      redo: "Y",
      "select-first-value": "L1 / L2",
      "select-second-value": "R1 / R2",
      menu: "Options",
      back: "View",
    },
    steam: {
      confirm: "A",
      cancel: "B",
      redo: "Y",
      "select-first-value": "LB / LT",
      "select-second-value": "RB / RT",
      menu: "Start",
      back: "Back",
    },
  } as const
  if (isControllerDirection(command)) return CONTROLLER_COPY.navigate
  return labels[family][command]
}
