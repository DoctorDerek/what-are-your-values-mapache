import { describe, expect, it } from "vitest"
import { getBattleValueDisplayName } from "./BattleValueTypography"
import { CANONICAL_VALUES } from "./CanonicalValues"
import { createCustomValueId, type CustomValueDefinition } from "./Value"

describe("Battle value typography", () => {
  it("preserves every canonical name and identity while adding optional display breaks", () => {
    for (const value of CANONICAL_VALUES) {
      const original = { ...value }
      expect(getBattleValueDisplayName(value).replaceAll("\u00ad", "")).toBe(
        value.englishName,
      )
      expect(value).toEqual(original)
    }
  })

  it("gives narrow-screen problem words meaningful optional breaks without replacing existing hyphens", () => {
    for (const [name, displayName] of [
      ["Mindfulness", "Mind\u00adful\u00adness"],
      ["Self-Acceptance", "Self-Accep\u00adtance"],
      ["Self-Knowledge", "Self-Knowl\u00adedge"],
      ["Non-Conformity", "Non-Con\u00adform\u00adity"],
    ]) {
      const value = CANONICAL_VALUES.find(({ englishName }) => englishName === name)!
      expect(getBattleValueDisplayName(value)).toBe(displayName)
    }
  })

  it("does not apply the English catalog break dictionary to player-authored names", () => {
    const value: CustomValueDefinition = {
      kind: "custom",
      id: createCustomValueId("custom:00000000-0000-4000-8000-000000000001"),
      name: "Mindfulness / 自由",
      definition: "My own meaning.",
      creationOrdinal: 1,
      createdAt: "2026-10-11T00:00:00.000Z",
      updatedAt: "2026-10-11T00:00:00.000Z",
    }
    expect(getBattleValueDisplayName(value)).toBe(value.name)
  })
})
