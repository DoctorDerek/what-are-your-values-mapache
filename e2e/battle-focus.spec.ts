import { expect, type Locator } from "@playwright/test"
import sharp from "sharp"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block" })

async function captureOutlineEdge(outline: Locator, edge: "start" | "end") {
  await expect(outline).toBeVisible()
  await outline.evaluate(
    (element, block) => element.scrollIntoView({ block, behavior: "instant" }),
    edge,
  )
  const bounds = (await outline.boundingBox())!
  const { data, info } = await sharp(
    await outline.page().screenshot({ scale: "css" }),
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return {
    width: bounds.width,
    height: bounds.height,
    isWhiteAt(x: number, y: number) {
      const viewportX = Math.floor(bounds.x + x)
      const viewportY = Math.floor(bounds.y + y)
      expect(viewportX).toBeGreaterThanOrEqual(0)
      expect(viewportX).toBeLessThan(info.width)
      expect(viewportY).toBeGreaterThanOrEqual(0)
      expect(viewportY).toBeLessThan(info.height)
      const offset = (viewportY * info.width + viewportX) * info.channels
      return [0, 1, 2].every((channel) => data[offset + channel]! >= 245)
    },
  }
}

for (const viewport of [
  { width: 390, height: 844, textScale: 100 },
  { width: 320, height: 568, textScale: 200 },
  { width: 1440, height: 900, textScale: 100 },
]) {
  test(`whole-card focus follows the silhouette at ${viewport.width}px and ${viewport.textScale}% text`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    await page.addStyleTag({
      content: `html { font-size: ${viewport.textScale}%; }`,
    })
    const battle = page.getByRole("main", { name: "Value battle" })
    const choices = battle.getByRole("button", { name: /^Choose / })
    const outlines = battle.locator("[data-card-focus-outline]")
    await expect(choices).toHaveCount(2)
    await expect(outlines.filter({ visible: true })).toHaveCount(0)

    for (const index of [0, 1]) {
      const choice = choices.nth(index)
      await choice.focus()
      await expect(choice).toBeFocused()
      const card = choice.locator("xpath=ancestor::*[@data-value-card]")
      const textOutline = card.locator('[data-card-focus-outline="value"]')
      const animalOutline = card.locator('[data-card-focus-outline="animal"]')
      await expect(outlines.filter({ visible: true })).toHaveCount(2)
      const text = await captureOutlineEdge(textOutline, "start")
      const animal = await captureOutlineEdge(animalOutline, "end")
      expect(text.width).toBeCloseTo(animal.width, 0)

      const textOuterY = 4
      const animalOuterY = animal.height - 4
      for (const [region, edgeY] of [
        [text, textOuterY],
        [animal, animalOuterY],
      ] as const) {
        const perimeterY = edgeY === 4 ? 24 : region.height - 24
        expect(region.isWhiteAt(4, perimeterY), "left perimeter").toBe(true)
        expect(
          region.isWhiteAt(region.width - 4, perimeterY),
          "right perimeter",
        ).toBe(true)
      }
      expect(
        text.isWhiteAt(text.width / 2, textOuterY),
        "text outer edge",
      ).toBe(true)
      expect(
        animal.isWhiteAt(animal.width / 2, animalOuterY),
        "animal outer edge",
      ).toBe(true)
      const textJoinY = text.height - 4
      const animalJoinY = 4
      const textJoin = await captureOutlineEdge(textOutline, "end")
      const animalJoin = await captureOutlineEdge(animalOutline, "start")
      expect(
        textJoin.isWhiteAt(text.width / 2, textJoinY),
        "no internal text seam",
      ).toBe(false)
      expect(
        animalJoin.isWhiteAt(animal.width / 2, animalJoinY),
        "no internal animal seam",
      ).toBe(false)
      await battle.getByRole("button", { name: "Menu", exact: true }).focus()
      await expect(outlines.filter({ visible: true })).toHaveCount(0)
    }

    await choices.last().focus()
    const stage = battle.locator("[data-choreography-identity]")
    const beforeChoice = await stage.getAttribute("data-choreography-identity")
    await page.keyboard.press("Enter")
    await expect(battle).toBeFocused()
    await expect(outlines.filter({ visible: true })).toHaveCount(0)
    await expect(stage).not.toHaveAttribute(
      "data-choreography-identity",
      beforeChoice!,
    )
    await expect(stage).toHaveAttribute(
      "data-battle-stage-state",
      "awaiting-input",
    )
    await expect(battle).toBeFocused()
    await expect(outlines.filter({ visible: true })).toHaveCount(0)

    const afterChoice = await stage.getAttribute("data-choreography-identity")
    await choices.first().focus()
    const menuAction = battle.getByRole("button", { name: "Menu", exact: true })
    await menuAction.focus()
    await page.keyboard.press("Enter")
    const menu = page.getByRole("dialog", { name: "Menu", exact: true })
    await expect(menu).toBeVisible()
    await menu
      .getByRole("button", { name: "Resume Battle", exact: true })
      .click()
    await expect(stage).toHaveAttribute(
      "data-choreography-identity",
      afterChoice!,
    )
    await expect(outlines.filter({ visible: true })).toHaveCount(0)

    for (const target of [
      choices.first(),
      choices.last(),
      battle.locator('[data-battle-arena-side="first"]'),
      battle.locator('[data-battle-arena-side="second"]'),
    ]) {
      const beforeClick = await stage.getAttribute("data-choreography-identity")
      const bounds = await target.boundingBox()
      if (!bounds) throw new Error("The card target must have layout bounds")
      await target.click({ position: { x: 8, y: bounds.height - 8 } })
      await expect(stage).not.toHaveAttribute(
        "data-choreography-identity",
        beforeClick!,
      )
      await expect(stage).toHaveAttribute(
        "data-battle-stage-state",
        "awaiting-input",
      )
      await expect(outlines.filter({ visible: true })).toHaveCount(0)
    }
  })
}
