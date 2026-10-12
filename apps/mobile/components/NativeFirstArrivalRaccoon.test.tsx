import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native"
import NativeFirstArrivalRaccoon from "@/components/NativeFirstArrivalRaccoon"

jest.mock("@/generated/seethingswarm/SeethingSwarmRuntimeClipCatalog", () => ({
  SEETHING_SWARM_NATIVE_RUNTIME_CLIP_CATALOG: {
    mode: "licensed",
    evidenceSnapshotId: "first-arrival-test",
    characterClipCount: 1,
    auxiliaryEffectClipCount: 0,
    animals: [
      {
        animalId: "raccoonpack",
        characterClips: [
          {
            kind: "character",
            animalId: "raccoonpack",
            animationId: "run",
            relativePath: "raccoonpack/run.png",
            frameWidth: 4,
            frameHeight: 4,
            frameCount: 8,
            visibleBounds: { left: 1, top: 1, width: 2, height: 2 },
            asset: 1,
          },
        ],
        auxiliaryEffectClips: [],
        referencePose: {
          animationId: "idle",
          frameIndex: 0,
          bounds: { left: 1, top: 1, width: 2, height: 2 },
          anchor: { x: 2, y: 3 },
        },
      },
    ],
  } satisfies SeethingSwarmRuntimeClipCatalog<number>,
}))

beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(async () => {
  await cleanup()
  jest.useRealTimers()
})

const image = () =>
  screen.getByTestId("seething-swarm-animal-raccoonpack-image", {
    includeHiddenElements: true,
  })

describe("native first-arrival crossing", () => {
  it("waits for decoded art, plays one delayed crossing, and signals completion", async () => {
    const complete = jest.fn()
    await render(<NativeFirstArrivalRaccoon onComplete={complete} />)
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    expect(complete).not.toHaveBeenCalled()
    await fireEvent(image(), "load")
    await act(async () => {
      jest.advanceTimersByTime(900)
    })
    expect(complete).not.toHaveBeenCalled()
    await act(async () => {
      jest.advanceTimersByTime(3300)
    })
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it("finishes missing artwork gracefully and cancels an active crossing on exit", async () => {
    const complete = jest.fn()
    const { unmount } = await render(
      <NativeFirstArrivalRaccoon onComplete={complete} />,
    )
    await fireEvent(image(), "error")
    expect(complete).toHaveBeenCalledTimes(1)
    await unmount()
    complete.mockClear()
    const active = await render(
      <NativeFirstArrivalRaccoon onComplete={complete} />,
    )
    await fireEvent(image(), "load")
    await act(async () => {
      jest.advanceTimersByTime(1200)
    })
    await active.unmount()
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    expect(complete).not.toHaveBeenCalled()
  })
})
