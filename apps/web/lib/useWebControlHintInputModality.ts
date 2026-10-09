"use client"

import {
  getInitialWebControlHintInputModality,
  type ControlHintInputModality,
} from "@game/machines/src/PlayerSettingsPresentation"
import { useEffect, useEffectEvent, useState } from "react"

const CONTROL_HINT_IGNORED_KEYS: readonly string[] = Object.freeze([
  "Alt",
  "Control",
  "Meta",
  "Shift",
])

export default function useWebControlHintInputModality(
  onActivity?: () => void,
) {
  const handleActivity = useEffectEvent(() => onActivity?.())
  const [inputModality, setInputModality] = useState<ControlHintInputModality>(
    () =>
      getInitialWebControlHintInputModality(
        typeof navigator === "undefined" ? 1 : navigator.maxTouchPoints,
      ),
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!CONTROL_HINT_IGNORED_KEYS.includes(event.key) && !event.repeat) {
        handleActivity()
        setInputModality("keyboard")
      }
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType) handleActivity()
      if (event.pointerType === "mouse") setInputModality("keyboard")
      else if (event.pointerType === "touch" || event.pointerType === "pen")
        setInputModality("touch-pointer")
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("pointerdown", handlePointerDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [])

  return inputModality
}
