import { createActiveDeck } from "@game/data/src/ActiveDeck"
import {
  createSeethingSwarmTypographyOnlyRuntimeClipCatalog,
  type SeethingSwarmLicensedRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createCanonicalValueId } from "@game/data/src/Value"
import { createSchedulerRestorePoint } from "@game/machines/src/PairScheduler"
import { describe, expect, it } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react-native"
import { Text } from "react-native"
import NativeSeethingSwarmAssetPreparation, {
  useNativeSeethingSwarmAssetStatus,
  useNativeSeethingSwarmPreparedAssets,
  usePreparedNativeSeethingSwarmBattle,
} from "@/components/NativeSeethingSwarmAssetPreparation"

const battle = {
  pair: [
    createCanonicalValueId("pvcs-2011:mastery"),
    createCanonicalValueId("pvcs-2011:courage"),
  ] as const,
  scheduler: createSchedulerRestorePoint({
    activeDeck: createActiveDeck([]),
    progressGeneration: 0,
    deckRevision: 0,
    seed: "native-preparation",
    cycleIndex: 0,
    cursor: 0,
  }),
}
const catalog = {
  mode: "licensed",
  evidenceSnapshotId: "native-preparation",
  animals: (["raccoonpack", "wolfpack"] as const).map((animalId, index) => ({
    animalId,
    characterClips: [
      {
        kind: "character" as const,
        animalId,
        animationId: "idle",
        relativePath: `${animalId}/idle.png`,
        frameWidth: 32,
        frameHeight: 32,
        frameCount: 4,
        visibleBounds: { left: 0, top: 0, width: 32, height: 32 },
        asset: index + 1,
      },
    ],
    auxiliaryEffectClips: [],
  })),
  characterClipCount: 2,
  auxiliaryEffectClipCount: 0,
} satisfies SeethingSwarmLicensedRuntimeClipCatalog<number>

function PreparationStatus({ hasArt = true }: { hasArt?: boolean }) {
  const ready = usePreparedNativeSeethingSwarmBattle(
    battle,
    hasArt ? catalog : originalCatalog,
  )
  const status = useNativeSeethingSwarmAssetStatus("raccoonpack/idle.png")
  const assets = useNativeSeethingSwarmPreparedAssets()
  return (
    <Text>{`${ready ? "Ready" : "Pending"}: ${status ?? "absent"}, ${assets?.size ?? 0}`}</Text>
  )
}
const originalCatalog = createSeethingSwarmTypographyOnlyRuntimeClipCatalog()

describe("native animal preparation", () => {
  it("prepares bundled images before presentation, waits for both load events, and releases unused resources", async () => {
    const result = await render(
      <NativeSeethingSwarmAssetPreparation>
        <PreparationStatus />
      </NativeSeethingSwarmAssetPreparation>,
    )
    expect(screen.getByText("Pending: pending, 2")).toBeOnTheScreen()
    const images = screen.getAllByTestId(/^prepared-animal-/, {
      includeHiddenElements: true,
    })
    await fireEvent(images[0], "load")
    expect(screen.getByText("Pending: ready, 2")).toBeOnTheScreen()
    await fireEvent(images[1], "load")
    expect(screen.getByText("Ready: ready, 2")).toBeOnTheScreen()
    await result.rerender(
      <NativeSeethingSwarmAssetPreparation>
        <PreparationStatus hasArt={false} />
      </NativeSeethingSwarmAssetPreparation>,
    )
    expect(screen.getByText("Ready: absent, 0")).toBeOnTheScreen()
    expect(
      screen.queryAllByTestId(/^prepared-animal-/, {
        includeHiddenElements: true,
      }),
    ).toHaveLength(0)
  })

  it("settles load failures and leaves public-clone presentation immediately ready", async () => {
    await render(
      <NativeSeethingSwarmAssetPreparation>
        <PreparationStatus />
      </NativeSeethingSwarmAssetPreparation>,
    )
    for (const image of screen.getAllByTestId(/^prepared-animal-/, {
      includeHiddenElements: true,
    }))
      await fireEvent(image, "error")
    expect(screen.getByText("Ready: failed, 2")).toBeOnTheScreen()
  })
})
