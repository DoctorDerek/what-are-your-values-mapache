import {
  createSeethingSwarmStageGeometry,
  SEETHING_SWARM_BATTLE_RESULT_DURATION_MS,
} from "@game/data/src/SeethingSwarmAnimalPresentation"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import type { ValueId } from "@game/data/src/Value"
import type { ZooAnimalId } from "@game/data/src/ZooAnimals"
import type { PresentedBattle } from "@game/machines/src/CombatMachine"
import {
  type SeethingSwarmBattleChoreography,
  type SeethingSwarmBattleCombatantSide,
} from "@game/machines/src/SeethingSwarmBattleChoreography"
import {
  requiresSeethingSwarmReturnTravel,
  resolveSeethingSwarmPlaceholderRole,
  resolveSeethingSwarmTravelDuration,
  type SeethingSwarmBattleExchangeCue,
} from "@game/machines/src/SeethingSwarmBattleExchange"
import type { SeethingSwarmVariedRole } from "@game/machines/src/SeethingSwarmBattleVariation"
import type { StaticImageData } from "next/image"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react"
import { usePreparedSeethingSwarmBattle } from "@/components/SeethingSwarmAssetPreparation"
import { useSeethingSwarmActiveBattle } from "@/components/SeethingSwarmBattleVariation"
import SeethingSwarmCombatant from "@/components/SeethingSwarmCombatant"
import SeethingSwarmPlaceholder from "@/components/SeethingSwarmPlaceholder"

type SeethingSwarmBattleStageStyle = CSSProperties & {
  "--battle-result-duration": string
  "--battle-approach-duration": string
  "--battle-tile-size": string
  "--battle-visible-height": string
  "--battle-below-anchor": string
}

function subscribeToDocumentVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}

function getIsDocumentHidden() {
  return document.visibilityState === "hidden"
}

function getServerIsDocumentHidden() {
  return false
}

