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

type StrikeDistances = readonly [windup: number, impact: number]

const bearContactSpans: Readonly<
  Record<
    string,
    readonly [
      bite: StrikeDistances,
      swipe: StrikeDistances | null,
      incoming: StrikeDistances,
    ]
  >
> = {
  batpack: [
    [29.5, 25.5],
    [29.5, 26.5],
    [29.5, 26.5],
  ],
  bearpack: [
    [54, 54],
    [56, 49],
    [54, 54],
  ],
  bunnypack: [
    [34, 30],
    [35, 27],
    [31, 31],
  ],
  catset: [
    [32.5, 28.5],
    [32.5, 30.5],
    [33.5, 33.5],
  ],
  "catset-kittens": [[29, 22], null, [27, 27]],
  chickenpack: [
    [30.5, 30.5],
    [29.5, 28.5],
    [30.5, 30.5],
  ],
  cranepack: [
    [36.5, 36.5],
    [37.5, 32.5],
    [41.5, 41.5],
  ],
  crowpack: [
    [35, 31],
    [33, 29],
    [34, 32],
  ],
  deerpack: [
    [47.5, 43.5],
    [47.5, 39.5],
    [45.5, 40.5],
  ],
  dogpack: [
    [47, 47],
    [44, 42],
    [43, 43],
  ],
  dragonflypack: [
    [27, 22],
    [31, 18],
    [28, 22],
  ],
  falconpack: [
    [38, 35],
    [37, 31],
    [37, 34],
  ],
  foxpack: [
    [43.5, 43.5],
    [41.5, 39.5],
    [39.5, 39.5],
  ],
  frogpack: [
    [17, 14],
    [19, 18],
    [33, 33],
  ],
  "lil-axolotl": [[26.5, 22.5], null, [25.5, 25.5]],
  "lil-doggies": [[29, 23], null, [26, 26]],
  "lil-fox": [[29, 23], null, [26, 26]],
  "lil-hedgehog": [[24.5, 20.5], null, [22.5, 22.5]],
  "lil-otter": [[29.5, 22.5], null, [29.5, 25.5]],
  "lil-pig": [[29, 20], null, [26, 26]],
  mousepack: [[26.5, 20.5], null, [22.5, 22.5]],
  owlpack: [
    [37.5, 37.5],
    [36.5, 32.5],
    [37.5, 34.5],
  ],
  pandapack: [
    [42, 42],
    [39, 37],
    [38, 38],
  ],
  parrotpack: [
    [35, 31],
    [33, 29],
    [34, 32],
  ],
  pigpack: [
    [38.5, 30.5],
    [39.5, 34.5],
    [37.5, 34.5],
  ],
  raccoonpack: [
    [40, 40],
    [38, 36],
    [38, 34],
  ],
  squirrelpack: [[28, 21], null, [26, 26]],
  tigerpack: [
    [48.5, 48.5],
    [46.5, 43.5],
    [47.5, 47.5],
  ],
  turtlepack: [
    [34, 29],
    [34, 30],
    [35, 30],
  ],
  wolfpack: [
    [46, 46],
    [43, 41],
    [46, 46],
  ],
}

const alternateStrikesAgainstBear: Readonly<Record<string, StrikeDistances>> = {
  "cranepack/peck": [42.5, 28.5],
  "deerpack/attack02": [40.5, 37.5],
  "pandapack/attack02": [42, 42],
  "pandapack/bite": [40, 40],
}

export function isSeethingSwarmStrikeCompatible(
  attacker: ZooAnimalId,
  defender: ZooAnimalId,
  attack: string,
) {
  return (
    attacker !== "bearpack" ||
    !attack.startsWith("stand_attack") ||
    bearContactSpans[
      resolveSeethingSwarmFamilyPerformanceProfile(defender).packId
    ]?.[1] !== null
  )
}

export function resolveSeethingSwarmStrikeSpacing(
  attacker: ZooAnimalId,
  defender: ZooAnimalId,
  attack: string,
) {
  if (attacker === "bearpack" || defender === "bearpack") {
    const source = resolveSeethingSwarmFamilyPerformanceProfile(attacker).packId
    const target = resolveSeethingSwarmFamilyPerformanceProfile(defender).packId
    const distances =
      attacker === "bearpack"
        ? bearContactSpans[target]?.[attack === "bite" ? 0 : 1]
        : (alternateStrikesAgainstBear[`${source}/${attack}`] ??
          bearContactSpans[source]?.[2])
    return distances
      ? { windup: distances[0], impact: distances[1] }
      : undefined
  }
  const newAttacker = attacker === "squirrelpack" || attacker === "tigerpack"
  if (!newAttacker && defender !== "squirrelpack" && defender !== "tigerpack")
    return undefined
  const source = resolveSeethingSwarmFamilyPerformanceProfile(attacker).packId
  const target = resolveSeethingSwarmFamilyPerformanceProfile(defender).packId
  let impact: number | undefined
  if (newAttacker) {
    impact = contactSpans[target]?.[attacker === "squirrelpack" ? 0 : 1]
  } else {
    const againstSquirrel = defender === "squirrelpack"
    const variation = alternateStrikes[`${source}/${attack}`]
    impact =
      variation?.[againstSquirrel ? 0 : 1] ??
      contactSpans[source]?.[againstSquirrel ? 2 : 3]
  }
  return impact === undefined
    ? undefined
    : {
        windup: windupSpans[`${source}/${attack}/${target}`] ?? impact,
        impact,
      }
}
