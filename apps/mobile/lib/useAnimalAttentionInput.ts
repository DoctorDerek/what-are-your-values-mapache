import { useState } from "react"

export default function useAnimalAttentionInput(onAttentionRequest?: () => void) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTapped, setIsTapped] = useState(false)

  return {
    isAttended: isHovered || isTapped,
    attentionHandlers: {
      onHoverIn: () => {
        setIsHovered(true)
        onAttentionRequest?.()
      },
      onHoverOut: () => setIsHovered(false),
      onPressIn: () => setIsTapped(false),
      onPress: () => {
        setIsTapped(true)
        onAttentionRequest?.()
      },
      onFocus: () => onAttentionRequest?.(),
    },
  }
}
