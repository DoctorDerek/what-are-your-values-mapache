import type { SeethingSwarmRuntimeCharacterClip, SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { createSeethingSwarmAssetPreparationMachine, getChoreographyPreparationClips, isChoreographyPrepared } from "@game/machines/src/SeethingSwarmAssetPreparation"
import { createSeethingSwarmBattleChoreography } from "@game/machines/src/SeethingSwarmBattleChoreography"
import type { PresentedBattle } from "@game/machines/src/CombatMachine"
import { useActorRef, useSelector } from "@xstate/react"
import { createContext, useContext, useEffect, useId, useMemo, type ReactNode } from "react"
import { Image, View } from "react-native"
import type { ActorRefFrom } from "xstate"

const preparationMachine = createSeethingSwarmAssetPreparationMachine<number>()
const PreparationContext = createContext<ActorRefFrom<typeof preparationMachine> | undefined>(undefined)

export default function NativeSeethingSwarmAssetPreparation({children}:{children:ReactNode}) {
  const actor = useActorRef(preparationMachine)
  const assets = useSelector(actor,snapshot=>snapshot.context.assets)
  return <PreparationContext value={actor}>
    {children}
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="absolute size-0 overflow-hidden opacity-0">
      {[...assets.values()].map(({clip,generation})=><Image key={generation} testID={`prepared-animal-${generation}`} source={clip.asset} alt="" accessible={false} fadeDuration={0} style={{width:clip.frameWidth*clip.frameCount,height:clip.frameHeight}} onLoad={()=>actor.send({type:"ASSET.SETTLED",path:clip.relativePath,generation,status:"ready"})} onError={()=>actor.send({type:"ASSET.SETTLED",path:clip.relativePath,generation,status:"failed"})} />)}
    </View>
  </PreparationContext>
}

export function usePreparedNativeSeethingSwarmClips(clips:readonly SeethingSwarmRuntimeCharacterClip<number>[]) {
  const actor = useContext(PreparationContext)
  const scope = useId()
  useEffect(()=>{
    actor?.send({type:"ASSETS.REQUESTED",scope,clips})
  },[actor,clips,scope])
  useEffect(()=>()=>actor?.send({type:"ASSETS.RELEASED",scope}),[actor,scope])
  return useSelector(actor,snapshot=>!snapshot || clips.every(clip=>{
    const status = snapshot.context.assets.get(clip.relativePath)?.status
    return status === "ready" || status === "failed"
  }))
}

export function usePreparedNativeSeethingSwarmBattle(battle:PresentedBattle|null,catalog:SeethingSwarmRuntimeClipCatalog<number>) {
  const actor = useContext(PreparationContext)
  const choreography = useMemo(()=>battle ? createSeethingSwarmBattleChoreography({battle,catalog}):null,[battle,catalog])
  const clips = useMemo(()=>choreography ? getChoreographyPreparationClips(choreography):[],[choreography])
  usePreparedNativeSeethingSwarmClips(clips)
  return useSelector(actor,snapshot=>!snapshot || !choreography || isChoreographyPrepared(choreography,snapshot.context.assets))
}

export function useNativeSeethingSwarmAssetStatus(path:string) {
  const actor = useContext(PreparationContext)
  return useSelector(actor,snapshot=>snapshot?.context.assets.get(path)?.status)
}

export function useNativeSeethingSwarmPreparedAssets() {
  const actor = useContext(PreparationContext)
  return useSelector(actor,snapshot=>snapshot?.context.assets)
}
