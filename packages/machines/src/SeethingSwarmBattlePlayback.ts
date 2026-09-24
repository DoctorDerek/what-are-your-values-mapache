import {
  SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS,
  SEETHING_SWARM_BATTLE_FRAME_DURATION_MS,
  SEETHING_SWARM_CALM_FRAME_DURATION_MS,
  type SeethingSwarmAnimalPlaybackMode,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import { resolveSeethingSwarmAttackContact } from "@game/data/src/SeethingSwarmAttackContact"
import type { SeethingSwarmRuntimeCharacterClip } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { ValueId } from "@game/data/src/Value"
import type {
  SeethingSwarmBattleClipRole,
  SeethingSwarmBattleClipSelection,
  SeethingSwarmBattleClipSelections,
  SeethingSwarmLicensedBattleCombatant,
} from "./SeethingSwarmBattleChoreography"
import type { SeethingSwarmBattleExchangeCue } from "./SeethingSwarmBattleExchange"

const BATTLE_INTRODUCTION_ROLES = Object.freeze([
  "entry",
  "anticipation",
  "rest",
] as const)
const BATTLE_ATTENTION_ROLES = Object.freeze(["anticipation", "rest"] as const)

export type SeethingSwarmBattlePlaybackStep<PlatformAsset> = Omit<
  SeethingSwarmBattleClipSelection<PlatformAsset>,
  "sequence"
> &
  Readonly<{
    playbackMode: SeethingSwarmAnimalPlaybackMode
    frameDurationMs: number
    blocksResult: boolean
    startFrame: number
    endFrame: number
    facesAway: boolean
  }>

export function getSeethingSwarmBattleClips<PlatformAsset>(
  combatant: SeethingSwarmLicensedBattleCombatant<PlatformAsset>,
) {
  const clipsById = new Map<
    string,
    SeethingSwarmRuntimeCharacterClip<PlatformAsset>
  >()
  for (const selection of Object.values(combatant.clips)) {
    for (const clip of selection.sequence) clipsById.set(clip.animationId, clip)
  }
  clipsById.set(combatant.locomotion.animationId, combatant.locomotion)
  return Object.freeze([...clipsById.values()])
}

export function createSeethingSwarmBattlePlayback<PlatformAsset>({
  combatant,
  winnerId,
  cue,
}: {
  readonly combatant: SeethingSwarmLicensedBattleCombatant<PlatformAsset>
  readonly winnerId: ValueId | null
  readonly cue: SeethingSwarmBattleExchangeCue
}): readonly SeethingSwarmBattlePlaybackStep<PlatformAsset>[] {
  const isWinner = combatant.valueId === winnerId
  if (isWinner && (cue === "approach" || cue === "recovery")) {
    const clip = combatant.locomotion
    return [
      {
        role: "attack",
        semanticFamily: "entry-exit",
        clip,
        playbackMode: "one-shot",
        frameDurationMs: SEETHING_SWARM_BATTLE_FRAME_DURATION_MS,
        blocksResult: true,
        startFrame: 0,
        endFrame: clip.frameCount,
        facesAway: cue === "recovery",
      },
    ]
  }
  const roles: readonly SeethingSwarmBattleClipRole[] =
    cue === "introduction"
      ? BATTLE_INTRODUCTION_ROLES
      : cue === "attention"
        ? BATTLE_ATTENTION_ROLES
        : cue === "strike" && isWinner
          ? ["attack"]
          : cue === "impact"
            ? isWinner
              ? ["attack"]
              : ["reaction"]
            : cue === "settled" && isWinner
              ? ["flourish", "rest"]
              : ["rest"]

  const steps = createPlaybackSteps(combatant.clips, roles, cue, combatant.locomotion.animationId)
  return steps.length
    ? steps
    : createPlaybackSteps(combatant.clips, ["rest"], "rest")
}

export function createSeethingSwarmAttentionPlayback<PlatformAsset>(
  selections: Pick<
    SeethingSwarmBattleClipSelections<PlatformAsset>,
    "anticipation" | "rest"
  >,
) {
  return createPlaybackSteps(selections, BATTLE_ATTENTION_ROLES, "attention")
}

function createPlaybackSteps<
  PlatformAsset,
  Role extends SeethingSwarmBattleClipRole,
>(
  selections: Readonly<
    Record<Role, SeethingSwarmBattleClipSelection<PlatformAsset>>
  > &
    Pick<SeethingSwarmBattleClipSelections<PlatformAsset>, "rest">,
  roles: readonly Role[],
  cue: SeethingSwarmBattleExchangeCue,
  playedLocomotion?: string,
) {
  const steps: SeethingSwarmBattlePlaybackStep<PlatformAsset>[] = []
  for (const role of roles) {
    const selection = selections[role]
    const contactIndex = selection.sequence.findIndex(
      (clip) => clip.animationId === selection.clip.animationId,
    )
    const contact =
      role === "attack"
        ? resolveSeethingSwarmAttackContact(selection.clip)
        : null
    const sequence =
      role === "attack"
        ? cue === "impact"
          ? selection.sequence.slice(contactIndex + (contact ? 0 : 1))
          : selection.sequence.slice(0, contactIndex + 1).filter((clip) => clip.animationId !== playedLocomotion)
        : selection.sequence
    const roleBlocksResult =
      role === "attack" || (cue === "impact" && role === "reaction")
    sequence.forEach((clip, index) => {
      if (
        cue === "attention" &&
        role !== "rest" &&
        clip === selections.rest.clip
      )
        return
      const returnsToRest =
        selection.sequence.length > 1 && clip === selections.rest.clip
      const blocksResult = roleBlocksResult && !returnsToRest
      const isStrikeClip = role === "attack" && clip === selection.clip
      const startFrame =
        isStrikeClip && cue === "impact" && contact ? contact.frameIndex : 0
      const endFrame =
        isStrikeClip && cue === "strike" && contact
          ? contact.frameIndex
          : clip.frameCount
      const playbackMode =
        role === "rest" && index === sequence.length - 1 ? "loop" : "one-shot"
      const previous = steps.at(-1)
      if (
        previous?.clip.animationId === clip.animationId &&
        previous.playbackMode === playbackMode &&
        previous.blocksResult === blocksResult
      )
        return
      steps.push(
        Object.freeze({
          role,
          semanticFamily: selection.semanticFamily,
          clip,
          playbackMode,
          frameDurationMs:
            role === "rest" || role === "entry" || returnsToRest
              ? SEETHING_SWARM_CALM_FRAME_DURATION_MS
              : cue === "attention" || cue === "introduction"
                ? SEETHING_SWARM_ATTENTION_FRAME_DURATION_MS
                : SEETHING_SWARM_BATTLE_FRAME_DURATION_MS,
          blocksResult,
          startFrame,
          endFrame,
          facesAway: isStrikeClip && (contact?.facesAway ?? false),
        }),
      )
    })
  }
  return Object.freeze(steps)
}
