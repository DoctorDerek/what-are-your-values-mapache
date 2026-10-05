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
  return (
    <View
      accessibilityLabel="Battle actions"
      className="w-full max-w-3xl shrink-0 gap-3 self-center p-3 pb-6 xl:gap-4 xl:px-6"
    >
      <View className="min-w-0 flex-row gap-2 xl:gap-4">
        <Button
          accessibilityLabel="Menu"
          className="min-w-0 flex-1"
          disabled={!canOpenMenu}
          size="battle"
          variant="secondary"
          onPress={onOpenMenu}
        >
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
            Menu
          </Text>
        </Button>
        <Button
          accessibilityLabel="Undo"
          className="min-w-0 flex-1"
          disabled={!canUndo}
          size="battle"
          variant="outline"
          onPress={onUndo}
        >
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
            Undo
          </Text>
        </Button>
        <Button
          accessibilityLabel="Redo"
          className="min-w-0 flex-1"
          disabled={!canRedo}
          size="battle"
          variant="outline"
          onPress={onRedo}
        >
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
            Redo
          </Text>
        </Button>
        <Button
          accessibilityLabel="Stop"
          className="min-w-0 flex-1"
          disabled={!canStop}
          size="battle"
          variant="destructive"
          onPress={onStop}
        >
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
            Stop
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
