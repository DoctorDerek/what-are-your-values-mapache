import type { BattleAnimationSpeed } from "@game/machines/src/BattleAnimationSpeed"
import BattleSpeedControl from "@/components/BattleSpeedControl"
import { cn } from "@/lib/utils"

function BattleActionLabel({
  label,
  shortcut,
  showKeyboardControlHints,
}: {
  label: string
  shortcut: string
  showKeyboardControlHints: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className="inline-grid items-center justify-items-center"
    >
      <span
        className={cn(
          "col-start-1 row-start-1",
          showKeyboardControlHints ? "xl:invisible" : "",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "col-start-1 row-start-1 hidden xl:inline",
          showKeyboardControlHints ? "" : "invisible",
        )}
      >
        {label} <span>{shortcut}</span>
      </span>
    </span>
  )
}

export default function BattleActionBar({
  animationSpeed,
  canChangeAnimationSpeed,
  onAnimationSpeedChange,
  canOpenMenu,
  canUndo,
  canRedo,
  canStop,
  showKeyboardControlHints,
  onOpenMenu,
  onUndo,
  onRedo,
  onStop,
}: {
  animationSpeed: BattleAnimationSpeed
  canChangeAnimationSpeed: boolean
  onAnimationSpeedChange: (speed: BattleAnimationSpeed) => void
  canOpenMenu: boolean
  canUndo: boolean
  canRedo: boolean
  canStop: boolean
  showKeyboardControlHints: boolean
  onOpenMenu: () => void
  onUndo: () => void
  onRedo: () => void
  onStop: () => void
}) {
  const historyActionClasses =
    "min-h-12 min-w-max flex-1 cursor-pointer border-4 border-black bg-white px-2 py-2 text-sm font-black text-black uppercase shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white active:shadow-[inset_0_2px_5px_#0006] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-[4px_4px_0px_0px_#000000] xl:px-5 xl:py-3 xl:text-xl"

  return (
    <nav
      aria-label="Battle actions"
      className="pointer-events-auto relative z-50 mx-auto flex max-h-[60dvh] w-full max-w-3xl shrink-0 flex-col gap-3 overflow-y-auto overscroll-contain p-3 pb-6 xl:gap-4 xl:px-6"
    >
      <div className="flex w-full flex-wrap gap-2 xl:gap-4">
        <button
          type="button"
          aria-label="Menu"
          disabled={!canOpenMenu}
          onClick={onOpenMenu}
          className={historyActionClasses}
        >
          <BattleActionLabel
            label="Menu"
            shortcut="[ESC]"
            showKeyboardControlHints={showKeyboardControlHints}
          />
        </button>
        <button
          type="button"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={onUndo}
          className={historyActionClasses}
        >
          <BattleActionLabel
            label="Undo"
            shortcut="[Z]"
            showKeyboardControlHints={showKeyboardControlHints}
          />
        </button>
        <button
          type="button"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={onRedo}
          className={historyActionClasses}
        >
          <BattleActionLabel
            label="Redo"
            shortcut="[Y]"
            showKeyboardControlHints={showKeyboardControlHints}
          />
        </button>
        <button
          type="button"
          aria-label="Stop"
          disabled={!canStop}
          onClick={onStop}
          className="bg-mapache-vivid-secondary-red min-h-12 min-w-max flex-1 cursor-pointer border-4 border-black px-2 py-2 text-sm font-black text-black uppercase shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white active:shadow-[inset_0_2px_5px_#0006] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-[4px_4px_0px_0px_#000000] xl:px-5 xl:py-3 xl:text-xl"
        >
          Stop
        </button>
      </div>
      <div className="mx-auto w-max max-w-full">
        <BattleSpeedControl
          speed={animationSpeed}
          disabled={!canChangeAnimationSpeed}
          onChange={onAnimationSpeedChange}
        />
      </div>
    </nav>
  )
}
