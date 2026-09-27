import { resolveValueAnimalId } from "@game/data/src/ValueAnimalAssociation"
import type { ValueId } from "@game/data/src/Value"
import type { ZooAnimalId } from "@game/data/src/ZooAnimals"

export type SeethingSwarmBattleCombatant = Readonly<{
  valueId: ValueId
  animalId: ZooAnimalId
}>

export function resolveSeethingSwarmBattleCombatant(valueId: ValueId) {
  return Object.freeze({
    valueId,
    animalId: resolveValueAnimalId(valueId),
  }) satisfies SeethingSwarmBattleCombatant
}
