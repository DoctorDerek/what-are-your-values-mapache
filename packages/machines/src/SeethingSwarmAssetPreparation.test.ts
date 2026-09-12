import { createActiveDeck } from "@game/data/src/ActiveDeck"
import type {
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createSeethingSwarmTypographyOnlyRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
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

  it("prepares roster animals before the first battle and beyond the Top Five", () => {
    const deck = createActiveDeck([])
    const ranking = rankValues(deck, createInitialValueProgress(deck))
    const catalog = {
      mode: "licensed",
      evidenceSnapshotId: "hub-preparation-test",
      animals: ZOO_ANIMALS.map(({ id }) => ({
        animalId: id,
        characterClips: [
          { ...clip, animalId: id, relativePath: `${id}/idle.png` },
        ],
        auxiliaryEffectClips: [],
      })),
      characterClipCount: ZOO_ANIMALS.length,
      auxiliaryEffectClipCount: 0,
    } satisfies SeethingSwarmRuntimeClipCatalog<number>
    const prepared = getHubPreparationClips(ranking, catalog)
    expect(prepared).toHaveLength(ranking.length)
    expect(
      new Set(prepared.map(({ animalId }) => animalId)).size,
    ).toBeGreaterThan(5)
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
