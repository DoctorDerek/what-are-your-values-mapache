import { createSeethingSwarmAnimalPresentationGeometry } from "./SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "./SeethingSwarmRuntimeClipCatalog"

export const FIRST_ARRIVAL_PRESENTATION = Object.freeze({
  titleLines: ["What Are Your Values,", "Mapache?"],
  gameCredit: "A Mapachito Game",
  creatorCredit: "by Dr. Derek Austin",
  creatorWebsiteLabel: "DoctorDerek.com",
  creatorWebsiteUrl: "https://doctorderek.com",
  websiteErrorTitle: "Could not open website",
  websiteErrorMessage: "Please try again.",
  animationUrl: "/generated/mapachito/ice-cream.riv",
  posterUrl: "/generated/mapachito/ice-cream.png",
  runtimeUrl: "/generated/mapachito/rive.wasm",
  runtimeFallbackUrl: "/generated/mapachito/rive_fallback.wasm",
  stateMachineName: "Intro Animation",
  loadDelayMs: 4000,
  idleTimeoutMs: 2000,
  raccoonDelayMs: 900,
  raccoonTravelMs: 3200,
  raccoonWideTravelMs: 4000,
} as const)

export function resolveFirstArrivalRaccoon<PlatformAsset>(
  catalog: SeethingSwarmRuntimeClipCatalog<PlatformAsset>,
) {
  if (catalog.mode === "typography-only") return null
  const animal = catalog.animals.find(
    ({ animalId }) => animalId === "raccoonpack",
  )
  const clip = animal?.characterClips.find(
    ({ animationId }) => animationId === "run",
  )
  if (!animal || !clip) return null
  return {
    clip,
    geometry: createSeethingSwarmAnimalPresentationGeometry(
      animal.referencePose,
      [clip],
    ),
  }
}
