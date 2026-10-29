import type { KeyboardEvent } from "react"

export function handleBattleReadingKeyDown(
  event: KeyboardEvent<HTMLElement>,
): void {
  if (
    event.target === event.currentTarget &&
    (event.key === " " ||
      event.key === "Enter" ||
      event.key.startsWith("Arrow"))
  )
    event.stopPropagation()
}
