import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import {
  Alignment,
  Fit,
  RiveView,
  useRive,
  useRiveFile,
} from "@rive-app/react-native"
import { useEffect } from "react"
import { withUniwind } from "uniwind"

const StyledRiveView = withUniwind(RiveView)
const iceCreamAsset: number = require("@game/data/assets/mapachito/ice-cream.riv")

export default function NativeMapachitoIceCream({
  onStarted,
  onUnavailable,
}: Readonly<{ onStarted: () => void; onUnavailable: () => void }>) {
  const { riveFile, error } = useRiveFile(iceCreamAsset)
  const { riveViewRef, setHybridRef } = useRive()
  useEffect(() => {
    if (error || riveViewRef === null) onUnavailable()
  }, [error, riveViewRef, onUnavailable])
  useEffect(() => {
    if (!riveViewRef) return
    let isMounted = true
    void riveViewRef
      .play()
      .then(() => {
        if (isMounted) onStarted()
      })
      .catch(() => {
        if (isMounted) onUnavailable()
      })
    return () => {
      isMounted = false
    }
  }, [riveViewRef, onStarted, onUnavailable])
  if (!riveFile) return null
  return (
    <StyledRiveView
      file={riveFile}
      hybridRef={setHybridRef}
      stateMachineName={FIRST_ARRIVAL_PRESENTATION.stateMachineName}
      autoPlay={false}
      fit={Fit.Cover}
      alignment={Alignment.Center}
      className="h-full w-full"
      onError={onUnavailable}
    />
  )
}
