"use client"

import type {
  SeethingSwarmRuntimeCharacterClip,
  SeethingSwarmRuntimeClipCatalog,
} from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { PresentedBattle } from "@game/machines/src/CombatMachine"
import {
  createSeethingSwarmAssetPreparationMachine,
  getChoreographyPreparationClips,
  isChoreographyPrepared,
} from "@game/machines/src/SeethingSwarmAssetPreparation"
import { createSeethingSwarmBattleChoreography } from "@game/machines/src/SeethingSwarmBattleChoreography"
import { useActorRef, useSelector } from "@xstate/react"
import Image, { type StaticImageData } from "next/image"
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  type ReactNode,
} from "react"
import type { ActorRefFrom } from "xstate"

const preparationMachine =
  createSeethingSwarmAssetPreparationMachine<StaticImageData>()
const PreparationContext = createContext<
  ActorRefFrom<typeof preparationMachine> | undefined
>(undefined)

export default function SeethingSwarmAssetPreparation({
  children,
}: {
  children: ReactNode
}) {
  const actor = useActorRef(preparationMachine)
  const assets = useSelector(actor, (snapshot) => snapshot.context.assets)
  return (
    <PreparationContext value={actor}>
      {children}
      <div hidden aria-hidden="true">
        {[...assets.values()].map(({ clip, generation }) => (
          <Image
            unoptimized
            key={generation}
            src={clip.asset}
            alt=""
            width={clip.frameWidth * clip.frameCount}
            height={clip.frameHeight}
            decoding="async"
            loading="eager"
            fetchPriority="low"
            onLoad={async (event) => {
              const image = event.currentTarget
              try {
                await image.decode()
                actor.send({
                  type: "ASSET.SETTLED",
                  path: clip.relativePath,
                  generation,
                  status: "ready",
                })
              } catch {
                actor.send({
                  type: "ASSET.SETTLED",
                  path: clip.relativePath,
                  generation,
                  status: "failed",
                })
              }
            }}
            onError={() =>
              actor.send({
                type: "ASSET.SETTLED",
                path: clip.relativePath,
                generation,
                status: "failed",
              })
            }
          />
        ))}
      </div>
    </PreparationContext>
  )
}

export function usePreparedSeethingSwarmClips(
  clips: readonly SeethingSwarmRuntimeCharacterClip<StaticImageData>[],
) {
  const actor = useContext(PreparationContext)
  const scope = useId()
  useEffect(() => {
    actor?.send({ type: "ASSETS.REQUESTED", scope, clips })
  }, [actor, clips, scope])
  useEffect(
    () => () => actor?.send({ type: "ASSETS.RELEASED", scope }),
    [actor, scope],
  )
  return useSelector(
    actor,
    (snapshot) =>
      !snapshot ||
      clips.every((clip) => {
        const status = snapshot.context.assets.get(clip.relativePath)?.status
        return status === "ready" || status === "failed"
      }),
  )
}

export function usePreparedSeethingSwarmBattle(
  battle: PresentedBattle | null,
  catalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>,
) {
  const actor = useContext(PreparationContext)
  const choreography = useMemo(
    () =>
      battle
        ? createSeethingSwarmBattleChoreography({ battle, catalog })
        : null,
    [battle, catalog],
  )
  const clips = useMemo(
    () => (choreography ? getChoreographyPreparationClips(choreography) : []),
    [choreography],
  )
  usePreparedSeethingSwarmClips(clips)
  return useSelector(
    actor,
    (snapshot) =>
      !snapshot ||
      !choreography ||
      isChoreographyPrepared(choreography, snapshot.context.assets),
  )
}

export function useSeethingSwarmAssetStatus(path: string) {
  const actor = useContext(PreparationContext)
  return useSelector(
    actor,
    (snapshot) => snapshot?.context.assets.get(path)?.status,
  )
}

export function useSeethingSwarmPreparedAssets() {
  const actor = useContext(PreparationContext)
  return useSelector(actor, (snapshot) => snapshot?.context.assets)
}
