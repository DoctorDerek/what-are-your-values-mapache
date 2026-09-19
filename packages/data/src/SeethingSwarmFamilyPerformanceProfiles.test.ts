import { describe, expect, it, vi } from "vitest"
import {
  resolveSeethingSwarmFamilyPerformanceProfile,
  SEETHING_SWARM_FAMILY_PERFORMANCE_PROFILES,
} from "./SeethingSwarmFamilyPerformanceProfiles"
import { SEETHING_SWARM_SOURCE_PACKS } from "./SeethingSwarmSourceEvidence"

describe("approved SeethingSwarm family profiles", () => {
  it.each([
    { sourcePacks: [] },
    {
      sourcePacks: [
        { ...SEETHING_SWARM_SOURCE_PACKS[0], packId: "unadopted-family" },
      ],
    },
  ])(
    "rejects a source registry whose animal family has no approved profile",
    async ({ sourcePacks }) => {
      vi.resetModules()
      vi.doMock("./SeethingSwarmSourceEvidence", () => ({
        SEETHING_SWARM_SOURCE_PACKS: sourcePacks,
      }))
      try {
        const { resolveSeethingSwarmFamilyPerformanceProfile: resolveProfile } =
          await import("./SeethingSwarmFamilyPerformanceProfiles")
        expect(() => resolveProfile("bat")).toThrow(
          "Missing SeethingSwarm family profile: bat",
        )
      } finally {
        vi.doUnmock("./SeethingSwarmSourceEvidence")
        vi.resetModules()
      }
    },
  )
  it("covers the 27 source families and resolves all 45 variants through their source owner", () => {
    expect(SEETHING_SWARM_FAMILY_PERFORMANCE_PROFILES).toHaveLength(27)
    expect(
      new Set(
        SEETHING_SWARM_FAMILY_PERFORMANCE_PROFILES.map(({ packId }) => packId),
      ).size,
    ).toBe(27)
    let variants = 0
    for (const pack of SEETHING_SWARM_SOURCE_PACKS) {
      for (const animalId of pack.animalIds) {
        const profile = resolveSeethingSwarmFamilyPerformanceProfile(animalId)
        expect(profile.packId).toBe(pack.packId)
        expect(Object.isFrozen(profile)).toBe(true)
        for (const pool of [
          profile.calm,
          profile.attention,
          profile.locomotion,
          profile.attack,
          profile.celebration,
        ]) {
          expect(pool.length).toBeGreaterThan(0)
          expect(new Set(pool).size).toBe(pool.length)
          expect(Object.isFrozen(pool)).toBe(true)
        }
        variants += 1
      }
    }
    expect(variants).toBe(45)
  })

  it("uses expressive blinking rather than fear for bunny and turtle attention", () => {
    for (const animalId of ["bunnypack", "turtle"] as const) {
      expect(
        resolveSeethingSwarmFamilyPerformanceProfile(animalId).attention,
      ).toEqual(["idle_blink"])
    }
    expect(
      resolveSeethingSwarmFamilyPerformanceProfile("frogpack").attack,
    ).toEqual(["attackforward"])
    expect(resolveSeethingSwarmFamilyPerformanceProfile("bat").calm).toEqual([
      "idle_upright",
      "idle_upright_blink",
    ])
  })
})
