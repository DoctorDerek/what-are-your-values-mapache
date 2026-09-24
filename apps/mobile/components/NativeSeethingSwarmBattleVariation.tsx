import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { ZooAnimalId } from "@game/data/src/ZooAnimals"
import type { PresentedBattle } from "@game/machines/src/CombatMachine"
import { createSeethingSwarmBattleChoreography, createSeethingSwarmChoreographyIdentity } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { projectSeethingSwarmBattleOrdinals, seethingSwarmBattleVariationMachine, type SeethingSwarmVariedRole } from "@game/machines/src/SeethingSwarmBattleVariation"
import { useActorRef, useSelector } from "@xstate/react"
import { createContext, useContext, useCallback, useId, useLayoutEffect, useMemo, type ReactNode } from "react"
import type { ActorRefFrom } from "xstate"

const VariationContext = createContext<ActorRefFrom<typeof seethingSwarmBattleVariationMachine> | undefined>(undefined)

export default function NativeSeethingSwarmBattleVariation({ children }: { children: ReactNode }) {
  const actor = useActorRef(seethingSwarmBattleVariationMachine)
  return <VariationContext value={actor}>{children}</VariationContext>
}

export function useNativeSeethingSwarmProjectedBattle(battle: PresentedBattle | null, catalog: SeethingSwarmRuntimeClipCatalog<number>) {
  const actor = useContext(VariationContext)
  const identity = battle ? createSeethingSwarmChoreographyIdentity(battle) : ""
  const ordinals = useSelector(actor, (snapshot) => projectSeethingSwarmBattleOrdinals(snapshot?.context, identity))
  return useMemo(() => battle ? createSeethingSwarmBattleChoreography({ battle, catalog, ordinals }) : null, [battle, catalog, ordinals])
}

export function useNativeSeethingSwarmActiveBattle(battle: PresentedBattle, catalog: SeethingSwarmRuntimeClipCatalog<number>) {
  const actor = useContext(VariationContext)
  const scope = useId()
  const identity = createSeethingSwarmChoreographyIdentity(battle)
  const ordinals = useSelector(actor, (snapshot) => projectSeethingSwarmBattleOrdinals(snapshot?.context, identity, scope))
  const choreography = useMemo(() => createSeethingSwarmBattleChoreography({ battle, catalog, ordinals }), [battle, catalog, ordinals])
  const firstAnimalId = choreography.combatants[0].animalId
  const secondAnimalId = choreography.combatants[1].animalId
  useLayoutEffect(() => {
    actor?.send({ type: "PERFORMANCE.PRESENTED", identity, scope, animalIds: [firstAnimalId, secondAnimalId] })
    return () => actor?.send({ type: "PERFORMANCE.CLOSED", identity, scope })
  }, [actor, identity, scope, firstAnimalId, secondAnimalId])
  const onRoleEntered = useCallback((animalId: ZooAnimalId, role: SeethingSwarmVariedRole) => {
    actor?.send({ type: "PERFORMANCE.ROLE_ENTERED", identity, scope, animalId, role })
  }, [actor, identity, scope])
  return { choreography, onRoleEntered }
}

