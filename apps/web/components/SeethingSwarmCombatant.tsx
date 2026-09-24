import { SEETHING_SWARM_CALM_FRAME_DURATION_MS } from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { ValueId } from "@game/data/src/Value"
import type { ZooAnimalId } from "@game/data/src/ZooAnimals"
import {
  createSeethingSwarmAttentionState,
  updateSeethingSwarmAttention,
} from "@game/machines/src/SeethingSwarmAttention"
import type { SeethingSwarmLicensedBattleCombatant } from "@game/machines/src/SeethingSwarmBattleChoreography"
import type { SeethingSwarmBattleExchangeCue } from "@game/machines/src/SeethingSwarmBattleExchange"
import {
  createSeethingSwarmBattlePlayback,
  getSeethingSwarmBattleClips,
} from "@game/machines/src/SeethingSwarmBattlePlayback"
import type { SeethingSwarmVariedRole } from "@game/machines/src/SeethingSwarmBattleVariation"
import type { StaticImageData } from "next/image"
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import SeethingSwarmAnimal from "@/components/SeethingSwarmAnimal"
import { useSeethingSwarmPreparedAssets } from "@/components/SeethingSwarmAssetPreparation"
import SeethingSwarmPlaceholder from "@/components/SeethingSwarmPlaceholder"

