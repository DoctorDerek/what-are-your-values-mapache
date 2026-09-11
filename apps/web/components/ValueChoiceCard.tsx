"use client"

import {
  getValueDisplayDefinition,
  getValueDisplayName,
  type ActiveValueDefinition,
  type ValueId,
} from "@game/data/src/Value"
import { getValueChoiceAccessibilityLabel } from "@game/machines/src/BattleAccessibilityPresentation"
import type { BattleRewardPresentation } from "@game/machines/src/BattleRewardPresentation"
import {
  forwardRef,
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

export type ValueChoicePosition = "first" | "second"

type ValueChoiceCardProps = {
  position: ValueChoicePosition
  value: ActiveValueDefinition
  level: number
  winnerId: ValueId | null
  isEnabled: boolean
  isAnimating: boolean
  controlHint: string | null
  combatant?: (isAttended: boolean, reward?: ReactNode) => ReactNode
  reward?: BattleRewardPresentation | null
  onActivate: (valueId: ValueId) => void
  onFocus: (valueId: ValueId) => void
}

export const ValueChoiceCard = forwardRef<
  HTMLButtonElement,
  ValueChoiceCardProps
>(function ValueChoiceCard(
  {
    position,
    value,
    level,
    winnerId,
    isEnabled,
    isAnimating,
    controlHint,
    combatant,
    reward,
    onActivate,
    onFocus,
  },
  ref,
) {
  const isFirst = position === "first"
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const displayName = getValueDisplayName(value)
  const isWinner = isAnimating && winnerId === value.id
  const positionClasses = isFirst
    ? "bg-mapache-vivid-primary-cyan col-start-1 border-r-8 border-black"
    : "bg-mapache-vivid-primary-raspberry col-start-2"
  const controlHintContrastClasses = isFirst
    ? "text-black drop-shadow-[1px_1px_0px_#ffffff]"
    : "text-white drop-shadow-[1px_1px_0px_#000000]"
  const reservedControlHint = isFirst ? "[1 / A]" : "[2 / D]"
  const accessibleDefinitionId = useId()
  const choiceId = useId()
  const rewardStyle: CSSProperties & { "--reward-progress": string } = {
    "--reward-progress": `${reward?.progressPercentage ?? 0}%`,
  }

  return (
    <div
      data-value-card={value.id}
      onFocus={() => {
        setIsFocused(true)
        onFocus(value.id)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsFocused(false)
      }}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") setIsHovered(true)
      }}
      onPointerLeave={() => setIsHovered(false)}
      onPointerCancel={() => setIsHovered(false)}
      className="group/choice contents [--choice-focus-width:8px]"
    >
      <div
        className={`${positionClasses} relative row-start-1 flex min-h-0 min-w-0 flex-col items-center`}
      >
        <span
          aria-hidden="true"
          data-card-focus-outline="value"
          className={`pointer-events-none absolute inset-0 z-40 hidden border-x-(length:--choice-focus-width) border-white group-has-[button:enabled:focus]/choice:block ${isFirst ? "-right-[8px]" : ""} ${combatant ? "border-t-(length:--choice-focus-width)" : "border-y-(length:--choice-focus-width)"}`}
        />
        <button
          ref={ref}
          id={choiceId}
          type="button"
          aria-label={getValueChoiceAccessibilityLabel({
            position,
            value,
            level,
          })}
          aria-describedby={accessibleDefinitionId}
          disabled={!isEnabled}
          onClick={() => onActivate(value.id)}
          className="flex w-full min-w-0 flex-1 cursor-pointer flex-col justify-start px-[min(0.75rem,8%)] pt-[clamp(2rem,10vh,6rem)] text-center outline-none after:absolute after:inset-0 disabled:cursor-default xl:px-8"
        >
          <div className="w-full">
            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 xl:gap-5">
              <span
                aria-hidden="true"
                className={`w-16 max-w-full min-w-0 text-center text-sm font-black [overflow-wrap:anywhere] uppercase xl:w-28 xl:text-2xl ${controlHintContrastClasses} ${controlHint ? "" : "invisible"}`}
              >
                {controlHint ?? reservedControlHint}
              </span>
              <h2
                className={`order-first mx-auto w-full max-w-4xl min-w-0 text-[clamp(1.5rem,5vw,2.5rem)] leading-tight font-black [overflow-wrap:anywhere] break-words hyphens-auto text-white uppercase drop-shadow-[4px_4px_0px_#000000] xl:text-[clamp(2rem,3.25vw,4rem)] xl:drop-shadow-[6px_6px_0px_#000000] ${isFirst ? "[anchor-name:--battle-first-value]" : "[anchor-name:--battle-second-value]"}`}
              >
                {displayName}
              </h2>
              <span className="inline-block max-w-full min-w-0 border-2 border-black bg-white px-2 py-1 text-sm font-black [overflow-wrap:anywhere] text-black shadow-[3px_3px_0px_0px_#000000] xl:border-4 xl:px-4 xl:py-2 xl:text-2xl xl:shadow-[6px_6px_0px_0px_#000000]">
                Level {level}
              </span>
            </div>
            <p
              id={accessibleDefinitionId}
              className="mx-auto mt-3 max-w-2xl border-2 border-white/20 bg-black/40 px-[min(0.75rem,8%)] py-3 text-[clamp(1rem,2.8vw,1.5rem)] leading-snug font-bold [overflow-wrap:anywhere] break-words hyphens-auto whitespace-pre-wrap text-white drop-shadow-[2px_2px_0px_#000000] xl:mt-6 xl:p-6 xl:text-[clamp(1.25rem,2vw,1.875rem)] xl:leading-relaxed"
            >
              “{getValueDisplayDefinition(value)}”
            </p>
          </div>
        </button>
      </div>
      {combatant ? (
        <label
          data-battle-arena-side={position}
          htmlFor={choiceId}
          aria-hidden="true"
          className={`@container relative row-start-2 flex min-w-0 items-start justify-center pt-2 pb-12 ${isEnabled ? "cursor-pointer" : "cursor-default"} ${isWinner ? "z-30" : "z-20"} ${isFirst ? "bg-mapache-vivid-primary-cyan col-start-1 after:absolute after:inset-y-0 after:right-0 after:w-2 after:bg-black" : "bg-mapache-vivid-primary-raspberry col-start-2"}`}
        >
          <span
            aria-hidden="true"
            data-card-focus-outline="animal"
            className="pointer-events-none absolute inset-0 z-40 hidden border-x-(length:--choice-focus-width) border-b-(length:--choice-focus-width) border-white group-has-[button:enabled:focus]/choice:block"
          />
          <span className="flex w-(--battle-combatant-size) flex-col items-center">
            {combatant(
              isEnabled && (isHovered || isFocused),
              reward ? (
                <span
                  className="block border-2 border-black bg-white px-1 text-center text-xs leading-4 font-black whitespace-nowrap text-black xl:text-base"
                  title={reward.progressLabel}
                >
                  {reward.label}
                  <span className="block h-1 overflow-hidden bg-black/15">
                    <span
                      className="bg-mapache-vivid-primary-raspberry block h-full w-(--reward-progress)"
                      style={rewardStyle}
                    />
                  </span>
                </span>
              ) : null,
            )}
          </span>
        </label>
      ) : null}
    </div>
  )
})
