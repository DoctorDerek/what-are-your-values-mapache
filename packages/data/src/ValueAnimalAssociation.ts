import { hashText } from "@game/utils/src/HashText"
import { isCanonicalValueId, type ValueId } from "./Value"
import { VALUE_TO_ANIMAL_MAP } from "./ValueToAnimalMap"
import { ZOO_ANIMALS, type ZooAnimalId } from "./ZooAnimals"

export const SEETHING_SWARM_CUSTOM_VALUE_ANIMAL_ASSOCIATION_VERSION = 1

export const SEETHING_SWARM_CUSTOM_VALUE_ANIMAL_ROSTER = Object.freeze(
  ZOO_ANIMALS.map(({ id }) => id),
)

const canonicalAnimalByValueId = new Map(
  VALUE_TO_ANIMAL_MAP.map(({ valueId, animalId }) => [valueId, animalId]),
)

export function resolveValueAnimalId(valueId: ValueId): ZooAnimalId {
  if (isCanonicalValueId(valueId)) {
    const animalId = canonicalAnimalByValueId.get(valueId)
    if (!animalId) {
      throw new Error(`Missing animal mapping for canonical value: ${valueId}`)
    }
    return animalId
  }

  const associationIdentity = JSON.stringify([
    "seethingswarm-custom-value-animal",
    SEETHING_SWARM_CUSTOM_VALUE_ANIMAL_ASSOCIATION_VERSION,
    valueId,
  ])
  const animalIndex =
    hashText(associationIdentity) %
    SEETHING_SWARM_CUSTOM_VALUE_ANIMAL_ROSTER.length
  return SEETHING_SWARM_CUSTOM_VALUE_ANIMAL_ROSTER[animalIndex]!
}