function BattlePlayback({
  choreography,
  winnerId,
  isNextBattleReady,
  shouldReduceMotion,
  onResultComplete,
  onRoleEntered,
  children,
}: {
  choreography: SeethingSwarmBattleChoreography<StaticImageData>
  winnerId: ValueId | null
  isNextBattleReady: boolean
  shouldReduceMotion: boolean
  onResultComplete: () => void
  onRoleEntered: (animalId: ZooAnimalId, role: SeethingSwarmVariedRole) => void
  children: (combatants: {
    first: (isAttended: boolean, reward?: ReactNode) => ReactNode
    second: (isAttended: boolean, reward?: ReactNode) => ReactNode
  }) => ReactNode
}) {
  const [resultCue, setResultCue] =
    useState<SeethingSwarmBattleExchangeCue>("approach")
  const [readySides, setReadySides] = useState<
    ReadonlyMap<SeethingSwarmBattleCombatantSide, boolean>
  >(() => new Map())
  const battleVisibilityRef = useRef<HTMLDivElement>(null)
  const cue = winnerId ? resultCue : "introduction"
  const winnerSide = choreography.combatants.find(
    (combatant) => combatant.valueId === winnerId,
  )?.side
  const canWinnerTravel =
    winnerSide !== undefined && readySides.get(winnerSide) === true
  useEffect(() => {
    if (
      winnerSide &&
      readySides.size === 2 &&
      !canWinnerTravel &&
      cue === "approach"
    )
      setResultCue("strike")
  }, [winnerSide, readySides.size, canWinnerTravel, cue])
  const completedSidesRef = useRef(new Set<SeethingSwarmBattleCombatantSide>())
  const hasReportedResultRef = useRef(false)
  const hasFinishedPlaybackRef = useRef(false)
  const reportResult = useCallback(() => {
    if (!winnerId || !isNextBattleReady || hasReportedResultRef.current) return
    if (!shouldReduceMotion && !hasFinishedPlaybackRef.current) return
    hasReportedResultRef.current = true
    onResultComplete()
  }, [isNextBattleReady, onResultComplete, shouldReduceMotion, winnerId])

  useEffect(() => reportResult(), [reportResult])

  useLayoutEffect(() => {
    if (winnerId && !shouldReduceMotion && readySides.size === 2)
      battleVisibilityRef.current?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      })
  }, [isNextBattleReady, readySides.size, shouldReduceMotion, winnerId])

  const handlePlaybackComplete = (side: SeethingSwarmBattleCombatantSide) => {
    if (cue === "strike") {
      if (
        choreography.combatants.find((combatant) => combatant.side === side)
          ?.valueId === winnerId
      )
        setResultCue("impact")
      return
    }
    if (cue !== "impact") return
    completedSidesRef.current.add(side)
    if (completedSidesRef.current.size !== 2) return
    if (
      canWinnerTravel &&
      requiresSeethingSwarmReturnTravel(choreography, winnerId)
    ) {
      setResultCue("recovery")
      return
    }
    hasFinishedPlaybackRef.current = true
    setResultCue("settled")
    reportResult()
  }

  const handleTravelComplete = () => {
    if (cue === "approach") setResultCue("strike")
    if (cue === "recovery") {
      hasFinishedPlaybackRef.current = true
      setResultCue("settled")
      reportResult()
    }
  }

  const handleReady = (
    side: SeethingSwarmBattleCombatantSide,
    canPlaySequence = true,
  ) => {
    if (cue !== "approach" && canPlaySequence) return
    setReadySides((previous) =>
      previous.get(side) === canPlaySequence
        ? previous
        : new Map([...previous, [side, canPlaySequence]]),
    )
  }

  const combatants = choreography.combatants.map(
    (combatant) =>
      function renderCardCombatant(isAttended: boolean, reward?: ReactNode) {
        const combatantStyle: CSSProperties & {
          "--combatant-below-anchor": string
        } = {
          "--combatant-below-anchor": `${"geometry" in combatant ? combatant.geometry.height - combatant.geometry.anchorY : 0}px`,
        }
        return (
          <div
            aria-hidden="true"
            key={combatant.side}
            ref={combatant.side === "first" ? battleVisibilityRef : undefined}
            className="pointer-events-none relative z-10 flex h-(--battle-visible-size) w-(--battle-combatant-size) shrink-0 scroll-mt-16 scroll-mb-2 items-end justify-center"
            data-animal-id={combatant.animalId}
            data-combatant-side={combatant.side}
            data-value-id={combatant.valueId}
            data-battle-cue={cue}
          >
            <div
              className={`relative flex h-(--battle-visible-size) w-(--battle-combatant-size) shrink-0 items-end justify-center ${combatant.side === "first" ? "[--battle-travel-direction:1]" : "[--battle-travel-direction:-1]"} ${!shouldReduceMotion && canWinnerTravel && combatant.valueId === winnerId && readySides.size === 2 && cue !== "settled" ? (cue === "recovery" ? "animate-seething-swarm-return" : "animate-seething-swarm-approach") : ""}`}
              data-combatant-traveler={combatant.side}
              onAnimationEnd={(event) => {
                if (
                  event.target === event.currentTarget &&
                  ((event.animationName === "seething-swarm-approach" &&
                    cue === "approach") ||
                    (event.animationName === "seething-swarm-return" &&
                      cue === "recovery")) &&
                  combatant.valueId === winnerId
                )
                  handleTravelComplete()
              }}
            >
              {reward ? (
                <span className="absolute top-full left-1/2 z-10 w-max -translate-x-1/2 pt-1">
                  {reward}
                </span>
              ) : null}
              <span
                className="relative flex shrink-0 items-end justify-center pb-[calc(var(--battle-below-anchor)-var(--combatant-below-anchor))]"
                style={combatantStyle}
              >
                {"clips" in combatant ? (
                  <SeethingSwarmCombatant
                    combatant={combatant}
                    isAttended={isAttended}
                    winnerId={winnerId}
                    cue={cue}
                    shouldReduceMotion={shouldReduceMotion}
                    isTravelReady={readySides.size === 2}
                    onPlaybackComplete={() =>
                      handlePlaybackComplete(combatant.side)
                    }
                    onRoleEntered={onRoleEntered}
                    onReady={(canPlaySequence) =>
                      handleReady(combatant.side, canPlaySequence)
                    }
                  />
                ) : (
                  <SeethingSwarmPlaceholder
                    key={cue}
                    side={combatant.side}
                    role={resolveSeethingSwarmPlaceholderRole(
                      cue,
                      winnerId === combatant.valueId,
                    )}
                    shouldReduceMotion={shouldReduceMotion}
                    onPlaybackComplete={() =>
                      handlePlaybackComplete(combatant.side)
                    }
                    onReady={() => handleReady(combatant.side)}
                  />
                )}
              </span>
            </div>
          </div>
        )
      },
  )
  return children({ first: combatants[0], second: combatants[1] })
}

