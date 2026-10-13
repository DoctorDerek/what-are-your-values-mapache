import { describe, expect, it } from "vitest"
import { resolveFirstArrivalRaccoon } from "./FirstArrivalPresentation"
import type { SeethingSwarmLicensedRuntimeClipCatalog } from "./SeethingSwarmRuntimeClipCatalog"

describe("first-arrival optional raccoon resolution", () => {
  it("omits the decoration in an asset-free build", () => {
    expect(resolveFirstArrivalRaccoon({ mode: "typography-only" })).toBeNull()
  })

  it("omits the decoration when the raccoon or its run is unavailable", () => {
    const catalog: SeethingSwarmLicensedRuntimeClipCatalog<number> = {
      mode: "licensed",
      evidenceSnapshotId: "incomplete-test-art",
      characterClipCount: 0,
      auxiliaryEffectClipCount: 0,
      animals: [],
    }
    expect(resolveFirstArrivalRaccoon(catalog)).toBeNull()
    expect(
      resolveFirstArrivalRaccoon({
        ...catalog,
        animals: [
          {
            animalId: "raccoonpack",
            characterClips: [],
            auxiliaryEffectClips: [],
            referencePose: {
              animationId: "idle",
              frameIndex: 0,
              bounds: { left: 0, top: 0, width: 4, height: 4 },
              anchor: { x: 2, y: 4 },
            },
          },
        ],
      }),
    ).toBeNull()
  })
})
