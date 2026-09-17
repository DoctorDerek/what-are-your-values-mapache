import { describe, expect, it } from "vitest"
import { CANONICAL_VALUES } from "./CanonicalValues"
import {
  createSeethingSwarmAnimalPresentationGeometry,
  createSeethingSwarmStageGeometry,
  resolveValueAnimalPresentation,
  SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS,
  SEETHING_SWARM_BATTLE_FRAME_DURATION_MS,
  SEETHING_SWARM_CALM_FRAME_DURATION_MS,
  SEETHING_SWARM_HUB_ANIMATION_CANDIDATES,
  SEETHING_SWARM_HUB_TILE_SIZE,
} from "./SeethingSwarmAnimalPresentation"
import {
  createSeethingSwarmTypographyOnlyRuntimeClipCatalog,
  type SeethingSwarmLicensedRuntimeClipCatalog,
  type SeethingSwarmRuntimeAnimalClips,
} from "./SeethingSwarmRuntimeClipCatalog"
import { createCompleteSeethingSwarmRuntimeClipTestFixture } from "./SeethingSwarmRuntimeClipCatalog.test-fixture"
import { createCanonicalValueId, createCustomValueId } from "./Value"
import { ZOO_ANIMALS } from "./ZooAnimals"

const customValue = Object.freeze({
  kind: "custom",
  id: createCustomValueId("custom:00000000-0000-4000-8000-000000000001"),
  name: "👩🏽‍🔬 Ingenuity",
  definition: "to solve unfamiliar problems inventively",
  creationOrdinal: 1,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
})

function replaceAnimal(
  catalog: SeethingSwarmLicensedRuntimeClipCatalog<string>,
  animalIndex: number,
  replacement: SeethingSwarmRuntimeAnimalClips<string>,
) {
  return Object.freeze({
    ...catalog,
    animals: Object.freeze(
      catalog.animals.map((animal, index) =>
        index === animalIndex ? replacement : animal,
      ),
    ),
  })
}

function isCalmAnimation(animationId: string) {
  return SEETHING_SWARM_HUB_ANIMATION_CANDIDATES.some(
    (candidate) => candidate === animationId,
  )
}

