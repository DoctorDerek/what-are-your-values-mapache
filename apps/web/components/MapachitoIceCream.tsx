"use client"

import { FIRST_ARRIVAL_PRESENTATION } from "@game/data/src/FirstArrivalPresentation"
import {
  Alignment,
  Fit,
  Layout,
  RuntimeLoader,
  useRive,
} from "@rive-app/react-canvas-lite"
import { useRef } from "react"

RuntimeLoader.setWasmUrl(FIRST_ARRIVAL_PRESENTATION.runtimeUrl)
RuntimeLoader.setWasmFallbackUrl(FIRST_ARRIVAL_PRESENTATION.runtimeFallbackUrl)

export default function MapachitoIceCream({
  onStarted,
  onFinished,
}: Readonly<{ onStarted: () => void; onFinished: () => void }>) {
  const hasStarted = useRef(false)
  const { RiveComponent } = useRive({
    src: FIRST_ARRIVAL_PRESENTATION.animationUrl,
    stateMachine: FIRST_ARRIVAL_PRESENTATION.stateMachineName,
    enableRiveAssetCDN: false,
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
    onAdvance: () => {
      if (hasStarted.current) return
      hasStarted.current = true
      onStarted()
    },
    onStop: onFinished,
    onLoadError: onFinished,
  })
  return <RiveComponent className="h-full w-full" />
}
