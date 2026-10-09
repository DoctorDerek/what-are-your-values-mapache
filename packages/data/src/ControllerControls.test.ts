import { describe, expect, it } from "vitest"
import {
  CONTROLLER_BINDINGS,
  getControllerButtonLabel,
  identifyControllerFamily,
  readControllerCommands,
  type ControllerCommand,
} from "./ControllerControls"
import { getControllerPrompt } from "./ControllerPrompts"

function sample(buttons: readonly number[] = [], axes = [0, 0]) {
  return {
    buttons: Array.from({ length: 17 }, (_, index) => ({
      pressed: buttons.includes(index),
      value: buttons.includes(index) ? 1 : 0,
    })),
    axes,
  }
}

describe("portable controller commands and prompts", () => {
  it("maps every supported button through the same binding owner as Controls", () => {
    for (const binding of CONTROLLER_BINDINGS) {
      for (const button of binding.buttons)
        expect([...readControllerCommands(sample([button]))]).toEqual([
          binding.command,
        ])
    }
    expect([...readControllerCommands(sample([4, 6]))]).toEqual([
      "select-first-value",
    ])
    expect([...readControllerCommands(sample([2, 10, 11, 16]))]).toEqual([])
  })

  it("ignores drift and uses a lower release threshold without jitter", () => {
    expect(readControllerCommands(sample([], [0.2, -0.2])).size).toBe(0)
    const right = readControllerCommands(sample([], [0.7, 0]))
    expect([...right]).toEqual(["right"])
    expect([...readControllerCommands(sample([], [0.4, 0]), right)]).toEqual([
      "right",
    ])
    expect(readControllerCommands(sample([], [0.3, 0]), right).size).toBe(0)
    expect([...readControllerCommands(sample([12, 14]))]).toEqual([
      "up",
      "left",
    ])
    expect([...readControllerCommands(sample([], [0, 0.8]))]).toEqual(["down"])
  })

  it.each([
    ["Xbox Wireless Controller", "xbox", "A"],
    ["Sony DualSense (Vendor: 054c)", "playstation", "Cross"],
    ["Nintendo Switch Pro Controller", "nintendo", "B"],
    ["Steam Deck", "steam-deck", "A"],
    ["Steam Virtual Gamepad", "steam", "A"],
    ["Unknown Standard Gamepad on Android", "generic", "South"],
    ["iOS Controller", "generic", "South"],
  ] as const)(
    "uses device evidence rather than OS for %s",
    (id, family, confirm) => {
      expect(identifyControllerFamily(id)).toBe(family)
      expect(getControllerButtonLabel(family, "confirm")).toBe(confirm)
      const commands: ControllerCommand[] = [
        "confirm",
        "cancel",
        "redo",
        "menu",
        "back",
        "select-first-value",
        "select-second-value",
        "up",
      ]
      for (const command of commands) {
        const prompt = getControllerPrompt(family, command)
        expect(prompt.column).toBeGreaterThanOrEqual(0)
        expect(prompt.column).toBeLessThan(6)
        expect(prompt.row).toBeGreaterThanOrEqual(0)
        expect(prompt.row).toBeLessThan(8)
        expect(prompt.label).toBe(getControllerButtonLabel(family, command))
      }
    },
  )
})
