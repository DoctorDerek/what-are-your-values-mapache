import { expect } from "@playwright/test"
import { test } from "./fixtures"

const locales = [
  {
    language: "English",
    route: "/",
    start: "Start",
    customize: "Customize my values card",
    hero: "Your Heroes99 character",
    clothing: "Clothing",
    outfit: "Outfit 17",
    palette: "Palette 8",
    back: "Back",
    save: "Save appearance",
    share: "Share my values card",
    keep: "Keep editing",
    discard: "Discard changes",
    battle: "Battle",
  },
  {
    language: "Mexican Spanish",
    route: "/que-valoras-en-la-vida",
    start: "Empezar",
    customize: "Personalizar mi tarjeta de valores",
    hero: "Tu personaje de Heroes99",
    clothing: "Ropa",
    outfit: "Atuendo 17",
    palette: "Paleta 8",
    back: "Volver",
    save: "Guardar apariencia",
    share: "Compartir mi tarjeta de valores",
    keep: "Seguir editando",
    discard: "Descartar cambios",
    battle: "Combatir",
  },
] as const

for (const copy of locales) {
  test(`${copy.language} enlarged Dressing Room actions keep their complete text inside reachable targets`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 540 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(copy.route)
    await page.getByRole("button", { name: copy.start, exact: true }).click()
    await page
      .getByRole("button", { name: copy.customize, exact: true })
      .click()
    await page.addStyleTag({ content: "html { font-size: 200%; }" })
    await page.getByRole("button", { name: copy.clothing, exact: true }).click()
    await page.getByRole("button", { name: copy.outfit, exact: true }).click()
    const palette = page.getByRole("button", {
      name: copy.palette,
      exact: true,
    })
    await palette.click()
    for (const name of [copy.back, copy.save, copy.share]) {
      const action = page.getByRole("button", { name, exact: true })
      await expect(action).toBeInViewport({ ratio: 1 })
      await action.click({ trial: true })
      expect(
        await action.evaluate((element) => {
          const target = element.getBoundingClientRect()
          const range = document.createRange()
          range.selectNodeContents(element)
          const text = range.getBoundingClientRect()
          return (
            text.left >= target.left &&
            text.right <= target.right &&
            text.top >= target.top &&
            text.bottom <= target.bottom
          )
        }),
        `${name} remains inside its own button at 200% text`,
      ).toBe(true)
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)
    await page.screenshot({ path: testInfo.outputPath("enlarged-actions.png") })
    await page.getByRole("button", { name: copy.back, exact: true }).click()
    const confirmation = page.getByRole("dialog")
    for (const text of [
      confirmation.getByRole("heading"),
      confirmation.getByRole("button", { name: copy.discard, exact: true }),
    ]) {
      await text.scrollIntoViewIfNeeded()
      expect(
        await text.evaluate((element) => {
          const bounds = element.getBoundingClientRect()
          const range = document.createRange()
          range.selectNodeContents(element)
          const rendered = range.getBoundingClientRect()
          return rendered.left >= bounds.left && rendered.right <= bounds.right
        }),
      ).toBe(true)
    }
    await page.screenshot({
      path: testInfo.outputPath("enlarged-confirmation.png"),
    })
    await page.getByRole("button", { name: copy.keep, exact: true }).click()
    await expect(palette).toHaveAttribute("aria-pressed", "true")
  })

  for (const viewport of [
    { width: 320, height: 540 },
    { width: 1440, height: 900 },
  ]) {
    test(`${copy.language} appearance editing keeps its hero and guarded lower controls visible at ${viewport.width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(copy.route)
      await page.getByRole("button", { name: copy.start, exact: true }).click()
      await page
        .getByRole("button", { name: copy.customize, exact: true })
        .click()
      const hero = page.getByRole("img", { name: copy.hero, exact: true })
      const canvas = hero.locator("canvas")
      await expect(canvas).toBeVisible()
      const readPixels = () =>
        canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL())
      const original = await readPixels()
      await page
        .getByRole("button", { name: copy.clothing, exact: true })
        .click()
      const outfit = page.getByRole("button", {
        name: copy.outfit,
        exact: true,
      })
      await outfit.click()
      await expect(outfit).toBeInViewport({ ratio: 1 })
      await expect(hero).toBeInViewport({ ratio: 1 })
      await expect.poll(readPixels).not.toBe(original)
      const beforePalette = await readPixels()
      const palette = page.getByRole("button", {
        name: copy.palette,
        exact: true,
      })
      await palette.click()
      await expect(palette).toHaveAttribute("aria-pressed", "true")
      await expect(palette).toBeInViewport({ ratio: 1 })
      await expect(hero).toBeInViewport({ ratio: 1 })
      await expect.poll(readPixels).not.toBe(beforePalette)
      for (const name of [copy.back, copy.save, copy.share]) {
        const action = page.getByRole("button", { name, exact: true })
        await expect(action).toBeInViewport({ ratio: 1 })
        const bounds = await action.boundingBox()
        expect(bounds!.height).toBeGreaterThanOrEqual(44)
        expect(
          await action.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            return element.contains(
              document.elementFromPoint(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2,
              ),
            )
          }),
        ).toBe(true)
      }
      const back = page.getByRole("button", { name: copy.back, exact: true })
      const save = page.getByRole("button", { name: copy.save, exact: true })
      const backBounds = await back.boundingBox()
      const saveBounds = await save.boundingBox()
      expect(backBounds!.x).toBeLessThan(saveBounds!.x)
      expect(backBounds!.y).toBeCloseTo(saveBounds!.y, 0)
      await page.screenshot({
        path: testInfo.outputPath("co-visible-appearance-editing.png"),
      })
      await back.click()
      await page.getByRole("button", { name: copy.keep, exact: true }).click()
      await expect(palette).toHaveAttribute("aria-pressed", "true")
      await back.click()
      await page
        .getByRole("button", { name: copy.discard, exact: true })
        .click()
      await expect(
        page.getByRole("button", { name: copy.battle, exact: true }),
      ).toBeVisible()
    })
  }
}
