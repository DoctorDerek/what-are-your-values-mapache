import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { projectHubValues } from "@game/data/src/HubValueProjection"
import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type {
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  createCustomValueId,
  type CustomValueDefinition,
} from "@game/data/src/Value"
import { resolveValueAnimalId } from "@game/data/src/ValueAnimalAssociation"
import { createInitialValueProgress } from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import { ZOO_ANIMALS } from "@game/data/src/ZooAnimals"
import { describe, expect, it } from "vitest"
import { createActor } from "xstate"
import {
  createSeethingSwarmAssetPreparationMachine,
  getHubPreparationClips,
} from "./SeethingSwarmAssetPreparation"

const clip = Object.freeze({
  kind: "character",
  animalId: "raccoonpack",
  animationId: "idle",
  relativePath: "raccoon/idle.png",
  frameWidth: 32,
  frameHeight: 32,
  frameCount: 4,
  visibleBounds: { left: 0, top: 0, width: 32, height: 32 },
  asset: 1,
}) satisfies SeethingSwarmRuntimeCharacterClip<number>

describe("scoped animal preparation", () => {
  it("deduplicates active consumers and retains decoded assets across a scope update", () => {
    const actor = createActor(
      createSeethingSwarmAssetPreparationMachine<number>(),
    ).start()
    actor.send({ type: "ASSETS.REQUESTED", scope: "hub", clips: [clip, clip] })
    actor.send({
      type: "ASSET.SETTLED",
      path: clip.relativePath,
      generation: 0,
      status: "ready",
    })
    actor.send({ type: "ASSETS.REQUESTED", scope: "battle", clips: [clip] })
    actor.send({ type: "ASSETS.REQUESTED", scope: "hub", clips: [clip] })
    expect(actor.getSnapshot().context.assets.size).toBe(1)
    expect(
      actor.getSnapshot().context.assets.get(clip.relativePath)?.status,
    ).toBe("ready")
    actor.send({ type: "ASSETS.RELEASED", scope: "hub" })
    expect(actor.getSnapshot().context.assets.size).toBe(1)
    actor.send({ type: "ASSETS.RELEASED", scope: "battle" })
    expect(actor.getSnapshot().context.assets.size).toBe(0)
    actor.stop()
  })

  it("ignores stale completion after release or replacement and settles real failures", () => {
    const actor = createActor(
      createSeethingSwarmAssetPreparationMachine<number>(),
    ).start()
    actor.send({ type: "ASSETS.REQUESTED", scope: "battle", clips: [clip] })
    actor.send({ type: "ASSETS.RELEASED", scope: "battle" })
    actor.send({
      type: "ASSET.SETTLED",
      path: clip.relativePath,
      generation: 0,
      status: "ready",
    })
    expect(actor.getSnapshot().context.assets.size).toBe(0)
    actor.send({
      type: "ASSETS.REQUESTED",
      scope: "battle",
      clips: [{ ...clip, asset: 2 }],
    })
    actor.send({
      type: "ASSET.SETTLED",
      path: clip.relativePath,
      generation: 0,
      status: "ready",
    })
    expect(
      actor.getSnapshot().context.assets.get(clip.relativePath)?.status,
    ).toBe("pending")
    actor.send({
      type: "ASSET.SETTLED",
      path: clip.relativePath,
      generation: 1,
      status: "failed",
    })
    actor.send({
      type: "ASSET.SETTLED",
      path: clip.relativePath,
      generation: 1,
      status: "failed",
    })
    expect(
      actor.getSnapshot().context.assets.get(clip.relativePath)?.status,
    ).toBe("failed")
    actor.stop()
  })

  it("prepares only the first five Hub animals, including a ranked Custom Value", () => {
    const customValue = Object.freeze({
      kind: "custom",
      id: createCustomValueId("custom:00000000-0000-4000-8000-000000000001"),
      name: "Ingenuity",
      definition: "to solve unfamiliar problems inventively",
      creationOrdinal: 1,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    }) satisfies CustomValueDefinition
    const deck = createActiveDeck([customValue])
    const progress = new Map(createInitialValueProgress(deck))
    progress.set(customValue.id, {
      totalXp: 100,
      profileWins: 1,
      profileComparisons: 1,
      currentCycleWins: 1,
    })
    const ranking = rankValues(deck, progress)
    const catalog = {
      mode: "licensed",
      evidenceSnapshotId: "hub-preparation-test",
      animals: ZOO_ANIMALS.map(({ id }) => ({
        animalId: id,
        characterClips: [
          { ...clip, animalId: id, relativePath: `${id}/idle.png` },
        ],
        auxiliaryEffectClips: [],
        referencePose: Object.freeze({
          animationId: "idle",
          frameIndex: 0,
          bounds: Object.freeze({ left: 0, top: 0, width: 32, height: 32 }),
          anchor: Object.freeze({ x: 16, y: 32 }),
        }),
      })),
      characterClipCount: ZOO_ANIMALS.length,
      auxiliaryEffectClipCount: 0,
    } satisfies SeethingSwarmRuntimeClipCatalog<number>
    const prepared = getHubPreparationClips(ranking, catalog)
    const expectedAnimals = projectHubValues(ranking).topFive.flatMap(
      ({ definition }) => {
        const presentation = resolveValueAnimalPresentation(definition, catalog)
        return presentation.kind === "animal"
          ? [presentation.clip.animalId]
          : []
      },
    )
    expect(prepared).toHaveLength(expectedAnimals.length * 2)
    expect(new Set(prepared.map(({ animalId }) => animalId))).toEqual(
      new Set(expectedAnimals),
    )
    expect(projectHubValues(ranking).topFive[0]?.definition.id).toBe(
      customValue.id,
    )
    expect(
      prepared.some(
        ({ animalId }) => animalId === resolveValueAnimalId(customValue.id),
      ),
    ).toBe(true)
    expect(prepared.every(({ animationId }) => animationId === "idle")).toBe(
      true,
    )
  })

  it("does not invent assets for an empty typography-only catalog", () => {
    expect(
      getHubPreparationClips(
        [],
        createSeethingSwarmTypographyOnlyRuntimeClipCatalog(),
      ),
    ).toEqual([])
  })
})
