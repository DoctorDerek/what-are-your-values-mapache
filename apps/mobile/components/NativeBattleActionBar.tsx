import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { BattleAnimationSpeed } from "@game/machines/src/BattleAnimationSpeed"
import { View } from "react-native"
import NativeBattleSpeedControl from "@/components/NativeBattleSpeedControl"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeBattleActionBar({
  animationSpeed,
  canChangeAnimationSpeed,
  onAnimationSpeedChange,
  canOpenMenu,
  canUndo,
  canRedo,
  canStop,
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
  onOpenMenu: () => void
  onUndo: () => void
  onRedo: () => void
  onStop: () => void
}) {
  const localizedCopy = useLocaleCatalog()

  return (
    <View
      accessibilityLabel={localizedCopy.interfaceCopy.screen.battleActions}
      className="w-full max-w-3xl shrink-0 gap-3 self-center p-3 pb-6 xl:gap-4 xl:px-6"
    >
      <View className="min-w-0 flex-row gap-2 xl:gap-4">
        <Button
          accessibilityLabel={localizedCopy.interfaceCopy.controlActions.menu}
          className="min-w-0 flex-1"
          disabled={!canOpenMenu}
          size="battle"
          variant="secondary"
          onPress={onOpenMenu}
        >
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
            {localizedCopy.interfaceCopy.controlActions.menu}
          </Text>
        </Button>
        <Button
          accessibilityLabel={localizedCopy.interfaceCopy.controlActions.undo}
          className="min-w-0 flex-1"
          disabled={!canUndo}
          size="battle"
          variant="outline"
          onPress={onUndo}
        >
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
            {localizedCopy.interfaceCopy.controlActions.undo}
          </Text>
        </Button>
        <Button
          accessibilityLabel={localizedCopy.interfaceCopy.controlActions.redo}
          className="min-w-0 flex-1"
          disabled={!canRedo}
          size="battle"
          variant="outline"
          onPress={onRedo}
        >
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
            {localizedCopy.interfaceCopy.controlActions.redo}
          </Text>
        </Button>
        <Button
          accessibilityLabel={localizedCopy.interfaceCopy.controlActions.stop}
          className="min-w-0 flex-1"
          disabled={!canStop}
          size="battle"
          variant="destructive"
          onPress={onStop}
        >
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
            {localizedCopy.interfaceCopy.controlActions.stop}
          </Text>
        </Button>
      </View>
      <NativeBattleSpeedControl
        speed={animationSpeed}
        disabled={!canChangeAnimationSpeed}
        onChange={onAnimationSpeedChange}
      />
    </View>
  )
}
