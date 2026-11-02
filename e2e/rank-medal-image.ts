import { expect, type Locator } from "@playwright/test"
import type { ValueRankMedalColor } from "#game/data/src/ValueRankMedal"

export async function expectRankMedalImage(
  image: Locator,
  color: ValueRankMedalColor,
) {
  await expect
    .poll(() =>
      image.evaluate(
        (element: HTMLImageElement) => new URL(element.src).pathname,
      ),
    )
    .toMatch(new RegExp(`/${color}(?:\\.[^/.]+)?\\.png$`))
}
