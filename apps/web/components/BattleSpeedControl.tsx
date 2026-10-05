import {
  BATTLE_ANIMATION_SPEED_GROUP_LABEL,
  BATTLE_ANIMATION_SPEED_OPTIONS,
  type BattleAnimationSpeed,
} from "@game/machines/src/BattleAnimationSpeed"
import { cx } from "classix"

export default function BattleSpeedControl({
  speed,
  disabled,
  onChange,
}: {
  speed: BattleAnimationSpeed
  disabled: boolean
  onChange: (speed: BattleAnimationSpeed) => void
}) {
  return (
    <div
      role="group"
      aria-label={BATTLE_ANIMATION_SPEED_GROUP_LABEL}
      onKeyDown={(event) => {
        if (
          [
            " ",
            "Enter",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "1",
            "2",
          ].includes(event.key)
        )
          event.stopPropagation()
      }}
      className="mx-auto flex max-w-full flex-wrap overflow-hidden rounded-lg border-2 border-[#7899a4]"
    >
      {BATTLE_ANIMATION_SPEED_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.accessibleLabel}
          aria-pressed={speed === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cx(
            "focus-visible:outline-mapache-vivid-primary-raspberry inline-grid min-h-12 min-w-13 flex-auto cursor-pointer place-items-center px-3 py-2 text-base font-bold focus-visible:z-10 focus-visible:outline-4 focus-visible:-outline-offset-4 active:shadow-[inset_0_2px_5px_#0006] disabled:cursor-not-allowed disabled:opacity-50",
            speed === option.value
              ? "bg-[#006d7c] text-white underline decoration-3 underline-offset-4 hover:bg-[#005867]"
              : "bg-[#dcedf1] text-[#153844] hover:bg-[#b9e6ec]",
          )}
        >
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
