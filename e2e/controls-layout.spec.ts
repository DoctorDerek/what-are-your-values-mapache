import { expect } from "@playwright/test"
import { test } from "./fixtures"

const locales = [
  {
    route: "/",
    start: "Start",
    menu: "Menu",
    controls: "Controls",
    keyboard: "Keyboard",
    firstInput: "1 or A",
    firstAction: "Select First Value",
    close: "Close",
  },
  {
    route: "/que-valoras-en-la-vida",
    start: "Empezar",
    menu: "Menú",
    controls: "Controles",
    keyboard: "Teclado",
    firstInput: "1 o A",
    firstAction: "Elegir el primer valor",
    close: "Cerrar",
  },
] as const

for (const copy of locales) {
  for (const viewport of [
    { width: 320, height: 540, textScale: 1 },
    { width: 1440, height: 900, textScale: 1 },
    { width: 320, height: 540, textScale: 2 },
  ]) {
    test(`${copy.controls} pairs inputs with actions and keeps Close reachable at ${viewport.width}px and ${viewport.textScale}x text`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(copy.route)
      await page.getByRole("button", { name: copy.start, exact: true }).click()
      await page.getByRole("button", { name: copy.menu, exact: true }).click()
      await page
        .getByRole("button", { name: copy.controls, exact: true })
        .click()
      if (viewport.textScale === 2)
        await page.addStyleTag({ content: "html { font-size: 200%; }" })

      const dialog = page.getByRole("dialog", { name: copy.controls })
      const keyboard = dialog.getByRole("heading", { name: copy.keyboard })
      await expect(keyboard).toBeInViewport({ ratio: 1 })
      const input = dialog.getByText(copy.firstInput, { exact: true })
      const action = dialog.getByText(copy.firstAction, { exact: true }).first()
      if (viewport.textScale === 2) await input.scrollIntoViewIfNeeded()
      await expect(input).toBeInViewport({ ratio: 1 })
      if (viewport.textScale === 2) await action.scrollIntoViewIfNeeded()
      await expect(action).toBeInViewport({ ratio: 1 })
      const inputBounds = await input.boundingBox()
      const actionBounds = await action.boundingBox()
      if (viewport.textScale === 1) {
        expect(inputBounds!.x + inputBounds!.width).toBeLessThanOrEqual(
          actionBounds!.x,
        )
        expect(Math.abs(inputBounds!.y - actionBounds!.y)).toBeLessThan(12)
      } else {
        expect(inputBounds!.y).toBeLessThan(actionBounds!.y)
      }
      const close = dialog
        .getByRole("button", { name: copy.close, exact: true })
        .last()
      await expect(close).toBeInViewport({ ratio: 1 })
      await close.click({ trial: true })
      expect(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath("paired-controls.png"),
      })
      await close.click()
      await expect(dialog).not.toBeVisible()
    })
  }
}
