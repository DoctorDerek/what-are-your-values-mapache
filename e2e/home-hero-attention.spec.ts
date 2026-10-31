import { expect } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

for (const locale of ["en", "es-MX"] as const)
  for (const width of [390, 1440])
    test(`Home flourishes stay anchored and finish independently in ${locale} at ${width}px`, async ({
      page,
    }, testInfo) => {
      const copy = getLocaleCatalog(locale)
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: "no-preference" })
      await page.goto(locale === "en" ? "/" : "/es")
      await page
        .getByRole("button", {
          name: copy.introduction.startAction,
          exact: true,
        })
        .click()
      const hero = page.getByRole("button", {
        name: copy.interfaceCopy.dressingRoom.character,
        exact: true,
      })
      const artwork = hero.locator("canvas")
      await expect(artwork).toHaveAttribute("data-hero-clip", "idle")
      const baseline = await hero.boundingBox()
      const list = page.getByRole("region", { name: copy.hub.unrankedList })
      const listBounds = await list.boundingBox()
      for (const clip of ["attack_1", "attack_2", "attack_3"]) {
        await hero.hover()
        await expect(artwork).toHaveAttribute("data-hero-clip", clip)
        const firstPosition = await artwork.evaluate(
          (canvas) => getComputedStyle(canvas).transform,
        )
        await page.mouse.move(0, 0)
        await expect
          .poll(() =>
            artwork.evaluate((canvas) => getComputedStyle(canvas).transform),
          )
          .not.toBe(firstPosition)
        expect(await hero.boundingBox()).toEqual(baseline)
        expect(await list.boundingBox()).toEqual(listBounds)
        await page.screenshot({ path: testInfo.outputPath(`${clip}.png`) })
        await expect(artwork).toHaveAttribute("data-hero-clip", "idle")
      }
      await hero.focus()
      await expect(artwork).toHaveAttribute("data-hero-clip", "attack_1")
      await expect(artwork).toHaveAttribute("data-hero-clip", "idle")
      await page.keyboard.press("Enter")
      await expect(artwork).toHaveAttribute("data-hero-clip", "attack_2")
      await page.emulateMedia({ reducedMotion: "reduce" })
      await expect(artwork).toHaveCSS("animation-name", "none")
      await expect(artwork).toHaveCSS("transform", "none")
      expect(await hero.boundingBox()).toEqual(baseline)
      await page.addStyleTag({ content: "html { font-size: 200%; }" })
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
      await page.screenshot({ path: testInfo.outputPath("enlarged-home.png") })
    })

test("intentional touch requests a flourish but dragging and cancelled touches do not", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).click()
  const hero = page.getByRole("button", { name: "Your Heroes99 character" })
  const artwork = hero.locator("canvas")
  await expect(artwork).toHaveAttribute("data-hero-clip", "idle")
  const point = { pointerType: "touch", pointerId: 1, clientX: 10, clientY: 10 }
  await hero.dispatchEvent("pointerdown", point)
  await hero.dispatchEvent("pointermove", { ...point, clientY: 40 })
  await hero.dispatchEvent("pointerup", { ...point, clientY: 40 })
  await expect(artwork).toHaveAttribute("data-hero-clip", "idle")
  await hero.dispatchEvent("pointerdown", point)
  await hero.dispatchEvent("pointercancel", point)
  await hero.dispatchEvent("pointerup", point)
  await expect(artwork).toHaveAttribute("data-hero-clip", "idle")
  await hero.dispatchEvent("pointerdown", point)
  await hero.dispatchEvent("pointerup", point)
  await expect(artwork).toHaveAttribute("data-hero-clip", "attack_1")
  await expect(artwork).toHaveAttribute("data-hero-clip", "idle")
})
