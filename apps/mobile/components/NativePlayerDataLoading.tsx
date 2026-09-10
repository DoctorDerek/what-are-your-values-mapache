import { STARTUP_INDICATOR_DELAY_MS } from "@game/data/src/PresentationLoadingCopy"
import { playerDataRecoveryCopy } from "@game/machines/src/PlayerDataRecoveryCopy"
import { useEffect, useState } from "react"
import { View } from "react-native"
import MapacheScreen from "@/components/MapacheScreen"

export default function NativePlayerDataLoading() {
  const [showIndicator, setShowIndicator] = useState(false)
  useEffect(() => {
    const delay = setTimeout(
      () => setShowIndicator(true),
      STARTUP_INDICATOR_DELAY_MS,
    )
    return () => clearTimeout(delay)
  }, [])
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
        className={`flex-row gap-2 ${showIndicator ? "opacity-100" : "opacity-0"}`}
      >
        <View className="bg-mapache-vivid-primary-cyan size-6 border-2 border-black" />
        <View className="bg-mapache-vivid-primary-orange size-6 border-2 border-black" />
        <View className="bg-mapache-vivid-primary-raspberry size-6 border-2 border-black" />
      </View>
    </MapacheScreen>
  )
}
