import type {
  ControllerCommand,
  ControllerFamily,
} from "@game/data/src/ControllerControls"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { BattleAnimationSpeed } from "@game/machines/src/BattleAnimationSpeed"
import { cx } from "classix"
import BattleSpeedControl from "@/components/BattleSpeedControl"
import ControllerPrompt from "@/components/ControllerPrompt"

function BattleActionLabel({
  label,
  shortcut,
  showKeyboardControlHints,
  controllerFamily,
  command,
}: {
  label: string
  shortcut: string
  showKeyboardControlHints: boolean
  controllerFamily?: ControllerFamily
  command: ControllerCommand
}) {
  if (controllerFamily)
    return (
      <span
        aria-hidden="true"
        className="inline-flex flex-col items-center justify-center gap-1 xl:flex-row"
      >
        <span>{label}</span>
        <ControllerPrompt family={controllerFamily} command={command} />
      </span>
    )
  return (
    <span
      aria-hidden="true"
      className="inline-grid items-center justify-items-center"
    >
      <span
        className={cx(
          "col-start-1 row-start-1",
          showKeyboardControlHints && "xl:invisible",
        )}
      >
        {label}
      </span>
      <span
        className={cx(
          "col-start-1 row-start-1 hidden xl:inline",
          !showKeyboardControlHints && "invisible",
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
  controllerFamily,
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
  controllerFamily?: ControllerFamily
  onOpenMenu: () => void
  onUndo: () => void
  onRedo: () => void
  onStop: () => void
}) {
  const localizedCopy = useLocaleCatalog()

  const historyActionClasses =
    "min-h-12 min-w-max flex-1 cursor-pointer border-4 border-black bg-white px-1 py-2 text-sm font-black text-black uppercase shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white active:shadow-[inset_0_2px_5px_#0006] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-[4px_4px_0px_0px_#000000] xl:px-5 xl:py-3 xl:text-xl"

  return (
    <nav
      aria-label={localizedCopy.interfaceCopy.screen.battleActions}
      className="pointer-events-auto relative z-50 mx-auto flex max-h-[60dvh] w-full max-w-3xl shrink-0 flex-col gap-[clamp(4px,calc(100dvh-440px),0.5rem)] overflow-y-auto overscroll-contain px-2 pt-[clamp(4px,calc(100dvh-440px),0.75rem)] pb-[clamp(12px,calc(100dvh-440px),1.5rem)] xl:gap-4 xl:px-6"
    >
      <div className="flex w-full flex-wrap gap-2 xl:gap-4">
        <button
          type="button"
          aria-label={localizedCopy.interfaceCopy.controlActions.menu}
          disabled={!canOpenMenu}
          onClick={onOpenMenu}
          className={historyActionClasses}
        >
          <BattleActionLabel
            label={localizedCopy.interfaceCopy.controlActions.menu}
            controllerFamily={controllerFamily}
            command="menu"
            shortcut="[ESC]"
            showKeyboardControlHints={showKeyboardControlHints}
          />
        </button>
        <button
          type="button"
          aria-label={localizedCopy.interfaceCopy.controlActions.redo}
          disabled={!canRedo}
          onClick={onRedo}
          className={historyActionClasses}
        >
          <BattleActionLabel
            label={localizedCopy.interfaceCopy.controlActions.redo}
            controllerFamily={controllerFamily}
            command="redo"
            shortcut="[Y]"
            showKeyboardControlHints={showKeyboardControlHints}
          />
        </button>
        <button
          type="button"
          aria-label={localizedCopy.interfaceCopy.controlActions.undo}
          disabled={!canUndo}
          onClick={onUndo}
          className={historyActionClasses}
        >
          <BattleActionLabel
            label={localizedCopy.interfaceCopy.controlActions.undo}
            controllerFamily={controllerFamily}
            command="cancel"
            shortcut="[Z]"
            showKeyboardControlHints={showKeyboardControlHints}
          />
        </button>
      </div>
      <div className="flex w-full flex-wrap items-stretch gap-2 xl:gap-4">
        <BattleSpeedControl
          speed={animationSpeed}
          disabled={!canChangeAnimationSpeed}
          onChange={onAnimationSpeedChange}
        />
        <button
          type="button"
          aria-label={localizedCopy.interfaceCopy.controlActions.stop}
          disabled={!canStop}
          onClick={onStop}
          className="bg-mapache-vivid-secondary-red min-h-12 min-w-max flex-[1_1_max-content] cursor-pointer border-4 border-black px-1 py-2 text-sm font-black whitespace-nowrap text-black uppercase shadow-[4px_4px_0px_0px_#000000] hover:shadow-[6px_6px_0px_0px_#000000] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-white active:shadow-[inset_0_2px_5px_#0006] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-[4px_4px_0px_0px_#000000] xl:px-5 xl:py-3 xl:text-xl"
        >
          {localizedCopy.interfaceCopy.controlActions.stop}
        </button>
      </div>
    </nav>
  )
}
