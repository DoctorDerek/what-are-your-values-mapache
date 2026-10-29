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
      className="w-full max-w-3xl shrink-0 gap-[min(8px,max(4px,calc(100vh-440px)))] self-center px-3 pt-[min(12px,max(4px,calc(100vh-440px)))] pb-[min(24px,max(12px,calc(100vh-440px)))] xl:gap-4 xl:px-6"
    >
      <View className="min-w-0 flex-row flex-wrap gap-2 xl:gap-4">
        <Button
          accessibilityLabel={localizedCopy.interfaceCopy.controlActions.menu}
          className="grow basis-auto"
          disabled={!canOpenMenu}
          size="battle"
          variant="secondary"
          onPress={onOpenMenu}
        >
          <Text>{localizedCopy.interfaceCopy.controlActions.menu}</Text>
        </Button>
        <Button
          accessibilityLabel={localizedCopy.interfaceCopy.controlActions.redo}
          className="grow basis-auto"
          disabled={!canRedo}
          size="battle"
          variant="outline"
          onPress={onRedo}
        >
          <Text>{localizedCopy.interfaceCopy.controlActions.redo}</Text>
        </Button>
        <Button
          accessibilityLabel={localizedCopy.interfaceCopy.controlActions.undo}
          className="grow basis-auto"
          disabled={!canUndo}
          size="battle"
          variant="outline"
          onPress={onUndo}
        >
          <Text>{localizedCopy.interfaceCopy.controlActions.undo}</Text>
        </Button>
      </View>
      <View className="min-w-0 flex-row flex-wrap items-stretch gap-2 xl:gap-4">
        <NativeBattleSpeedControl
          speed={animationSpeed}
          disabled={!canChangeAnimationSpeed}
          onChange={onAnimationSpeedChange}
        />
        <Button
          accessibilityLabel={localizedCopy.interfaceCopy.controlActions.stop}
          className="grow basis-auto"
          disabled={!canStop}
          size="battle"
          variant="destructive"
          onPress={onStop}
        >
          <Text>{localizedCopy.interfaceCopy.controlActions.stop}</Text>
        </Button>
      </View>
    </View>
  )
}