export default function SeethingSwarmCombatant({
  combatant,
  winnerId,
  cue: exchangeCue,
  isAttended,
  shouldReduceMotion,
  onPlaybackComplete,
  onReady,
  onRoleEntered,
  isTravelReady = true,
}: {
  combatant: SeethingSwarmLicensedBattleCombatant<StaticImageData>
  winnerId: ValueId | null
  cue: SeethingSwarmBattleExchangeCue
  isAttended: boolean
  shouldReduceMotion: boolean
  onPlaybackComplete: () => void
  onReady: (canPlaySequence: boolean) => void
  onRoleEntered?: (animalId: ZooAnimalId, role: SeethingSwarmVariedRole) => void
  isTravelReady?: boolean
}) {
  const [attention, setAttention] = useState(createSeethingSwarmAttentionState)
  const nextAttention = updateSeethingSwarmAttention(
    attention,
    isAttended,
    !shouldReduceMotion && exchangeCue === "introduction",
    combatant.attentionAlternatives.length,
  )
  if (nextAttention !== attention) setAttention(nextAttention)
  const performanceCombatant = useMemo(
    () => ({
      ...combatant,
      clips: {
        ...combatant.clips,
        anticipation:
          combatant.attentionAlternatives[nextAttention.alternativeIndex]!,
      },
    }),
    [combatant, nextAttention.alternativeIndex],
  )
  const [playback, setPlayback] = useState({
    cue: exchangeCue,
    stepIndex: 0,
    generation: nextAttention.generation,
  })
  const cue =
    exchangeCue !== "introduction"
      ? exchangeCue
      : nextAttention.isActive
        ? "attention"
        : playback.cue === "introduction"
          ? "introduction"
          : "rest"
  if (playback.cue !== cue || playback.generation !== nextAttention.generation)
    setPlayback({ cue, stepIndex: 0, generation: nextAttention.generation })
  const requestedStepIndex =
    playback.cue === cue && playback.generation === nextAttention.generation
      ? playback.stepIndex
      : 0
  const preparedAssets = useSeethingSwarmPreparedAssets()
  const [loadedImageClips, setLoadedClips] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [failedImageClips, setFailedClips] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const [displayedClipId, setDisplayedClipId] = useState(
    combatant.clips.rest.clip.animationId,
  )
  const residentClips = useMemo(
    () => getSeethingSwarmBattleClips(performanceCombatant),
    [performanceCombatant],
  )
  const steps = useMemo(
    () =>
      createSeethingSwarmBattlePlayback({
        combatant: performanceCombatant,
        winnerId,
        cue,
      }),
    [performanceCombatant, winnerId, cue],
  )
  const loadedClips = new Set([
    ...loadedImageClips,
    ...residentClips
      .filter(
        (clip) => preparedAssets?.get(clip.relativePath)?.status === "ready",
      )
      .map((clip) => clip.animationId),
  ])
  const failedClips = new Set([
    ...failedImageClips,
    ...residentClips
      .filter(
        (clip) => preparedAssets?.get(clip.relativePath)?.status === "failed",
      )
      .map((clip) => clip.animationId),
  ])
  const hasNoUsableImage = residentClips.every((clip) =>
    failedClips.has(clip.animationId),
  )
  const requiredBattleClips =
    winnerId === combatant.valueId
      ? [combatant.locomotion, ...combatant.clips.attack.sequence]
      : combatant.clips.reaction.sequence
  const hasIncompleteBattleSequence =
    winnerId !== null &&
    requiredBattleClips.some((clip) => failedClips.has(clip.animationId))
  const retainedClipId =
    loadedClips.has(displayedClipId) && !failedClips.has(displayedClipId)
      ? displayedClipId
      : ([...loadedClips].find((candidate) => !failedClips.has(candidate)) ??
        combatant.clips.rest.clip.animationId)
  const hasRetainedImage =
    loadedClips.has(retainedClipId) && !failedClips.has(retainedClipId)
  const nextAvailableStepIndex = steps.findIndex(
    (candidate, index) =>
      index >= requestedStepIndex &&
      !failedClips.has(candidate.clip.animationId),
  )
  const stepIndex = hasRetainedImage
    ? nextAvailableStepIndex === -1
      ? steps.length
      : nextAvailableStepIndex
    : requestedStepIndex
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const isComplete = stepIndex === steps.length
  const attentionFailed =
    cue === "attention" &&
    steps.some(({ clip }) => failedClips.has(clip.animationId))
  const attentionReady =
    cue !== "attention" ||
    steps.every(({ clip }) => loadedClips.has(clip.animationId))
  const role =
    (shouldReduceMotion && !winnerId) ||
    attentionFailed ||
    hasIncompleteBattleSequence
      ? "rest"
      : step.role
  const requestedClipId =
    (shouldReduceMotion && !winnerId) ||
    attentionFailed ||
    hasIncompleteBattleSequence
      ? combatant.clips.rest.clip.animationId
      : step.clip.animationId
  const isReady =
    loadedClips.has(requestedClipId) &&
    !failedClips.has(requestedClipId) &&
    (attentionFailed || attentionReady)
  if (isReady && displayedClipId !== requestedClipId)
    setDisplayedClipId(requestedClipId)
  const visibleClipId = isReady ? requestedClipId : retainedClipId
  const hasVisibleImage =
    loadedClips.has(visibleClipId) && !failedClips.has(visibleClipId)
  const hasLoadError = failedClips.has(requestedClipId)

  useEffect(() => {
    if (
      !isReady ||
      !hasVisibleImage ||
      isComplete ||
      shouldReduceMotion ||
      hasIncompleteBattleSequence ||
      (cue === "approach" && !isTravelReady) ||
      cue === "attention" ||
      role === "anticipation" ||
      (role !== "rest" && step.semanticFamily === "rest")
    )
      return
    onRoleEntered?.(combatant.animalId, role)
  }, [
    combatant.animalId,
    cue,
    hasVisibleImage,
    hasIncompleteBattleSequence,
    isComplete,
    isReady,
    isTravelReady,
    onRoleEntered,
    role,
    shouldReduceMotion,
    step.semanticFamily,
  ])

  const isBattlePrepared = requiredBattleClips.every(
    (clip) =>
      loadedClips.has(clip.animationId) || failedClips.has(clip.animationId),
  )
  useEffect(() => {
    if (
      isBattlePrepared &&
      (isReady || (hasLoadError && hasVisibleImage) || hasNoUsableImage)
    )
      onReady(!hasIncompleteBattleSequence)
  }, [
    cue,
    hasLoadError,
    hasVisibleImage,
    hasNoUsableImage,
    hasIncompleteBattleSequence,
    isBattlePrepared,
    isReady,
    onReady,
  ])

  const finishStep = () => {
    if (isComplete) return
    setPlayback((previous) =>
      previous.cue === cue &&
      previous.generation === nextAttention.generation &&
      previous.stepIndex === requestedStepIndex
        ? { cue, stepIndex: stepIndex + 1, generation: previous.generation }
        : previous,
    )
    if (winnerId && stepIndex + 1 === steps.length) onPlaybackComplete()
  }

  useEffect(() => {
    if (hasLoadError && hasVisibleImage && isComplete && winnerId)
      onPlaybackComplete()
  }, [hasLoadError, hasVisibleImage, isComplete, onPlaybackComplete, winnerId])

  const hasBlockingSteps = steps
    .slice(stepIndex)
    .some((candidate) => candidate.blocksResult)
  useEffect(() => {
    if (
      winnerId &&
      cue !== "approach" &&
      cue !== "introduction" &&
      (!hasBlockingSteps || hasIncompleteBattleSequence)
    )
      onPlaybackComplete()
  }, [
    cue,
    hasBlockingSteps,
    hasIncompleteBattleSequence,
    onPlaybackComplete,
    winnerId,
  ])

  const combatantStyle: CSSProperties & {
    "--combatant-width": string
    "--combatant-height": string
    "--combatant-below-anchor": string
  } = {
    "--combatant-width": `${combatant.geometry.width}px`,
    "--combatant-height": `${combatant.geometry.height}px`,
    "--combatant-below-anchor": `${combatant.geometry.height - combatant.geometry.anchorY}px`,
  }
  return (
    <span
      className="relative block h-(--combatant-height) w-(--combatant-width) shrink-0"
      style={combatantStyle}
      data-battle-role={role}
      data-battle-requested-clip={requestedClipId}
    >
      {residentClips.map((clip) => {
        const isVisible = clip.animationId === visibleClipId && hasVisibleImage
        return (
          <span
            key={clip.animationId}
            className={`absolute inset-0 ${isVisible ? "visible" : "invisible"}`}
            data-battle-active-clip={isVisible}
            data-battle-clip={clip.animationId}
          >
            <SeethingSwarmAnimal
              clip={clip}
              playbackIdentity={`${cue}:${nextAttention.generation}:${stepIndex}`}
              facing={
                (combatant.side === "first") !== step.facesAway
                  ? "right"
                  : "left"
              }
              startFrame={
                isVisible &&
                isReady &&
                !hasIncompleteBattleSequence &&
                !attentionFailed
                  ? step.startFrame
                  : 0
              }
              endFrame={
                isVisible &&
                isReady &&
                !hasIncompleteBattleSequence &&
                !attentionFailed
                  ? step.endFrame
                  : clip.frameCount
              }
              frameDurationMs={
                attentionFailed
                  ? SEETHING_SWARM_CALM_FRAME_DURATION_MS
                  : step.frameDurationMs
              }
              geometry={combatant.geometry}
              preload
              playbackMode={
                cue === "approach" && !isTravelReady
                  ? "static"
                  : !isVisible ||
                      shouldReduceMotion ||
                      hasIncompleteBattleSequence
                    ? "static"
                    : !isReady || isComplete
                      ? "hold-final-frame"
                      : attentionFailed
                        ? "loop"
                        : step.playbackMode
              }
              shouldReduceMotion={shouldReduceMotion}
              onLoadError={() =>
                setFailedClips(
                  (previous) => new Set([...previous, clip.animationId]),
                )
              }
              onReady={() =>
                setLoadedClips(
                  (previous) => new Set([...previous, clip.animationId]),
                )
              }
              onPlaybackComplete={
                isVisible &&
                isReady &&
                !attentionFailed &&
                !hasIncompleteBattleSequence
                  ? finishStep
                  : undefined
              }
            />
          </span>
        )
      })}
      {!hasVisibleImage && hasNoUsableImage ? (
        <span className="absolute bottom-(--combatant-below-anchor) left-1/2 -translate-x-1/2">
          <SeethingSwarmPlaceholder
            key={cue}
            side={combatant.side}
            role={role === "entry" || role === "anticipation" ? "rest" : role}
            shouldReduceMotion={shouldReduceMotion}
            onPlaybackComplete={finishStep}
            onReady={() => onReady(false)}
          />
        </span>
      ) : null}
    </span>
  )
}
