import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { EventType, useRive } from "@rive-app/react-canvas-lite"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { StaticImageData } from "next/image"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Splash from "@/components/Splash"

vi.mock("@rive-app/react-canvas-lite", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rive-app/react-canvas-lite")>()
  return {
    ...actual,
    useRive: vi.fn(() => ({
      RiveComponent: () => <canvas data-testid="rive-canvas" />,
    })),
  }
})

vi.mock("@/generated/seethingswarm/SeethingSwarmRuntimeClipCatalog", () => ({
  SEETHING_SWARM_WEB_RUNTIME_CLIP_CATALOG: {
    mode: "licensed",
    evidenceSnapshotId: "first-arrival-test",
    characterClipCount: 1,
    auxiliaryEffectClipCount: 0,
    animals: [{
      animalId: "raccoonpack",
      characterClips: [{
        kind: "character",
        animalId: "raccoonpack",
        animationId: "run",
        relativePath: "raccoonpack/run.png",
        frameWidth: 4,
        frameHeight: 4,
        frameCount: 8,
        visibleBounds: { left: 1, top: 1, width: 2, height: 2 },
        asset: { src: "/test-assets/raccoon-run.png", width: 32, height: 4 },
      }],
      auxiliaryEffectClips: [],
      referencePose: {
        animationId: "idle",
        frameIndex: 0,
        bounds: { left: 1, top: 1, width: 2, height: 2 },
        anchor: { x: 2, y: 3 },
      },
    }],
  } satisfies SeethingSwarmRuntimeClipCatalog<StaticImageData>,
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete")
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible")
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(false)
  vi.stubGlobal("requestIdleCallback", undefined)
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.mocked(useRive).mockClear()
})

async function revealOptionalArt() {
  await act(async () => vi.advanceTimersByTimeAsync(4100))
  await act(async () => vi.dynamicImportSettled())
  expect(screen.getByTestId("rive-canvas")).toBeInTheDocument()
  return vi.mocked(useRive).mock.lastCall![0]!
}

describe("first-arrival decoration lifecycle", () => {
  it("waits for actual Rive playback and decoded art, then completes only the runner's own crossing", async () => {
    render(<Splash onComplete={vi.fn()} onLocaleChange={vi.fn()} />)
    expect(screen.queryByTestId("arrival-ice-cream")).toBeNull()
    const runtime = await revealOptionalArt()
    expect(runtime).toMatchObject({
      src: FIRST_ARRIVAL_PRESENTATION.animationUrl,
      stateMachine: FIRST_ARRIVAL_PRESENTATION.stateMachineName,
      enableRiveAssetCDN: false,
      autoplay: true,
    })
    expect(screen.queryByTestId("arrival-raccoon")).toBeNull()
    act(() => runtime.onAdvance?.({ type: EventType.Advance }))
    const runner = screen.getByTestId("arrival-raccoon")
    const image = runner.querySelector("img")!
    expect(runner).toHaveClass("[animation-play-state:paused]")
    expect(image).toHaveAttribute("loading", "eager")
    await act(async () => fireEvent.load(image))
    expect(runner).not.toHaveClass("[animation-play-state:paused]")
    act(() => runtime.onAdvance?.({ type: EventType.Advance }))
    expect(screen.getByTestId("arrival-raccoon")).toBe(runner)
    act(() => runtime.onStop?.({ type: EventType.Stop }))
    expect(screen.queryByTestId("arrival-ice-cream")).toBeNull()
    expect(runner).toBeInTheDocument()
    fireEvent.animationEnd(image)
    expect(runner).toBeInTheDocument()
    fireEvent.animationEnd(runner)
    expect(screen.queryByTestId("arrival-raccoon")).toBeNull()
    await act(async () => vi.advanceTimersByTimeAsync(10000))
    expect(screen.queryByTestId("arrival-ice-cream")).toBeNull()
    expect(screen.getByRole("button", { name: "Start", exact: true })).toBeEnabled()
  })

  it.each(["runtime", "sprite"] as const)("contains a %s load failure without disabling Start", async (failure) => {
    const onComplete = vi.fn()
    render(<Splash onComplete={onComplete} onLocaleChange={vi.fn()} />)
    const runtime = await revealOptionalArt()
    if (failure === "runtime") {
      act(() => runtime.onLoadError?.({ type: EventType.LoadError }))
    } else {
      act(() => runtime.onAdvance?.({ type: EventType.Advance }))
      fireEvent.error(screen.getByTestId("arrival-raccoon").querySelector("img")!)
    }
    expect(screen.queryByTestId("arrival-ice-cream")).toBeNull()
    expect(screen.queryByTestId("arrival-raccoon")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Start", exact: true }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("cancels already revealed decoration when starting a profile", async () => {
    const props = { onComplete: vi.fn(), onLocaleChange: vi.fn() }
    const { rerender } = render(<Splash {...props} />)
    const runtime = await revealOptionalArt()
    act(() => runtime.onAdvance?.({ type: EventType.Advance }))
    expect(screen.getByTestId("arrival-raccoon")).toBeInTheDocument()
    rerender(<Splash {...props} isPending />)
    expect(screen.queryByTestId("arrival-raccoon")).toBeNull()
    expect(screen.queryByTestId("arrival-ice-cream")).toBeNull()
    expect(screen.getByRole("combobox", { name: "Language" })).toBeDisabled()
  })
})