describe("SeethingSwarm animal presentation", () => {
  it("preserves 3x source pixels and the rest anchor across complete motion bounds", () => {
    const { catalog } = createCompleteSeethingSwarmRuntimeClipTestFixture()
    const animal = catalog.animals[0]
    const original = animal.characterClips[0]
    const clips = [
      {
        ...original,
        frameWidth: 64,
        frameHeight: 64,
        visibleBounds: { left: 2, top: 3, width: 48, height: 20 },
      },
      {
        ...original,
        frameWidth: 64,
        frameHeight: 64,
        visibleBounds: { left: 4, top: 1, width: 24, height: 50 },
      },
    ]
    const geometry = createSeethingSwarmAnimalPresentationGeometry(
      animal.referencePose,
      clips,
    )
    expect(geometry).toMatchObject({
      integerScale: 3,
      width: 144,
      height: 150,
      frameOffsetX: -6,
      frameOffsetY: -3,
    })
    expect(geometry.anchorX).toBe((animal.referencePose.anchor.x - 2) * 3)
    expect(geometry.anchorY).toBe((animal.referencePose.anchor.y - 1) * 3)
    expect(
      createSeethingSwarmAnimalPresentationGeometry(
        animal.referencePose,
        [...clips].reverse(),
      ),
    ).toEqual(geometry)
    for (const clip of clips) {
      expect(
        clip.visibleBounds.left * 3 + geometry.frameOffsetX,
      ).toBeGreaterThanOrEqual(0)
      expect(
        (clip.visibleBounds.left + clip.visibleBounds.width) * 3 +
          geometry.frameOffsetX,
      ).toBeLessThanOrEqual(geometry.width)
      expect(
        clip.visibleBounds.top * 3 + geometry.frameOffsetY,
      ).toBeGreaterThanOrEqual(0)
      expect(
        (clip.visibleBounds.top + clip.visibleBounds.height) * 3 +
          geometry.frameOffsetY,
      ).toBeLessThanOrEqual(geometry.height)
    }
    expect(Object.isFrozen(geometry)).toBe(true)
    expect(Object.isFrozen(geometry.visibleBounds)).toBe(true)
  })
  it("reserves a common ground line with clearance below flying reference poses", () => {
    const { catalog } = createCompleteSeethingSwarmRuntimeClipTestFixture()
    const animal = catalog.animals[0]
    const geometry = createSeethingSwarmAnimalPresentationGeometry(
      animal.referencePose,
      animal.characterClips,
    )
    expect(
      createSeethingSwarmStageGeometry([
        { ...geometry, width: 144, height: 90, anchorY: 60 },
        { ...geometry, width: 96, height: 100, anchorY: 95 },
      ]),
    ).toEqual({ width: 144, height: 142, belowAnchor: 30 })
    expect(createSeethingSwarmStageGeometry([null, null])).toEqual({
      width: 112,
      height: 112,
      belowAnchor: 0,
    })
  })
  it("rejects empty clearance and invalid source bounds without fitting valid large art", () => {
    const { catalog } = createCompleteSeethingSwarmRuntimeClipTestFixture()
    const animal = catalog.animals[0]
    expect(() =>
      createSeethingSwarmAnimalPresentationGeometry(animal.referencePose, []),
    ).toThrow("clip count")
    expect(() =>
      createSeethingSwarmAnimalPresentationGeometry(animal.referencePose, [
        {
          ...animal.characterClips[0],
          visibleBounds: { left: -1, top: 0, width: 1, height: 1 },
        },
      ]),
    ).toThrow("left edge")
    const large = {
      ...animal.characterClips[0],
      frameWidth: 80,
      frameHeight: 80,
      visibleBounds: { left: 0, top: 0, width: 80, height: 80 },
    }
    expect(
      createSeethingSwarmAnimalPresentationGeometry(animal.referencePose, [
        large,
      ]),
    ).toMatchObject({ integerScale: 3, width: 240, height: 240 })
  })
  it("retains calm animation and semantic timing policies", () => {
    expect(SEETHING_SWARM_HUB_ANIMATION_CANDIDATES).toEqual([
      "idle",
      "idle_upright",
    ])
    expect(Object.isFrozen(SEETHING_SWARM_HUB_ANIMATION_CANDIDATES)).toBe(true)
    expect(SEETHING_SWARM_HUB_TILE_SIZE).toBe(72)
    expect(SEETHING_SWARM_CALM_FRAME_DURATION_MS).toBe(160)
    expect(SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS).toBe(100)
    expect(SEETHING_SWARM_BATTLE_FRAME_DURATION_MS).toBe(100)
  })

  it("resolves all 100 canonical values through calm catalog clips", () => {
    const { catalog } = createCompleteSeethingSwarmRuntimeClipTestFixture()
    const resolutions = CANONICAL_VALUES.map((value) =>
      resolveValueAnimalPresentation(value, catalog),
    )

    expect(resolutions).toHaveLength(100)
    expect(resolutions.every(({ kind }) => kind === "animal")).toBe(true)
    expect(
      new Set(
        resolutions.flatMap((resolution) =>
          resolution.kind === "animal" ? [resolution.clip.animalId] : [],
        ),
      ),
    ).toEqual(new Set(ZOO_ANIMALS.map(({ id }) => id)))
    expect(
      resolutions.every(
        (resolution) =>
          resolution.kind === "animal" &&
          isCalmAnimation(resolution.clip.animationId),
      ),
    ).toBe(true)
    expect(resolutions.every(Object.isFrozen)).toBe(true)
  })

  it("prefers idle over idle upright regardless of catalog clip order", () => {
    const { catalog } = createCompleteSeethingSwarmRuntimeClipTestFixture()
    const bat = catalog.animals[0]!
    const idleUpright = bat.characterClips.find(
      ({ animationId }) => animationId === "idle_upright",
    )!
    const catalogWithBothCalmClips = replaceAnimal(
      catalog,
      0,
      Object.freeze({
        ...bat,
        characterClips: Object.freeze([
          idleUpright,
          Object.freeze({ ...idleUpright, animationId: "idle" }),
        ]),
      }),
    )
    const mappedBatValue = CANONICAL_VALUES.find((value) => {
      const presentation = resolveValueAnimalPresentation(value, catalog)
      return (
        presentation.kind === "animal" && presentation.clip.animalId === "bat"
      )
    })!

    expect(
      resolveValueAnimalPresentation(mappedBatValue, catalogWithBothCalmClips),
    ).toMatchObject({ kind: "animal", clip: { animationId: "idle" } })
  })

  it("uses one authored grapheme for Custom Values without animal inference", () => {
    const { catalog } = createCompleteSeethingSwarmRuntimeClipTestFixture()

    expect(resolveValueAnimalPresentation(customValue, catalog)).toEqual({
      kind: "custom-initial",
      initial: "👩🏽‍🔬",
    })
    expect(() =>
      resolveValueAnimalPresentation({ ...customValue, name: "   " }, catalog),
    ).toThrow("Custom Value name must contain one grapheme")
  })

  it("preserves one frozen metadata-free result in typography-only mode", () => {
    const catalog = createSeethingSwarmTypographyOnlyRuntimeClipCatalog()
    const canonicalResolution = resolveValueAnimalPresentation(
      CANONICAL_VALUES[0]!,
      catalog,
    )
    const customResolution = resolveValueAnimalPresentation(
      customValue,
      catalog,
    )

    expect(canonicalResolution).toBe(customResolution)
    expect(canonicalResolution).toEqual({ kind: "typography-only" })
    expect(Object.isFrozen(canonicalResolution)).toBe(true)
  })

  it("rejects missing canonical mappings animals and calm clips", () => {
    const { catalog } = createCompleteSeethingSwarmRuntimeClipTestFixture()
    expect(() =>
      resolveValueAnimalPresentation(
        {
          kind: "canonical",
          id: createCanonicalValueId("pvcs-2011:invented"),
          sourceOrdinal: 101,
          englishName: "Invented",
          sourceDefinition: "not canonical",
        },
        catalog,
      ),
    ).toThrow("Missing animal mapping for canonical value")

    const mappedPresentation = resolveValueAnimalPresentation(
      CANONICAL_VALUES[0]!,
      catalog,
    )
    if (mappedPresentation.kind !== "animal") {
      throw new Error("Expected licensed canonical animal presentation")
    }
    const mappedAnimalIndex = catalog.animals.findIndex(
      ({ animalId }) => animalId === mappedPresentation.clip.animalId,
    )
    const mappedAnimal = catalog.animals[mappedAnimalIndex]!
    expect(() =>
      resolveValueAnimalPresentation(CANONICAL_VALUES[0]!, {
        ...catalog,
        animals: catalog.animals.filter(
          ({ animalId }) => animalId !== mappedAnimal.animalId,
        ),
      }),
    ).toThrow("Missing animal presentation for animal")
    expect(() =>
      resolveValueAnimalPresentation(
        CANONICAL_VALUES[0]!,
        replaceAnimal(
          catalog,
          mappedAnimalIndex,
          Object.freeze({
            ...mappedAnimal,
            characterClips: Object.freeze(
              mappedAnimal.characterClips.filter(
                ({ animationId }) => !isCalmAnimation(animationId),
              ),
            ),
          }),
        ),
      ),
    ).toThrow("Missing calm SeethingSwarm Hub animation")
  })
})
