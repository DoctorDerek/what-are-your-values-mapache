import { useRef, useState, type FocusEvent, type PointerEvent } from "react"

const ANIMAL_TAP_MOVEMENT_TOLERANCE_PX = 8

export default function useAnimalAttentionInput() {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isTapped, setIsTapped] = useState(false)
  const lastPointerType = useRef<string | null>(null)
  const pendingTap = useRef<{ pointerId: number; x: number; y: number } | null>(
    null,
  )

  return {
    isAttended: isHovered || isFocused || isTapped,
    attentionHandlers: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch") setIsHovered(true)
      },
      onPointerLeave: () => setIsHovered(false),
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        lastPointerType.current = event.pointerType
        if (event.pointerType !== "touch") return
        setIsTapped(false)
        setIsFocused(false)
        pendingTap.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        }
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        const tap = pendingTap.current
        if (
          tap &&
          Math.hypot(event.clientX - tap.x, event.clientY - tap.y) >
            ANIMAL_TAP_MOVEMENT_TOLERANCE_PX
        )
          pendingTap.current = null
      },
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        const tap = pendingTap.current
        if (
          tap?.pointerId === event.pointerId &&
          Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <=
            ANIMAL_TAP_MOVEMENT_TOLERANCE_PX
        )
          setIsTapped(true)
        pendingTap.current = null
      },
      onPointerCancel: () => {
        pendingTap.current = null
        setIsHovered(false)
        setIsTapped(false)
      },
      onKeyDown: () => {
        lastPointerType.current = null
        setIsFocused(true)
      },
      onFocus: () => {
        if (lastPointerType.current !== "touch") setIsFocused(true)
      },
      onBlur: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocused(false)
          setIsTapped(false)
        }
      },
    },
  }
}
