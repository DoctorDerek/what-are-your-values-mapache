import {
  CONTROLLER_BINDINGS,
  getControllerButtonLabel,
  type ControllerCommand,
  type ControllerFamily,
} from "@game/data/src/ControllerControls"

export const CONTROLLER_PROMPT_SIZE = 64
export const CONTROLLER_PROMPT_COLUMNS = 6
export const CONTROLLER_PROMPT_ROWS = 8

export const CONTROLLER_PROMPT_SOURCES = {
  generic: {
    column: 0,
    folder: "Generic/Default",
    files: [
      "Steam Deck/Default/steamdeck_button_l1",
      "Steam Deck/Default/steamdeck_button_r1",
      "Nintendo Switch/Default/switch_buttons_down",
      "Nintendo Switch/Default/switch_buttons_right",
      "Nintendo Switch/Default/switch_buttons_up",
      "Xbox Series/Default/xbox_button_view",
      "Xbox Series/Default/xbox_button_menu",
      "Nintendo Switch/Default/switch_dpad",
    ],
  },
  xbox: {
    column: 1,
    folder: "Xbox Series/Default",
    files: [
      "xbox_lb",
      "xbox_rb",
      "xbox_button_a",
      "xbox_button_b",
      "xbox_button_y",
      "xbox_button_view",
      "xbox_button_menu",
      "xbox_dpad",
    ],
  },
  playstation: {
    column: 2,
    folder: "PlayStation Series/Default",
    files: [
      "playstation_trigger_l1",
      "playstation_trigger_r1",
      "playstation_button_cross",
      "playstation_button_circle",
      "playstation_button_triangle",
      "playstation4_button_share",
      "playstation4_button_options",
      "playstation_dpad",
    ],
  },
  nintendo: {
    column: 3,
    folder: "Nintendo Switch/Default",
    files: [
      "switch_button_l",
      "switch_button_r",
      "switch_button_b",
      "switch_button_a",
      "switch_button_x",
      "switch_button_minus",
      "switch_button_plus",
      "switch_dpad",
    ],
  },
  "steam-deck": {
    column: 4,
    folder: "Steam Deck/Default",
    files: [
      "steamdeck_button_l1",
      "steamdeck_button_r1",
      "steamdeck_button_a",
      "steamdeck_button_b",
      "steamdeck_button_y",
      "steamdeck_button_view",
      "steamdeck_button_options",
      "steamdeck_dpad",
    ],
  },
  steam: {
    column: 5,
    folder: "Steam Controller/Default",
    files: [
      "steam_lb",
      "steam_rb",
      "steam_button_a",
      "steam_button_b",
      "steam_button_y",
      "controller_button_view",
      "controller_button_options",
      "steam_dpad",
    ],
  },
} as const satisfies Record<
  ControllerFamily,
  Readonly<{ column: number; folder: string; files: readonly string[] }>
>

export function getControllerPrompt(
  family: ControllerFamily,
  command: ControllerCommand,
) {
  const bindingIndex = CONTROLLER_BINDINGS.findIndex(
    (binding) => binding.command === command,
  )
  return {
    column: CONTROLLER_PROMPT_SOURCES[family].column,
    row: bindingIndex < 0 ? CONTROLLER_PROMPT_ROWS - 1 : bindingIndex,
    label: getControllerButtonLabel(family, command),
  }
}
