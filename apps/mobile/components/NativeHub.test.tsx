import { createActiveDeck } from "@game/data/src/ActiveDeck"
import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import {
  createSeethingSwarmTypographyOnlyRuntimeClipCatalog,
  type SeethingSwarmRuntimeCharacterClip,
  type SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  createCustomValueId,
  getValueDisplayName,
  type CustomValueDefinition,
  type ValueId,
} from "@game/data/src/Value"
import { resolveValueAnimalId } from "@game/data/src/ValueAnimalAssociation"
import {
  createInitialValueProgress,
  createValueProgress,
} from "@game/data/src/ValueProgress"
import { rankValues } from "@game/data/src/ValueRanking"
import { VALUE_TO_ANIMAL_MAP } from "@game/data/src/ValueToAnimalMap"
import { ZOO_ANIMALS } from "@game/data/src/ZooAnimals"
import { describe, expect, it, jest } from "@jest/globals"
import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native"
import NativeHub from "@/components/NativeHub"
import NativeSeethingSwarmAnimal from "@/components/NativeSeethingSwarmAnimal"

jest.mock("@/components/NativeHeroes99Hero", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/NativeSeethingSwarmAnimal", () => {
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native")
  return {
    __esModule: true,
    default: jest.fn(
      ({
        clip,
      }: {
        clip: SeethingSwarmRuntimeCharacterClip<number>
        shouldReduceMotion: boolean
      }) => (
        <View
          testID={`mock-seething-swarm-animal-${clip.animalId.replaceAll("/", "-")}`}
        />
      ),
    ),
  }
})

const activeDeck = createActiveDeck([])
const nativeAnimalRendererMock = jest.mocked(NativeSeethingSwarmAnimal)
const animalPresentationProps = Object.freeze({
  runtimeClipCatalog: createSeethingSwarmTypographyOnlyRuntimeClipCatalog(),
  shouldReduceMotion: false,
})
const licensedRuntimeClipCatalog = Object.freeze({
  mode: "licensed",
  evidenceSnapshotId: "seethingswarm-animals:hub-integration-test",
  animals: Object.freeze(
    ZOO_ANIMALS.map(({ id }, index) =>
      Object.freeze({
        animalId: id,
        characterClips: Object.freeze([
          Object.freeze({
            kind: "character",
            animalId: id,
            animationId: "idle",
            relativePath: `${id}/idle.png`,
            frameWidth: 1,
            frameHeight: 1,
            frameCount: 1,
            visibleBounds: Object.freeze({
              left: 0,
              top: 0,
              width: 1,
              height: 1,
            }),
            asset: index + 1,
          }),
        ]),
        auxiliaryEffectClips: Object.freeze([]),
        referencePose: Object.freeze({
          animationId: "idle",
          frameIndex: 0,
          bounds: Object.freeze({ left: 0, top: 0, width: 1, height: 1 }),
          anchor: Object.freeze({ x: 0.5, y: 1 }),
        }),
      }),
    ),
  ),
  characterClipCount: ZOO_ANIMALS.length,
  auxiliaryEffectClipCount: 0,
}) satisfies SeethingSwarmRuntimeClipCatalog<number>

function getMappedAnimalId(valueId: ValueId) {
  const mapping = VALUE_TO_ANIMAL_MAP.find(
    ({ valueId: mappedValueId }) => mappedValueId === valueId,
  )
  if (!mapping) throw new Error(`Missing test animal mapping for ${valueId}`)
  return mapping.animalId
}

function createUnplayedRankedValues() {
  return rankValues(activeDeck, createInitialValueProgress(activeDeck))
}

function createRankedValuesWithEvidence() {
  const progressById = new Map(createInitialValueProgress(activeDeck))
  const firstValueId = activeDeck.valueIds[0]

  progressById.set(
    firstValueId,
    createValueProgress(firstValueId, {
      totalXp: 4,
      profileWins: 1,
      profileComparisons: 1,
      currentCycleWins: 1,
    }),
  )

  return rankValues(activeDeck, progressById)
}

