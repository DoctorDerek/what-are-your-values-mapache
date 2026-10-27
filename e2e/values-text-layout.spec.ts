import AxeBuilder from "@axe-core/playwright"
import { expect } from "@playwright/test"
import { test } from "./fixtures"
import { getRenderedTextLines } from "./visible-text-bounds"

test("Spanish review actions keep whole words, reflow, and preserve the edited value", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 720 })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/que-valoras-en-la-vida")
  await page.getByRole("button", { name: "Empezar", exact: true }).click()
  await page.getByRole("button", { name: "Agregar valor", exact: true }).click()
  await page
    .getByLabel("Nombre del valor", { exact: true })
    .fill("Crear con esmero")
  await page
    .getByLabel("Definición", { exact: true })
    .fill("hacer cosas útiles con paciencia y cuidado")
  await page.getByRole("button", { name: "Guardar", exact: true }).click()
  await page
    .getByRole("button", { name: "Ver todos los valores", exact: true })
    .click()
  await page.getByRole("searchbox").fill("Crear con esmero")
  await page.getByRole("button", { name: "Editar", exact: true }).click()
  const name = page.getByLabel("Nombre del valor", { exact: true })
  await name.fill("Crear con esmero II")
  await page.evaluate(() => document.fonts.ready)
  const review = page.getByRole("button", {
    name: "Revisar actualización",
    exact: true,
  })
  const cancel = page.getByRole("button", { name: "Cancelar", exact: true })
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 720 })
    await expect(review).toBeInViewport({ ratio: 1 })
    await expect(cancel).toBeInViewport({ ratio: 1 })
    const lines = await review.evaluate(getRenderedTextLines)
    expect(
      lines.some((line) =>
        line.toLocaleLowerCase("es-MX").includes("actualización"),
      ),
    ).toBe(true)
    const reviewBounds = (await review.boundingBox())!
    const cancelBounds = (await cancel.boundingBox())!
    if (width === 390) expect(reviewBounds.y).toBe(cancelBounds.y)
    else
      expect(reviewBounds.y).toBeGreaterThan(
        cancelBounds.y + cancelBounds.height,
      )
    await page.screenshot({
      path: testInfo.outputPath(`spanish-review-${width}.png`),
    })
  }
  const enlargedText = await page.addStyleTag({
    content: "html { font-size: 200%; }",
  })
  await expect(review).toBeInViewport({ ratio: 1 })
  expect(
    await review.evaluate((button) => {
      const text = button.querySelector("span")!
      return (
        text.scrollWidth <= text.clientWidth &&
        button.scrollWidth <= button.clientWidth
      )
    }),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath("spanish-review-enlarged.png"),
  })
  await enlargedText.evaluate((element) => element.remove())
  await review.click()
  await expect(name).toHaveCount(0)
  await page.getByRole("button", { name: "Volver", exact: true }).click()
  await expect(name).toHaveValue("Crear con esmero II")
  await review.click()
  await page
    .getByRole("button", { name: "Actualizar valor", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Todos los valores", exact: true }),
  ).toBeVisible()
  await page.getByRole("searchbox").fill("Crear con esmero II")
  await expect(
    page.getByRole("heading", { name: "Crear con esmero II", exact: true }),
  ).toBeVisible()
  await page.reload()
  await page
    .getByRole("button", { name: "Ver todos los valores", exact: true })
    .click()
  await page.getByRole("searchbox").fill("Crear con esmero II")
  await expect(
    page.getByRole("heading", { name: "Crear con esmero II", exact: true }),
  ).toBeVisible()
})

for (const copy of [
  {
    language: "English",
    route: "/",
    start: "Start",
    browse: "Browse All Values",
    search: "Search All Values",
    names: ["Acceptance", "Responsibility", "Self-Knowledge"],
    menu: "Menu",
    back: "Back",
    settings: "Settings",
  },
  {
    language: "Mexican Spanish",
    route: "/que-valoras-en-la-vida",
    start: "Empezar",
    browse: "Ver todos los valores",
    search: "Buscar en todos los valores",
    names: ["Aceptación", "Autoconocimiento"],
    menu: "Menú",
    back: "Volver",
    settings: "Configuración",
  },
]) {
  test(`${copy.language} All Values avoids orphan letters and Settings legends retain readable contrast`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 720 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(copy.route)
    await page.getByRole("button", { name: copy.start, exact: true }).click()
    await page.getByRole("button", { name: copy.browse, exact: true }).click()
    for (const name of copy.names) {
      await page.getByRole("searchbox", { name: copy.search }).fill(name)
      const heading = page.getByRole("heading", { name, exact: true })
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeInViewport({ ratio: 1 })
      const lines = await heading.evaluate(getRenderedTextLines)
      expect(lines.every((line) => line.length > 1)).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath(`${name}-readable.png`),
      })
    }
    await page.getByRole("button", { name: copy.back, exact: true }).click()
    await page.getByRole("button", { name: copy.menu, exact: true }).click()
    await page.getByRole("button", { name: copy.settings, exact: true }).click()
    for (const legend of await page.locator("fieldset legend").all()) {
      await legend.scrollIntoViewIfNeeded()
      await expect(legend).toBeInViewport({ ratio: 1 })
    }
    const contrast = await new AxeBuilder({ page })
      .include("fieldset")
      .withRules(["color-contrast"])
      .analyze()
    expect(contrast.violations).toEqual([])
    await page.screenshot({ path: testInfo.outputPath("settings-legends.png") })
  })
}
