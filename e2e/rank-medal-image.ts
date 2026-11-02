import { expect, type Locator } from "@playwright/test"
import type { ValueRankMedalColor } from "#game/data/src/ValueRankMedal"

export async function expectRankMedalImage(
  image: Locator,
  color: ValueRankMedalColor,
) {
  await expect
    .poll(() =>
      image.evaluate(async (element: HTMLImageElement) => {
        const src = element.currentSrc
        if (!src || !element.complete || !element.naturalWidth) return ""
        try {
          await element.decode()
        } catch (error) {
          if (error instanceof DOMException && error.name === "EncodingError")
            return ""
          throw error
        }
        return element.isConnected && element.currentSrc === src
          ? new URL(src).pathname
          : ""
      }),
    )
    .toMatch(new RegExp(`/${color}(?:\\.[^/.]+)?\\.png$`))
}