function createCustomRankedValues() {
  const customValue = Object.freeze({
    kind: "custom",
    id: createCustomValueId("custom:00000000-0000-4000-8000-000000000777"),
    name: "🧠 Curiosity",
    definition: "Keep asking why and how.",
    creationOrdinal: 1,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  }) satisfies CustomValueDefinition
  const customActiveDeck = createActiveDeck([customValue])
  const progressById = new Map(createInitialValueProgress(customActiveDeck))
  progressById.set(
    customValue.id,
    createValueProgress(customValue.id, {
      totalXp: 100,
      profileWins: 1,
      profileComparisons: 1,
      currentCycleWins: 1,
    }),
  )
  return Object.freeze({
    customValue,
    rankedValues: rankValues(customActiveDeck, progressById),
  })
}

function createHubCallbacks() {
  return {
    appearance: DEFAULT_HEROES99_APPEARANCE,
    onCustomize: jest.fn(),
    onAddCustomValue: jest.fn(),
    onBrowseAllValues: jest.fn(),
    onOpenAchievements: jest.fn(),
    onOpenDataManagement: jest.fn(),
    onOpenMenu: jest.fn(),
    onStartBattle: jest.fn(),
  }
}

describe("NativeHub", () => {
  it("admits attention after a completed press while retaining decoded calm art", async () => {
    const rankedValues = createRankedValuesWithEvidence()
    const catalog = {
      ...licensedRuntimeClipCatalog,
      animals: licensedRuntimeClipCatalog.animals.map((animal) => ({
        ...animal,
        characterClips: ["idle", "crouch", "jump", "fall", "land"].map(
          (animationId, index) => ({
            ...animal.characterClips[0],
            animationId,
            relativePath: `${animal.animalId}/${animationId}.png`,
            asset: animal.characterClips[0].asset * 10 + index,
          }),
        ),
      })),
      characterClipCount: licensedRuntimeClipCatalog.characterClipCount * 5,
    } satisfies SeethingSwarmRuntimeClipCatalog<number>
    await render(
      <NativeHub
        {...createHubCallbacks()}
        rankedValues={rankedValues}
        runtimeClipCatalog={catalog}
        dataNotice={null}
        shouldReduceMotion={false}
      />,
    )
    const animalId = resolveValueAnimalId(rankedValues[0].definition.id)
    const row = screen.getByTestId(
      `hub-animal-${rankedValues[0].definition.id}`,
      { includeHiddenElements: true },
    )
    await act(async () => {
      for (const [props] of nativeAnimalRendererMock.mock.calls)
        props.onReady?.()
    })
    await fireEvent(row, "pressIn")
    expect(
      nativeAnimalRendererMock.mock.calls
        .filter(([props]) => props.clip.animalId === animalId)
        .at(-1)?.[0].playbackIdentity,
    ).toContain(":false")
    await fireEvent(row, "pressOut")
    await fireEvent.press(row)
    const attended = nativeAnimalRendererMock.mock.calls
      .filter(
        ([props]) =>
          props.clip.animalId === animalId &&
          props.clip.animationId === "crouch",
      )
      .at(-1)?.[0]
    expect(attended?.playbackMode).toBe("one-shot")
    expect(attended?.frameDurationMs).toBe(100)
    await act(async () => attended?.onPlaybackComplete?.())
    const calm = nativeAnimalRendererMock.mock.calls
      .filter(
        ([props]) =>
          props.clip.animalId === animalId && props.clip.animationId === "idle",
      )
      .at(-1)?.[0]
    expect(calm?.playbackMode).toBe("loop")
    expect(calm?.frameDurationMs).toBe(160)
  })

  it("previews five unranked values and exposes the explicit actions", async () => {
    const callbacks = createHubCallbacks()
    const user = userEvent.setup()
    await render(
      <NativeHub
        {...callbacks}
        {...animalPresentationProps}
        dataNotice={null}
        rankedValues={createUnplayedRankedValues()}
      />,
    )
    expect(screen.getByText("My Values")).toBeOnTheScreen()
    expect(screen.getByText(/Not ranked yet/)).toBeOnTheScreen()
    expect(screen.queryByText("#1")).toBeNull()
    for (const name of ["Acceptance", "Accuracy", "Achievement"])
      expect(screen.getByText(name)).toBeOnTheScreen()
    for (const [label, callback] of [
      ["Browse All Values", callbacks.onBrowseAllValues],
      ["Add Custom Value", callbacks.onAddCustomValue],
      ["Menu", callbacks.onOpenMenu],
      ["Customize my card", callbacks.onCustomize],
      ["Battle", callbacks.onStartBattle],
    ] as const) {
      await user.press(screen.getByRole("button", { name: label }))
      expect(callback).toHaveBeenCalledTimes(1)
    }
    expect(screen.queryByRole("button", { name: /Share/ })).toBeNull()
  })

  it("shows the earned five values and backup feedback", async () => {
    const rankedValues = createRankedValuesWithEvidence()
    await render(
      <NativeHub
        {...createHubCallbacks()}
        {...animalPresentationProps}
        dataNotice="Your imported data is ready."
        rankedValues={rankedValues}
      />,
    )
    expect(screen.getByText("My Top Five Values")).toBeOnTheScreen()
    expect(screen.getByText("Your imported data is ready.")).toBeOnTheScreen()
    expect(screen.getByText("#1")).toBeOnTheScreen()
    expect(screen.queryByText("#6")).toBeNull()
    expect(
      screen.queryByText(getValueDisplayName(rankedValues[5].definition)),
    ).toBeNull()
  })

  it("retains readable values when animal delivery fails and respects Reduced Motion", async () => {
    const rankedValues = createRankedValuesWithEvidence()
    await render(
      <NativeHub
        {...createHubCallbacks()}
        runtimeClipCatalog={licensedRuntimeClipCatalog}
        dataNotice={null}
        rankedValues={rankedValues}
        shouldReduceMotion
      />,
    )
    expect(
      Array.from(
        new Set(
          nativeAnimalRendererMock.mock.calls.map(
            ([{ clip }]) => clip.animalId,
          ),
        ),
      ),
    ).toEqual(
      rankedValues
        .slice(0, 5)
        .map(({ definition }) => getMappedAnimalId(definition.id)),
    )
    expect(
      nativeAnimalRendererMock.mock.calls.every(
        ([props]) => props.shouldReduceMotion,
      ),
    ).toBe(true)
    await act(async () =>
      nativeAnimalRendererMock.mock.calls[0][0].onLoadError?.(),
    )
    expect(screen.getByText("#1")).toBeOnTheScreen()
    expect(
      screen.getByText(getValueDisplayName(rankedValues[0].definition)),
    ).toBeOnTheScreen()
  })

  it("uses the battle-assigned Custom Value animal without incidental navigation", async () => {
    const callbacks = createHubCallbacks()
    const { rankedValues, customValue } = createCustomRankedValues()
    await render(
      <NativeHub
        {...callbacks}
        runtimeClipCatalog={licensedRuntimeClipCatalog}
        dataNotice={null}
        rankedValues={rankedValues}
        shouldReduceMotion={false}
      />,
    )
    expect(screen.getByText("🧠 Curiosity")).toBeOnTheScreen()
    expect(
      nativeAnimalRendererMock.mock.calls.some(
        ([{ clip }]) => clip.animalId === resolveValueAnimalId(customValue.id),
      ),
    ).toBe(true)
    await fireEvent.press(
      screen.getByTestId(`hub-animal-${customValue.id}`, {
        includeHiddenElements: true,
      }),
    )
    expect(callbacks.onBrowseAllValues).not.toHaveBeenCalled()
  })
})
