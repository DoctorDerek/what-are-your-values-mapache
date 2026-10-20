import { describe, expect, it } from "vitest"
import {
  CONTROL_ACTION_LABELS,
  CONTROLS_COPY,
  NATIVE_CONTROL_GROUPS,
  orderControlBindings,
  WEB_CONTROL_GROUPS,
} from "./Controls"

describe("Controls", () => {
  it("orders existing bindings by action without mutating the shared input contract", () => {
    const keyboard = WEB_CONTROL_GROUPS[1].bindings
    const original = [...keyboard]
    const ordered = orderControlBindings(keyboard)
    expect(ordered.map(({ actionId }) => actionId)).toEqual([
      "select-first-value",
      "select-second-value",
      "undo",
      "redo",
      "menu",
      "stop",
      "move-focus",
      "confirm-focused-value",
    ])
    expect(keyboard).toEqual(original)
    expect(ordered).toHaveLength(keyboard.length)
    for (const binding of ordered) expect(keyboard).toContain(binding)
    expect(CONTROLS_COPY.stopDescription).toContain("review your results")
  })

  it("describes only implemented web and native input paths", () => {
    expect(WEB_CONTROL_GROUPS).toEqual([
      {
        id: "touch-pointer",
        title: "Touch & Pointer",
        bindings: [
          {
            actionId: "select-first-value",
            input: "Tap or primary-click the first value card",
          },
          {
            actionId: "select-second-value",
            input: "Tap or primary-click the second value card",
          },
          { actionId: "undo", input: "Activate Undo" },
          { actionId: "redo", input: "Activate Redo" },
          { actionId: "menu", input: "Activate Menu" },
          { actionId: "stop", input: "Activate Stop" },
        ],
      },
      {
        id: "keyboard",
        title: "Keyboard",
        bindings: [
          { actionId: "select-first-value", input: "1 or A" },
          { actionId: "select-second-value", input: "2 or D" },
          {
            actionId: "move-focus",
            input: "Tab, Shift+Tab, or Arrow keys",
          },
          { actionId: "confirm-focused-value", input: "Enter or Space" },
          { actionId: "undo", input: "Z, Ctrl+Z, or Cmd+Z" },
          {
            actionId: "redo",
            input: "Y, Ctrl+Y, or Cmd+Shift+Z",
          },
          { actionId: "menu", input: "Escape" },
          {
            actionId: "stop",
            input: "Activate the visible Stop control",
          },
        ],
      },
    ])
    expect(NATIVE_CONTROL_GROUPS).toEqual([
      {
        id: "touch",
        title: "Touch",
        bindings: [
          { actionId: "select-first-value", input: "Tap the first value card" },
          {
            actionId: "select-second-value",
            input: "Tap the second value card",
          },
          { actionId: "undo", input: "Tap Undo" },
          { actionId: "redo", input: "Tap Redo" },
          { actionId: "menu", input: "Tap Menu" },
          { actionId: "stop", input: "Tap Stop" },
        ],
      },
    ])

    expect(
      JSON.stringify({
        web: WEB_CONTROL_GROUPS,
        native: NATIVE_CONTROL_GROUPS,
      }),
    ).not.toMatch(
      /controller|remap|backspace|mouse back|mouse forward|auxiliary/i,
    )
  })

  it("freezes every shared Controls collection and entry", () => {
    expect(Object.isFrozen(CONTROLS_COPY)).toBe(true)
    expect(Object.isFrozen(CONTROL_ACTION_LABELS)).toBe(true)

    for (const groups of [WEB_CONTROL_GROUPS, NATIVE_CONTROL_GROUPS]) {
      expect(Object.isFrozen(groups)).toBe(true)
      expect(groups.every((group) => Object.isFrozen(group))).toBe(true)
      expect(groups.every(({ bindings }) => Object.isFrozen(bindings))).toBe(
        true,
      )
      expect(
        groups.every(({ bindings }) =>
          bindings.every((binding) => Object.isFrozen(binding)),
        ),
      ).toBe(true)
    }
  })
})
