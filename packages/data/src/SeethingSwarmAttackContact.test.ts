import { describe, expect, it } from "vitest"
import { resolveSeethingSwarmAttackContact } from "./SeethingSwarmAttackContact"
import type { SeethingSwarmRuntimeCharacterClip } from "./SeethingSwarmRuntimeClipCatalog"

const attack = {
  kind: "character",
  animalId: "raccoonpack",
  animationId: "attack",
  relativePath: "raccoonpack/attack.png",
  frameWidth: 32,
  frameHeight: 32,
  frameCount: 7,
  visibleBounds: { left: 0, top: 0, width: 32, height: 32 },
  asset: "attack",
} satisfies SeethingSwarmRuntimeCharacterClip<string>

describe("source-inspected attack contact", () => {
  it("starts raccoon contact on the fourth source frame", () => {
    expect(resolveSeethingSwarmAttackContact(attack)).toEqual({
      frameIndex: 3,
      facesAway: false,
    })
  })

  it("turns the deer away for its backwards kick only", () => {
    expect(
      resolveSeethingSwarmAttackContact({
        ...attack,
        animalId: "deer_female",
        animationId: "attack02",
        frameCount: 5,
      }),
    ).toEqual({ frameIndex: 1, facesAway: true })
  })

  it("does not invent contact for an uninspected source or mismatched frame count", () => {
    expect(
      resolveSeethingSwarmAttackContact({ ...attack, frameCount: 6 }),
    ).toBeNull()
    expect(
      resolveSeethingSwarmAttackContact({ ...attack, animationId: "idle" }),
    ).toBeNull()
  })
})
