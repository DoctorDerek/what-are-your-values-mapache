import { useState, type FocusEvent, type PointerEvent } from "react"

export default function useAnimalAttentionInput() {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  return {
    isAttended: isHovered || isFocused,
    attentionHandlers: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") setIsHovered(true)
      },
      onPointerLeave: () => setIsHovered(false),
      onPointerCancel: () => setIsHovered(false),
      onFocus: () => setIsFocused(true),
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setIsFocused(false)
      },
    },
  }
}
