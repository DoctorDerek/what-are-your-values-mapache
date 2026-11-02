import { describe, expect, it } from "vitest"
import { resolveSeethingSwarmFamilyPerformanceProfile } from "./SeethingSwarmFamilyPerformanceProfiles"
import { resolveSeethingSwarmStrikeSpacing } from "./SeethingSwarmStrikeSpacing"
import { ZOO_ANIMALS } from "./ZooAnimals"

describe("Squirrel and Tiger strike spacing", () => {
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

  it("covers both directions for every original-palette animal", () => {
    for (const { id } of ZOO_ANIMALS) {
      for (const addition of ["squirrelpack", "tigerpack"] as const) {
        const attack =
          resolveSeethingSwarmFamilyPerformanceProfile(id).attack[0]!
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
