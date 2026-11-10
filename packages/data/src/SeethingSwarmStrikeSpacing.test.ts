import { describe, expect, it, vi } from "vitest"
import * as familyProfiles from "./SeethingSwarmFamilyPerformanceProfiles"
import {
  isSeethingSwarmStrikeCompatible,
  resolveSeethingSwarmStrikeSpacing,
} from "./SeethingSwarmStrikeSpacing"
import { ZOO_ANIMALS } from "./ZooAnimals"

describe("Squirrel and Tiger strike spacing", () => {
  it("supplies measured Bear contact for every compatible family strike", () => {
    for (const { id } of ZOO_ANIMALS) {
      const attacks = familyProfiles
        .resolveSeethingSwarmFamilyPerformanceProfile(id)
        .attack.filter((attack) => attack !== "attack_air")
      for (const attack of attacks) {
        const incoming = resolveSeethingSwarmStrikeSpacing(
          id,
          "bearpack",
          attack,
        )
        expect(incoming?.impact).toBeGreaterThan(0)
        expect(incoming?.windup).toBeGreaterThanOrEqual(incoming!.impact)
      }
      for (const attack of ["bite", "stand_attack01", "stand_attack02"]) {
        const outgoing = resolveSeethingSwarmStrikeSpacing(
          "bearpack",
          id,
          attack,
        )
        if (isSeethingSwarmStrikeCompatible("bearpack", id, attack)) {
          expect(outgoing?.impact).toBeGreaterThan(0)
          expect(outgoing?.windup).toBeGreaterThanOrEqual(outgoing!.impact)
        } else expect(outgoing).toBeUndefined()
      }
    }
  })
  it("uses each attacker's own contact pose in the same matchup", () => {
    expect(
      resolveSeethingSwarmStrikeSpacing("squirrelpack", "tigerpack", "attack"),
    ).toEqual({ windup: 24.5, impact: 24.5 })
    expect(
      resolveSeethingSwarmStrikeSpacing("tigerpack", "squirrelpack", "attack"),
    ).toEqual({ windup: 20.5, impact: 20.5 })
  })

  it("clears the defender during windup and accounts for differently drawn strikes", () => {
    expect(
      resolveSeethingSwarmStrikeSpacing(
        "squirrelpack",
        "deer_female",
        "attack",
      ),
    ).toEqual({ windup: 28, impact: 19.5 })
    expect(
      resolveSeethingSwarmStrikeSpacing(
        "deer_female",
        "squirrelpack",
        "attack02",
      ),
    ).toEqual({ windup: 18, impact: 3.5 })
    expect(
      resolveSeethingSwarmStrikeSpacing("cranepack", "tigerpack", "peck"),
    ).toEqual({ windup: 32.5, impact: 26 })
    expect(
      resolveSeethingSwarmStrikeSpacing("wolfpack", "frogpack", "attack"),
    ).toBeUndefined()
  })

  it("falls back to the ordinary tile spacing when a family has no measured contact", () => {
    const original = familyProfiles.resolveSeethingSwarmFamilyPerformanceProfile
    const replacement = vi
      .spyOn(familyProfiles, "resolveSeethingSwarmFamilyPerformanceProfile")
      .mockImplementation((id) =>
        id === "wolfpack"
          ? { ...original(id), packId: "unmeasured-family" }
          : original(id),
      )
    try {
      expect(
        resolveSeethingSwarmStrikeSpacing("squirrelpack", "wolfpack", "attack"),
      ).toBeUndefined()
      expect(
        resolveSeethingSwarmStrikeSpacing("wolfpack", "tigerpack", "attack"),
      ).toBeUndefined()
    } finally {
      replacement.mockRestore()
    }
  })

  it("covers both directions for every original-palette animal", () => {
    for (const { id } of ZOO_ANIMALS) {
      for (const addition of ["squirrelpack", "tigerpack"] as const) {
        const attack =
          familyProfiles.resolveSeethingSwarmFamilyPerformanceProfile(id)
            .attack[0]!
        for (const spacing of [
          resolveSeethingSwarmStrikeSpacing(addition, id, "attack"),
          resolveSeethingSwarmStrikeSpacing(id, addition, attack),
        ]) {
          expect(spacing?.impact).toBeGreaterThan(0)
          expect(spacing?.windup).toBeGreaterThanOrEqual(spacing!.impact)
        }
      }
    }
  })
})