export default function SeethingSwarmBattleStage({
  battle,
  pendingBattle = null,
  isNextBattleReady,
  isPaused = false,
  runtimeClipCatalog,
  shouldReduceMotion,
  winnerId,
  onResultAnimationComplete,
  children,
}: {
  battle: PresentedBattle
  pendingBattle?: PresentedBattle | null
  isNextBattleReady: boolean
  isPaused?: boolean
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  winnerId: ValueId | null
  onResultAnimationComplete: () => void
  children: (combatants: {
    first: (isAttended: boolean, reward?: ReactNode) => ReactNode
    second: (isAttended: boolean, reward?: ReactNode) => ReactNode
  }) => ReactNode
}) {
  const isDocumentHidden = useSyncExternalStore(
    subscribeToDocumentVisibility,
    getIsDocumentHidden,
    getServerIsDocumentHidden,
  )
  const { choreography, onRoleEntered } = useSeethingSwarmActiveBattle(
    battle,
    runtimeClipCatalog,
  )
  usePreparedSeethingSwarmBattle(battle, runtimeClipCatalog)
  usePreparedSeethingSwarmBattle(pendingBattle, runtimeClipCatalog)
  const stageGeometry = createSeethingSwarmStageGeometry(
    choreography.combatants.map((combatant) =>
      "geometry" in combatant ? combatant.geometry : null,
    ),
  )
  const stageStyle: SeethingSwarmBattleStageStyle = {
    "--battle-result-duration": `${SEETHING_SWARM_BATTLE_RESULT_DURATION_MS}ms`,
    "--battle-approach-duration": `${resolveSeethingSwarmTravelDuration(choreography, winnerId)}ms`,
    "--battle-tile-size": `${stageGeometry.width}px`,
    "--battle-below-anchor": `${stageGeometry.belowAnchor}px`,
    "--battle-visible-height": `${stageGeometry.height}px`,
  }

  return (
    <div
      className="relative grid min-h-min min-w-0 flex-1 grid-cols-2 grid-rows-[max-content_minmax(max-content,1fr)] [--battle-combatant-size:var(--battle-tile-size)] [--battle-visible-size:var(--battle-visible-height)]"
      data-battle-stage-mode={choreography.mode}
      data-battle-stage-state={winnerId ? "resolving" : "awaiting-input"}
      data-choreography-identity={choreography.choreographyIdentity}
      style={stageStyle}
    >
      <BattlePlayback
        key={choreography.choreographyIdentity}
        choreography={choreography}
        winnerId={winnerId}
        isNextBattleReady={isNextBattleReady}
        shouldReduceMotion={shouldReduceMotion || isPaused || isDocumentHidden}
        onResultComplete={onResultAnimationComplete}
        onRoleEntered={onRoleEntered}
      >
        {children}
      </BattlePlayback>
    </div>
  )
}
