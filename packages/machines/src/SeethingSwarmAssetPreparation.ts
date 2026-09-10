import type { SeethingSwarmRuntimeCharacterClip } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import { projectHubValues } from "@game/data/src/HubValueProjection"
import { resolveValueAnimalPresentation } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { assign, setup } from "xstate"
import type { SeethingSwarmBattleChoreography } from "./SeethingSwarmBattleChoreography"
import { getSeethingSwarmBattleClips } from "./SeethingSwarmBattlePlayback"

export type PreparedSeethingSwarmAsset<Asset> = Readonly<{
  clip: SeethingSwarmRuntimeCharacterClip<Asset>
  generation: number
  status: "pending" | "ready" | "failed"
}>

export function getHubPreparationClips<Asset>(rankedValues: readonly RankedValue[], catalog: SeethingSwarmRuntimeClipCatalog<Asset>) {
  const { hasComparisons, topFive } = projectHubValues(rankedValues)
  return hasComparisons ? topFive.flatMap(({definition})=>{
    const presentation = resolveValueAnimalPresentation(definition, catalog)
    return presentation.kind === "animal" ? [presentation.clip] : []
  }) : []
}

export function getChoreographyPreparationClips<Asset>(choreography: SeethingSwarmBattleChoreography<Asset>) {
  if (choreography.mode !== "licensed") return []
  return choreography.combatants.flatMap(combatant => [
    ...combatant.clips.entry.sequence,
    ...combatant.clips.rest.sequence,
    ...getSeethingSwarmBattleClips(combatant),
  ])
}

export function isChoreographyPrepared<Asset>(choreography: SeethingSwarmBattleChoreography<Asset>, assets: ReadonlyMap<string, PreparedSeethingSwarmAsset<Asset>>) {
  if (choreography.mode !== "licensed") return true
  return choreography.combatants.every(combatant => {
    const initialClips = [...combatant.clips.entry.sequence, ...combatant.clips.rest.sequence]
    if (initialClips.some(clip => assets.get(clip.relativePath)?.status === "ready")) return true
    return initialClips.every(clip => assets.get(clip.relativePath)?.status === "failed") &&
      getSeethingSwarmBattleClips(combatant).every(clip => {
        const status = assets.get(clip.relativePath)?.status
        return status === "ready" || status === "failed"
      })
  })
}

export function createSeethingSwarmAssetPreparationMachine<Asset>() {
  type Clip = SeethingSwarmRuntimeCharacterClip<Asset>
  return setup({
    types: {
      context: {} as {
        scopes: ReadonlyMap<string, readonly Clip[]>
        assets: ReadonlyMap<string, PreparedSeethingSwarmAsset<Asset>>
        nextGeneration: number
      },
      events: {} as
        | { type: "ASSETS.REQUESTED"; scope: string; clips: readonly Clip[] }
        | { type: "ASSETS.RELEASED"; scope: string }
        | { type: "ASSET.SETTLED"; path: string; generation: number; status: "ready" | "failed" },
    },
  }).createMachine({
    context: { scopes: new Map(), assets: new Map(), nextGeneration: 0 },
    on: {
      "ASSETS.REQUESTED": { actions: assign(({context,event}) => {
        const scopes = new Map(context.scopes).set(event.scope,event.clips)
        const assets = new Map<string, PreparedSeethingSwarmAsset<Asset>>()
        let nextGeneration = context.nextGeneration
        for (const clips of scopes.values()) for (const clip of clips) {
          if (assets.has(clip.relativePath)) continue
          const previous = context.assets.get(clip.relativePath)
          assets.set(clip.relativePath, previous?.clip.asset === clip.asset ? previous : {
            clip, generation:nextGeneration++, status:"pending",
          })
        }
        return {scopes,assets,nextGeneration}
      }) },
      "ASSETS.RELEASED": { actions: assign(({context,event}) => {
        const scopes = new Map(context.scopes)
        scopes.delete(event.scope)
        const retainedPaths = new Set([...scopes.values()].flatMap(clips=>clips.map(clip=>clip.relativePath)))
        return { scopes, assets:new Map([...context.assets].filter(([path])=>retainedPaths.has(path))) }
      }) },
      "ASSET.SETTLED": { actions: assign(({context,event}) => {
        const asset = context.assets.get(event.path)
        if (!asset || asset.generation !== event.generation || asset.status === event.status) return {}
        return {assets:new Map(context.assets).set(event.path,{...asset,status:event.status})}
      }) },
    },
  })
}
