import { resolveSeethingSwarmFamilyPerformanceProfile } from "./SeethingSwarmFamilyPerformanceProfiles"
import type { ZooAnimalId } from "./ZooAnimals"

type ContactSpans = readonly [
  squirrelAttacks: number,
  tigerAttacks: number,
  familyAttacksSquirrel: number,
  familyAttacksTiger: number,
]

// Source-pixel center distances measured where the authored strike first overlaps the initial hurt frame.
const contactSpans: Readonly<Record<string, ContactSpans>> = {
  batpack: [17.5, 30, 17.5, 26],
  bunnypack: [14, 29.5, 19, 29.5],
  catset: [23.5, 34, 15.5, 32],
  chickenpack: [14.5, 32, 14.5, 29],
  cranepack: [12.5, 31, 5.5, 39],
  crowpack: [14, 32.5, 20, 30.5],
  deerpack: [19.5, 38, 13.5, 37],
  dogpack: [25, 44.5, 20, 41.5],
  dragonflypack: [18, 21.5, 16, 20.5],
  falconpack: [12, 33.5, 23, 32.5],
  foxpack: [23.5, 43, 20.5, 37],
  frogpack: [9, 21.5, 25, 31.5],
  "catset-kittens": [20, 23.5, 14, 24.5],
  "lil-axolotl": [19.5, 22, 15.5, 24],
  "lil-doggies": [21, 24.5, 16, 23.5],
  "lil-fox": [21, 24.5, 16, 23.5],
  "lil-hedgehog": [19.5, 20, 14.5, 21],
  "lil-otter": [21.5, 22, 17.5, 24],
  "lil-pig": [18, 20.5, 15, 23.5],
  mousepack: [18.5, 20, 16.5, 21],
  owlpack: [12.5, 35, 23.5, 35],
  pandapack: [18, 38.5, 7, 37.5],
  parrotpack: [14, 32.5, 21, 30.5],
  pigpack: [24.5, 38, 17.5, 32],
  raccoonpack: [22, 38.5, 20, 34.5],
  squirrelpack: [21, 20.5, 21, 24.5],
  tigerpack: [24.5, 45, 20.5, 45],
  turtlepack: [20, 33.5, 20, 28.5],
  wolfpack: [24, 43.5, 20, 40.5],
}

const alternateStrikes: Readonly<
  Record<string, readonly [againstSquirrel: number, againstTiger: number]>
> = {
  "cranepack/peck": [17.5, 26],
  "deerpack/attack02": [3.5, 37],
  "pandapack/attack02": [19, 39.5],
  "pandapack/bite": [12, 35.5],
}

const windupSpans: Readonly<Record<string, number>> = {
  "cranepack/attack/squirrelpack": 21,
  "cranepack/peck/tigerpack": 32.5,
  "deerpack/attack01/squirrelpack": 20,
  "deerpack/attack02/squirrelpack": 18,
  "pandapack/attack01/squirrelpack": 13.5,
  "squirrelpack/attack/crowpack": 15.5,
  "squirrelpack/attack/deerpack": 28,
  "squirrelpack/attack/falconpack": 17.5,
  "squirrelpack/attack/owlpack": 14,
  "squirrelpack/attack/parrotpack": 15.5,
}

export function resolveSeethingSwarmStrikeSpacing(
  attacker: ZooAnimalId,
  defender: ZooAnimalId,
  attack: string,
) {
  if (
    attacker !== "squirrelpack" &&
    attacker !== "tigerpack" &&
    defender !== "squirrelpack" &&
    defender !== "tigerpack"
  )
    return undefined
  const source = resolveSeethingSwarmFamilyPerformanceProfile(attacker).packId
  const target = resolveSeethingSwarmFamilyPerformanceProfile(defender).packId
  let impact: number | undefined
  if (source === "squirrelpack" || source === "tigerpack") {
    impact = contactSpans[target]?.[source === "squirrelpack" ? 0 : 1]
  } else if (target === "squirrelpack" || target === "tigerpack") {
    const variation = alternateStrikes[`${source}/${attack}`]
    impact =
      variation?.[target === "squirrelpack" ? 0 : 1] ??
      contactSpans[source]?.[target === "squirrelpack" ? 2 : 3]
  }
  return impact === undefined
    ? undefined
    : {
        windup: windupSpans[`${source}/${attack}/${target}`] ?? impact,
        impact,
      }
}
