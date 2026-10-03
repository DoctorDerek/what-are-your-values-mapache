"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"

const HISTORY_BOUNDARY_KEY = "wayvmSemanticBackBoundary"

function getHistoryState() {
  const state: unknown = window.history.state
  return typeof state === "object" && state !== null ? state : {}
}

export default function useWebSemanticBack({
  hasParent,
  onBack,
}: {
  hasParent: boolean
  onBack: () => boolean
}) {
  const boundaryIsActive = useRef(false)
  const isRemovingBoundary = useRef(false)
  const [historyRevision, setHistoryRevision] = useState(0)
  const handleBack = useEffectEvent(onBack)

  useEffect(() => {
    const handlePopState = () => {
      if (isRemovingBoundary.current) {
        isRemovingBoundary.current = false
      } else if (boundaryIsActive.current) {
        handleBack()
      }
      boundaryIsActive.current = false
      setHistoryRevision((revision) => revision + 1)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || event.repeat)
        return
      if (handleBack()) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    window.addEventListener("popstate", handlePopState)
    window.addEventListener("keydown", handleEscape, true)
    return () => {
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("keydown", handleEscape, true)
    }
  }, [])

  useEffect(() => {
    if (isRemovingBoundary.current) return
    if (hasParent && !boundaryIsActive.current) {
      const state = getHistoryState()
      if (!(HISTORY_BOUNDARY_KEY in state)) {
        window.history.pushState({ ...state, [HISTORY_BOUNDARY_KEY]: true }, "")
      }
      boundaryIsActive.current = true
    } else if (!hasParent && boundaryIsActive.current) {
      boundaryIsActive.current = false
      isRemovingBoundary.current = true
      window.history.back()
    }
  }, [hasParent, historyRevision])
}
