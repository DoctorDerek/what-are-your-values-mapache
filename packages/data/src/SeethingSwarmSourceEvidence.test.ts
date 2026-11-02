import { describe, expect, it } from "vitest"
import {
  SEETHING_SWARM_SOURCE_PACKS,
  SEETHING_SWARM_SOURCE_SNAPSHOT,
} from "./SeethingSwarmSourceEvidence"
import { ZOO_ANIMALS } from "./ZooAnimals"

const EXPECTED_PACK_IDS = Object.freeze([
  "batpack",
  "bunnypack",
  "catset",
  "catset-kittens",
  "chickenpack",
  "cranepack",
  "crowpack",
  "deerpack",
  "dogpack",
  "dragonflypack",
  "falconpack",
  "foxpack",
  "frogpack",
  "lil-axolotl",
  "lil-doggies",
  "lil-fox",
  "lil-hedgehog",
  "lil-otter",
  "lil-pig",
  "mousepack",
  "owlpack",
  "pandapack",
  "parrotpack",
  "pigpack",
  "raccoonpack",
  "squirrelpack",
  "tigerpack",
  "turtlepack",
  "wolfpack",
])

const EXPECTED_EVIDENCE_FILES = Object.freeze([
  Object.freeze({
    relativePath:
      "seethingswarm_animals_full_animation_list_with_frame_count.txt",
    sha256: "068CB81C0A55B01937EB5122AB67EAC87537A0DC9A39FD4D1B9D330D68B21D51",
  }),
  Object.freeze({
    relativePath: "seethingswarm_animals_colors_list.txt",
    sha256: "F5E35860055BED865EF9A3363DC0FE35BD273AD749A1D857BB3ED20686707B33",
  }),
  Object.freeze({
    relativePath: "seethingswarm_animals_spritesheet_sizes.txt",
    sha256: "6F2775009EFE2D9F972F05A4E509B89796F5EFADEC7887706FC48516EEEA00D6",
  }),
  Object.freeze({
    relativePath: "LICENSE.txt",
    sha256: "13F97ABBA7D10CBCFD343EBA184B704C8BA329D5434818BC05A6D1ECF6E38200",
  }),
])

describe("SeethingSwarm source evidence", () => {
  it("locks the audited source-snapshot arithmetic and evidence hashes", () => {
    expect(SEETHING_SWARM_SOURCE_SNAPSHOT).toMatchObject({
      sourceSnapshotId: "seethingswarm-animals:2026-11-01",
      storefrontReviewedOn: "2026-11-01",
      packCount: 29,
      stableAnimalCount: 47,
      characterAnimationStripCount: 801,
      auxiliaryEffectStripCount: 1,
      excludedHumanWeaponStripCount: 102,
      totalPngStripCount: 904,
      distinctAnimationIdCount: 87,
    })
    expect(
      SEETHING_SWARM_SOURCE_SNAPSHOT.characterAnimationStripCount +
        SEETHING_SWARM_SOURCE_SNAPSHOT.auxiliaryEffectStripCount +
        SEETHING_SWARM_SOURCE_SNAPSHOT.excludedHumanWeaponStripCount,
    ).toBe(SEETHING_SWARM_SOURCE_SNAPSHOT.totalPngStripCount)
    expect(SEETHING_SWARM_SOURCE_SNAPSHOT.evidenceFiles).toEqual(
      EXPECTED_EVIDENCE_FILES,
    )
  })

  it("covers the exact twenty-nine official source packs", () => {
    const packIds = SEETHING_SWARM_SOURCE_PACKS.map(({ packId }) => packId)

    expect(SEETHING_SWARM_SOURCE_PACKS).toHaveLength(
      SEETHING_SWARM_SOURCE_SNAPSHOT.packCount,
    )
    expect(packIds).toEqual(EXPECTED_PACK_IDS)
    expect(new Set(packIds).size).toBe(EXPECTED_PACK_IDS.length)
  })

  it("assigns every stable animal to exactly one source pack", () => {
    const documentedAnimalIds = ZOO_ANIMALS.map(({ id }) => id).sort()
    const sourceAnimalIds = SEETHING_SWARM_SOURCE_PACKS.flatMap(
      ({ animalIds }) => animalIds,
    ).sort()

    expect(sourceAnimalIds).toHaveLength(
      SEETHING_SWARM_SOURCE_SNAPSHOT.stableAnimalCount,
    )
    expect(new Set(sourceAnimalIds).size).toBe(sourceAnimalIds.length)
    expect(sourceAnimalIds).toEqual(documentedAnimalIds)
  })

  it("uses only official storefront URLs and safe unique source directories", () => {
    const sourceDirectories = SEETHING_SWARM_SOURCE_PACKS.map(
      ({ sourceDirectory }) => sourceDirectory,
    )

    expect(new Set(sourceDirectories).size).toBe(sourceDirectories.length)

    for (const sourcePack of SEETHING_SWARM_SOURCE_PACKS) {
      const storefrontUrl = new URL(sourcePack.storefrontUrl)

      expect(storefrontUrl.origin).toBe("https://seethingswarm.itch.io")
      expect(storefrontUrl.pathname).toBe(`/${sourcePack.packId}`)
      expect(sourcePack.storefrontTitle.trim()).not.toBe("")
      expect(sourcePack.sourceDirectory).toMatch(
        /^[a-z0-9]+(?:_[a-z0-9]+)*_spritesheets$/,
      )
      expect(sourcePack.sourceSnapshotId).toBe(
        SEETHING_SWARM_SOURCE_SNAPSHOT.sourceSnapshotId,
      )
    }
  })

  it("uses unique safe evidence paths and uppercase SHA-256 values", () => {
    const evidencePaths = SEETHING_SWARM_SOURCE_SNAPSHOT.evidenceFiles.map(
      ({ relativePath }) => relativePath,
    )

    expect(new Set(evidencePaths).size).toBe(evidencePaths.length)

    for (const evidenceFile of SEETHING_SWARM_SOURCE_SNAPSHOT.evidenceFiles) {
      expect(evidenceFile.relativePath).not.toMatch(/[\\/]/)
      expect(evidenceFile.relativePath).not.toBe(".")
      expect(evidenceFile.relativePath).not.toBe("..")
      expect(evidenceFile.sha256).toMatch(/^[A-F0-9]{64}$/)
    }
  })

  it("deeply freezes the public provenance ledger", () => {
    expect(Object.isFrozen(SEETHING_SWARM_SOURCE_SNAPSHOT)).toBe(true)
    expect(Object.isFrozen(SEETHING_SWARM_SOURCE_SNAPSHOT.evidenceFiles)).toBe(
      true,
    )
    expect(
      SEETHING_SWARM_SOURCE_SNAPSHOT.evidenceFiles.every(Object.isFrozen),
    ).toBe(true)
    expect(Object.isFrozen(SEETHING_SWARM_SOURCE_PACKS)).toBe(true)
    expect(SEETHING_SWARM_SOURCE_PACKS.every(Object.isFrozen)).toBe(true)
    expect(
      SEETHING_SWARM_SOURCE_PACKS.every(({ animalIds }) =>
        Object.isFrozen(animalIds),
      ),
    ).toBe(true)
  })
})
