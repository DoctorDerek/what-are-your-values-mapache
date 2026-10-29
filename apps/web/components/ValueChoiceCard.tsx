"use client"

import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
  type ActiveValueDefinition,
  type ValueId,
} from "@game/data/src/Value"
import { getWrappableValueDisplayName } from "@game/data/src/ValueNameTypography"
import { getValueChoiceAccessibilityLabel } from "@game/machines/src/BattleAccessibilityPresentation"
import type { BattleRewardPresentation } from "@game/machines/src/BattleRewardPresentation"
import { cx } from "classix"
import { forwardRef, useId, useState, type ReactNode } from "react"
import { handleBattleReadingKeyDown } from "@/lib/BattleReadingInput"

export type ValueChoicePosition = "first" | "second"

type ValueChoiceCardProps = {
  position: ValueChoicePosition
  value: ActiveValueDefinition
  level: number
  winnerId: ValueId | null
  isEnabled: boolean
  isAnimating: boolean
  controlHint: ReactNode
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
  const localizedCopy = useLocaleCatalog()
  const isFirst = position === "first"
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const displayName = getValueDisplayName(value, localizedCopy.values)
  const isWinner = isAnimating && winnerId === value.id
  const positionClasses = isFirst
    ? "bg-mapache-vivid-primary-cyan col-start-1 border-r-8 border-black"
    : "bg-mapache-vivid-primary-raspberry col-start-2"
  const controlHintContrastClasses = isFirst
    ? "text-black drop-shadow-[1px_1px_0px_#ffffff]"
    : "text-white drop-shadow-[1px_1px_0px_#000000]"
  const accessibleDefinitionId = useId()
  const choiceId = useId()

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
      <label
        htmlFor={choiceId}
        className={cx(
          positionClasses,
          "relative row-span-4 row-start-1 grid min-h-0 min-w-0 grid-rows-subgrid px-[min(0.75rem,5%)] text-center xl:px-8",
          isEnabled ? "cursor-pointer" : "cursor-default",
        )}
      >
        <button
          ref={ref}
          id={choiceId}
          type="button"
          aria-label={getValueChoiceAccessibilityLabel({
            localization: localizedCopy,
            position,
            value,
            level,
          })}
          aria-describedby={accessibleDefinitionId}
          disabled={!isEnabled}
          onClick={() => onActivate(value.id)}
          className="row-start-2 w-full min-w-0 shrink-0 cursor-pointer self-start text-center outline-none disabled:cursor-default"
        >
          <span
            aria-hidden="true"
            data-card-focus-outline="value"
            className={cx(
              "pointer-events-none absolute inset-0 z-40 hidden border-x-(length:--choice-focus-width) border-white group-has-[button:enabled:focus]/choice:block",
              isFirst && "-right-[8px]",
              combatant
                ? "border-t-(length:--choice-focus-width)"
                : "border-y-(length:--choice-focus-width)",
            )}
          />
          <div className="flow-root w-full min-w-0">
            {controlHint ? (
              <span
                aria-hidden="true"
                className={cx(
                  "float-left max-w-[45%] min-w-0 border-2 border-transparent py-1 pr-2 text-center text-sm font-black [overflow-wrap:anywhere] uppercase xl:border-4 xl:py-2 xl:pr-5 xl:text-2xl",
                  controlHintContrastClasses,
                )}
              >
                {controlHint}
              </span>
            ) : null}
            <span
              className={cx(
                "block w-fit min-w-0 border-2 border-black bg-white px-2 py-1 text-sm font-black [overflow-wrap:anywhere] text-black shadow-[3px_3px_0px_0px_#000000] xl:border-4 xl:px-4 xl:py-2 xl:text-2xl xl:shadow-[6px_6px_0px_0px_#000000]",
                controlHint
                  ? "float-right ml-2 max-w-[55%] xl:ml-5"
                  : "mx-auto max-w-full",
              )}
            >
              {localizedCopy.interfaceCopy.screen.valueLevel(String(level))}
            </span>
            <h2
              aria-label={displayName}
              lang={
                value.kind === "canonical"
                  ? localizedCopy.metadata.languageTag
                  : undefined
              }
              className={cx(
                "mx-auto flow-root w-max max-w-full min-w-[min(100%,12rem)] pt-[clamp(0px,calc(100dvh-430px),0.5rem)] pr-[0.5ch] text-[clamp(1.5rem,min(5vw,7dvh),2.5rem)] leading-tight font-black break-words hyphens-auto text-white drop-shadow-[4px_4px_0px_#000000] [hyphenate-limit-chars:6_3_3] xl:min-w-0 xl:text-[clamp(2rem,3.25vw,4rem)] xl:drop-shadow-[6px_6px_0px_#000000]",
                Boolean(controlHint) && "xl:clear-none xl:pt-0",
              )}
            >
              {getWrappableValueDisplayName(
                value,
                localizedCopy.values,
                localizedCopy.metadata.languageTag,
              )}
            </h2>
          </div>
        </button>
        <p
          id={accessibleDefinitionId}
          tabIndex={0}
          data-controller-scroll
          onKeyDown={handleBattleReadingKeyDown}
          className="row-start-4 mx-auto max-h-full min-h-0 w-full max-w-2xl self-start overflow-y-auto overscroll-contain border-2 border-white/20 bg-black/40 px-[min(0.75rem,3%)] py-[clamp(4px,calc(100dvh-430px),0.5rem)] text-(length:--battle-definition-font-size) leading-snug font-bold [overflow-wrap:anywhere] break-words hyphens-auto whitespace-pre-wrap text-white drop-shadow-[2px_2px_0px_#000000] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white xl:p-6 xl:leading-relaxed"
        >
          “{getValueDisplayDefinition(value, localizedCopy.values)}”
        </p>
      </label>
      {combatant ? (
        <label
          data-battle-arena-side={position}
          htmlFor={choiceId}
          aria-hidden="true"
          className={cx(
            "relative row-span-4 row-start-5 grid min-w-0 grid-rows-subgrid justify-items-center",
            isEnabled ? "cursor-pointer" : "cursor-default",
            isWinner ? "z-30" : "z-20",
            isFirst
              ? "bg-mapache-vivid-primary-cyan col-start-1 after:absolute after:inset-y-0 after:right-0 after:w-2 after:bg-black"
              : "bg-mapache-vivid-primary-raspberry col-start-2",
          )}
        >
          <span className="@container row-start-2 flex w-full flex-col items-center">
            <span
              aria-hidden="true"
              data-card-focus-outline="animal"
              className="pointer-events-none absolute inset-0 z-40 hidden border-x-(length:--choice-focus-width) border-b-(length:--choice-focus-width) border-white group-has-[button:enabled:focus]/choice:block"
            />
            {combatant(
              isEnabled && (isHovered || isFocused),
              reward ? (
                <span className="block border-2 border-black bg-white px-1 text-center text-xs leading-4 font-black whitespace-nowrap text-black xl:text-base">
                  {reward.label}
                </span>
              ) : null,
            )}
          </span>
        </label>
      ) : null}
    </div>
  )
})
