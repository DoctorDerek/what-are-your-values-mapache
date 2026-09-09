import { playerDataRecoveryCopy } from "@game/machines/src/PlayerDataRecoveryCopy"
import { View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"

export default function NativePlayerDataLoading() {
  return (
    <MapacheScreen
      accessible
      accessibilityLabel={playerDataRecoveryCopy.loading}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      className="items-center justify-center px-6"
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="flex-row gap-2"
      >
        <View className="bg-mapache-vivid-primary-cyan size-6 border-2 border-black" />
        <View className="bg-mapache-vivid-primary-orange size-6 border-2 border-black" />
        <View className="bg-mapache-vivid-primary-raspberry size-6 border-2 border-black" />
      </View>
    </MapacheScreen>
  )
}
