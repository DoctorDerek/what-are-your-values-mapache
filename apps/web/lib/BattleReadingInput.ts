import type { KeyboardEvent } from "react"

export function handleBattleReadingKeyDown(event: KeyboardEvent<HTMLElement>) {
  if (
    event.target === event.currentTarget &&
    (event.key === " " ||
      event.key === "Enter" ||
      event.key.startsWith("Arrow"))
  )
    event.stopPropagation()
}
