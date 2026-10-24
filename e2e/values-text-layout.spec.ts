import AxeBuilder from "@axe-core/playwright"
import { expect } from "@playwright/test"
import { test } from "./fixtures"

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
      const lines = await heading.evaluate((element) => {
        const text = element.firstChild!
        const rows = new Map<number, string>()
        for (let index = 0; index < text.textContent!.length; index += 1) {
          const character = text.textContent![index]
          if (!/\p{L}/u.test(character)) continue
          const range = document.createRange()
          range.setStart(text, index)
          range.setEnd(text, index + 1)
          const bounds = range.getBoundingClientRect()
          const row = Math.round(bounds.top)
          rows.set(row, (rows.get(row) ?? "") + character)
        }
        return [...rows.values()]
      })
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
