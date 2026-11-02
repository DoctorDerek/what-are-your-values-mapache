import {
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react"

const ANIMAL_TAP_MOVEMENT_TOLERANCE_PX = 8

export default function useAnimalAttentionInput(
  onAttentionRequest?: () => void,
  scope: "control" | "row" = "control",
) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [isTapped, setIsTapped] = useState(false)
  const [tapRequest, setTapRequest] = useState(0)
  const ownsTarget = (target: EventTarget) =>
    scope !== "row" || !(target instanceof Element && target.closest("button"))
  const lastPointerType = useRef<string | null>(null)
  const pendingTap = useRef<{ pointerId: number; x: number; y: number } | null>(
    null,
  )

  return {
    isAttended: isHovered || isFocused || isTapped,
    tapRequest,
    activateAttention: () => {
      if (lastPointerType.current !== "touch") onAttentionRequest?.()
    },
    attentionHandlers: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType !== "touch" && ownsTarget(event.target)) {
          setIsHovered(true)
          onAttentionRequest?.()
        }
      },
      onPointerLeave: (event: PointerEvent<HTMLElement>) => {
        setIsHovered(false)
        if (event.pointerType !== "touch") {
          setIsTapped(false)
          pendingTap.current = null
        }
      },
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        lastPointerType.current = event.pointerType
        pendingTap.current = null
        if (
          !ownsTarget(event.target) ||
          event.button !== 0 ||
          (scope !== "row" && event.pointerType !== "touch")
        )
          return
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
          tap?.pointerId === event.pointerId &&
          Math.hypot(event.clientX - tap.x, event.clientY - tap.y) >
            ANIMAL_TAP_MOVEMENT_TOLERANCE_PX
        )
          pendingTap.current = null
      },
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        const tap = pendingTap.current
        if (
          tap?.pointerId === event.pointerId &&
          ownsTarget(event.target) &&
          Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <=
            ANIMAL_TAP_MOVEMENT_TOLERANCE_PX
        ) {
          setIsTapped(true)
          if (scope === "row") setTapRequest((previous) => previous + 1)
          onAttentionRequest?.()
        }
        pendingTap.current = null
      },
      onPointerCancel: () => {
        pendingTap.current = null
        setIsHovered(false)
        setIsTapped(false)
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (!ownsTarget(event.target)) return
        lastPointerType.current = null
        setIsFocused(true)
      },
      onFocus: (event: FocusEvent<HTMLElement>) => {
        if (ownsTarget(event.target) && lastPointerType.current !== "touch") {
          setIsFocused(true)
          onAttentionRequest?.()
        }
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
