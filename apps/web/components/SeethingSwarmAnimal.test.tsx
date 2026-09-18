import { createSeethingSwarmAnimalPresentationGeometry } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeCharacterClip } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { StaticImageData } from "next/image"
import { afterEach, describe, expect, it, vi } from "vitest"
import SeethingSwarmAnimal from "@/components/SeethingSwarmAnimal"

const clip = Object.freeze({
  kind: "character",
  animalId: "bat",
  animationId: "idle_upright",
  relativePath: "bat_spritesheets/bat_idle_upright_strip4.png",
  frameWidth: 4,
  frameHeight: 4,
  frameCount: 4,
  visibleBounds: Object.freeze({ left: 1, top: 1, width: 2, height: 2 }),
  asset: Object.freeze({
    src: "/generated/seethingswarm/bat-idle.png",
    width: 16,
    height: 4,
  }),
}) satisfies SeethingSwarmRuntimeCharacterClip<StaticImageData>
const geometry = createSeethingSwarmAnimalPresentationGeometry(
  {
    animationId: "idle_upright",
    frameIndex: 0,
    bounds: clip.visibleBounds,
    anchor: { x: 2, y: 3 },
  },
  [clip],
)

afterEach(() => vi.restoreAllMocks())

describe("SeethingSwarmAnimal", () => {
  it("replays a resident strip on a new cue without replacing or reloading its image", async () => {
    const props = {
      clip,
      shouldReduceMotion: false,
      playbackMode: "one-shot" as const,
    }
    const { rerender } = render(
      <SeethingSwarmAnimal
        geometry={geometry}
        {...props}
        playbackIdentity="attention:0"
      />,
    )
    const image = screen.getByAltText("")
    const animation = { currentTime: 480, play: vi.fn() }
    Object.defineProperty(image, "getAnimations", { value: () => [animation] })
    fireEvent.load(image)
    await waitFor(() => expect(animation.currentTime).toBe(0))
    animation.currentTime = 480
    rerender(
      <SeethingSwarmAnimal
        geometry={geometry}
        {...props}
        playbackIdentity="attention:0"
      />,
    )
    expect(animation.currentTime).toBe(480)
    rerender(
      <SeethingSwarmAnimal
        geometry={geometry}
        {...props}
        playbackIdentity="strike:0"
      />,
    )
    expect(screen.getByAltText("")).toBe(image)
    expect(image.closest("[data-animal-id]")).toHaveAttribute(
      "data-playback-ready",
      "true",
    )
    expect(animation.currentTime).toBe(0)
    expect(animation.play).toHaveBeenCalledTimes(2)
  })
  it("recognizes a valid cached image before painting a loading state", () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      true,
    )
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      16,
    )
    const onReady = vi.fn()
    render(
      <SeethingSwarmAnimal
        geometry={geometry}
        clip={clip}
        shouldReduceMotion={false}
        onReady={onReady}
      />,
    )

    const image = screen.getByAltText("")
    expect(image.closest("[data-animal-id]")).toHaveAttribute(
      "data-playback-ready",
      "true",
    )
    expect(image).toHaveAttribute("decoding", "sync")
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it("does not mistake a completed broken image for usable cached pixels", () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      true,
    )
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      0,
    )
    const onReady = vi.fn()
    render(
      <SeethingSwarmAnimal
        geometry={geometry}
        clip={clip}
        shouldReduceMotion={false}
        onReady={onReady}
      />,
    )

    expect(screen.getByAltText("").closest("[data-animal-id]")).toHaveAttribute(
      "data-playback-ready",
      "false",
    )
    expect(onReady).not.toHaveBeenCalled()
  })

  it("reserves fixed geometry and animates source pixels in discrete authored frames", () => {
    render(
      <SeethingSwarmAnimal
        geometry={geometry}
        clip={clip}
        shouldReduceMotion={false}
      />,
    )

    const image = screen.getByAltText("")
    const tile = image.closest("[data-animal-id]")
    expect(tile).toHaveAttribute("aria-hidden", "true")
    expect(tile).toHaveAttribute("data-animal-id", "bat")
    expect(tile).toHaveAttribute("data-facing", "right")
    expect(tile).toHaveAttribute("data-frame-count", "4")
    expect(tile).toHaveAttribute("data-playback-mode", "loop")
    expect(tile).toHaveAttribute("data-reduced-motion", "false")
    expect(tile).toHaveStyle({
      "--animal-clearance-width": "6px",
      "--animal-clearance-height": "6px",
    })
    expect(image).toHaveAttribute("alt", "")
    expect(image).toHaveAttribute("draggable", "false")
    expect(image).toHaveAttribute("src", clip.asset.src)
    expect(image).not.toHaveAttribute("srcset")
    expect(image).toHaveAttribute("width", "48")
    expect(image).toHaveAttribute("height", "12")
    expect(image).toHaveStyle({
      "--animal-animation-duration": "640ms",
      "--animal-frame-count": "4",
      "--animal-strip-height": "12px",
      "--animal-strip-left": "-3px",
      "--animal-strip-top": "-3px",
      "--animal-strip-travel": "-48px",
      "--animal-strip-width": "48px",
    })
    expect(tile).not.toHaveAttribute("tabindex")
  })

  it("keeps the first authored frame static when Reduced Motion is active", () => {
    render(
      <SeethingSwarmAnimal
        geometry={geometry}
        clip={clip}
        shouldReduceMotion
      />,
    )

    const image = screen.getByAltText("")
    expect(image.closest("[data-animal-id]")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    )
    expect(image.closest("[data-animal-id]")).toHaveAttribute(
      "data-playback-mode",
      "static",
    )
    expect(image).toHaveStyle({
      "--animal-strip-left": "-3px",
      "--animal-strip-top": "-3px",
      "--animal-strip-travel": "-48px",
    })
  })

  it("plays one authored sequence only after loading and reports its completion", async () => {
    const onPlaybackComplete = vi.fn()
    render(
      <SeethingSwarmAnimal
        geometry={geometry}
        clip={clip}
        facing="left"
        frameDurationMs={100}
        playbackMode="one-shot"
        shouldReduceMotion={false}

        onPlaybackComplete={onPlaybackComplete}
      />,
    )

    const image = screen.getByAltText("")
    const tile = image.closest("[data-animal-id]")
    expect(tile).toHaveAttribute("data-facing", "left")
    expect(tile).toHaveAttribute("data-playback-mode", "one-shot")
    expect(tile).toHaveStyle({
      "--animal-clearance-width": "6px",
      "--animal-clearance-height": "6px",
    })
    expect(image).toHaveStyle({
      "--animal-animation-duration": "400ms",
      "--animal-strip-height": "12px",
      "--animal-strip-left": "-3px",
      "--animal-strip-top": "-3px",
      "--animal-strip-travel": "-48px",
      "--animal-strip-width": "48px",
    })

    fireEvent.animationEnd(image)
    expect(onPlaybackComplete).not.toHaveBeenCalled()
    expect(tile).toHaveAttribute("data-playback-ready", "false")
    fireEvent.load(image)
    await waitFor(() =>
      expect(tile).toHaveAttribute("data-playback-ready", "true"),
    )
    fireEvent.animationEnd(image)
    expect(onPlaybackComplete).toHaveBeenCalledTimes(1)
  })

  it("holds the final authored frame without emitting animation completion", () => {
    const onPlaybackComplete = vi.fn()
    render(
      <SeethingSwarmAnimal
        geometry={geometry}
        clip={clip}
        playbackMode="hold-final-frame"
        shouldReduceMotion={false}
        onPlaybackComplete={onPlaybackComplete}
      />,
    )

    const image = screen.getByAltText("")
    expect(image.closest("[data-animal-id]")).toHaveAttribute(
      "data-playback-mode",
      "hold-final-frame",
    )
    expect(image).toHaveStyle({
      "--animal-strip-left": "-3px",
      "--animal-strip-final-offset": "-36px",
    })

    image.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }))
    expect(onPlaybackComplete).not.toHaveBeenCalled()
  })

  it("preserves an explicitly static representative frame", () => {
    render(
      <SeethingSwarmAnimal
        geometry={geometry}
        clip={clip}
        playbackMode="static"
        shouldReduceMotion={false}
      />,
    )

    const image = screen.getByAltText("")
    expect(image.closest("[data-animal-id]")).toHaveAttribute(
      "data-playback-mode",
      "static",
    )
    expect(image).toHaveStyle({ "--animal-strip-left": "-3px" })
  })

  it("keeps the fixed source scale and reloads readiness when the strip changes", async () => {
    const onPlaybackComplete = vi.fn()
    const nextClip = {
      ...clip,
      asset: { ...clip.asset, src: "/test/next-strip.png" },
    }
    const props = {
      shouldReduceMotion: false,
      playbackMode: "one-shot",

      onPlaybackComplete,
    } as const
    const { rerender } = render(
      <SeethingSwarmAnimal geometry={geometry} {...props} clip={clip} />,
    )
    const image = screen.getByAltText("")
    expect(image).toHaveAttribute("width", "48")
    expect(image).toHaveAttribute("height", "12")
    fireEvent.load(image)
    await waitFor(() =>
      expect(image.closest("[data-animal-id]")).toHaveAttribute(
        "data-playback-ready",
        "true",
      ),
    )

    rerender(
      <SeethingSwarmAnimal geometry={geometry} {...props} clip={nextClip} />,
    )
    expect(image).toHaveAttribute("src", nextClip.asset.src)
    expect(image.closest("[data-animal-id]")).toHaveAttribute(
      "data-playback-ready",
      "false",
    )
    fireEvent.animationEnd(image)
    expect(onPlaybackComplete).not.toHaveBeenCalled()
    fireEvent.load(image)
    await waitFor(() =>
      expect(image.closest("[data-animal-id]")).toHaveAttribute(
        "data-playback-ready",
        "true",
      ),
    )
    fireEvent.animationEnd(image)
    expect(onPlaybackComplete).toHaveBeenCalledTimes(1)
  })

  it("reports an asset failure without pretending its animation completed", () => {
    const onLoadError = vi.fn()
    const onPlaybackComplete = vi.fn()
    render(
      <SeethingSwarmAnimal
        geometry={geometry}
        clip={clip}
        shouldReduceMotion={false}
        playbackMode="one-shot"
        onLoadError={onLoadError}
        onPlaybackComplete={onPlaybackComplete}
      />,
    )
    fireEvent.error(screen.getByAltText(""))
    expect(onLoadError).toHaveBeenCalledTimes(1)
    expect(onPlaybackComplete).not.toHaveBeenCalled()
  })
})
