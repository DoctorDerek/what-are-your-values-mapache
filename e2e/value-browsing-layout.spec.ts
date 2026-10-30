import { expect } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block", reducedMotion: "reduce" })

for (const locale of ["en", "es-MX"] as const) {
  const copy = getLocaleCatalog(locale)
  for (const width of [390, 1280]) {
    test(`${locale} value browsing keeps approved placement and Menu continuity at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: width === 390 ? 740 : 900 })
      await page.goto(copy.metadata.webPath)
      await page
        .getByRole("button", {
          name: copy.introduction.startAction,
          exact: true,
        })
        .click()
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      const homeRow = page.locator("[data-value-row]").first()
      await expect(
        homeRow.getByText(copy.hub.level(1), { exact: true }),
      ).toBeVisible()
      const homePlacement = await homeRow.evaluate((row) => {
        const name = row.querySelector("h3")!
        const level = name.parentElement!.querySelector("p")!
        return {
          name: name.getBoundingClientRect().toJSON(),
          level: level.getBoundingClientRect().toJSON(),
        }
      })
      expect(homePlacement.level.left).toBeGreaterThan(homePlacement.name.left)
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-${width}-home.png`),
      })
      await page
        .getByRole("button", { name: copy.hub.browse, exact: true })
        .click()
      const search = page.getByRole("searchbox")
      const menu = page.getByRole("button", {
        name: copy.interfaceCopy.menu.openAction,
        exact: true,
      })
      await search.fill("practicality")
      const row = page.locator("[data-value-row]").first()
      await expect(page.locator("[data-value-row]")).toHaveCount(1)
      for (const scale of [1, 2]) {
        await page.evaluate((scale) => {
          document.documentElement.style.fontSize = `${scale * 100}%`
        }, scale)
        await row.scrollIntoViewIfNeeded()
        const geometry = await row.evaluate((row) => {
          const name = row.querySelector("h3")!
          const bar = row.querySelector('[role="progressbar"]')!
          const box = bar.parentElement!
          const level = box.firstElementChild!
          const xp = box.lastElementChild!
          return {
            name: name.getBoundingClientRect().toJSON(),
            box: box.getBoundingClientRect().toJSON(),
            level: level.getBoundingClientRect().toJSON(),
            bar: bar.getBoundingClientRect().toJSON(),
            xp: xp.getBoundingClientRect().toJSON(),
            levelAlign: getComputedStyle(level).textAlign,
            xpAlign: getComputedStyle(xp).textAlign,
            overflow: row.scrollWidth - row.clientWidth,
          }
        })
        expect(geometry.overflow).toBeLessThanOrEqual(1)
        expect(geometry.levelAlign).toBe("right")
        expect(geometry.xpAlign).toBe("left")
        expect(geometry.bar.top).toBeGreaterThanOrEqual(geometry.level.bottom)
        expect(geometry.xp.top).toBeGreaterThanOrEqual(geometry.bar.bottom)
        if (width < 1280) {
          expect(geometry.name.top).toBeGreaterThanOrEqual(geometry.box.bottom)
          expect(geometry.name.left).toBeLessThan(geometry.box.right)
          expect(geometry.name.width).toBeGreaterThanOrEqual(geometry.box.width)
        } else if (scale === 1) {
          expect(geometry.name.right).toBeLessThan(geometry.box.left)
          expect(geometry.name.top).toBeLessThan(geometry.box.bottom)
        }
        await expect(
          page.getByRole("button", {
            name: copy.interfaceCopy.dressingRoom.back,
            exact: true,
          }),
        ).toBeInViewport({ ratio: 1 })
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-${width}-${scale}x-values.png`),
        })
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "100%"
      })
      await search.fill("a")
      const roster = page.getByRole("region", {
        name: copy.interfaceCopy.screen.values,
        exact: true,
      })
      await roster.evaluate((element) => {
        element.scrollTop = 400
      })
      const previousScroll = await roster.evaluate(
        (element) => element.scrollTop,
      )
      await menu.click()
      const dialog = page.getByRole("dialog")
      await dialog
        .getByRole("button", {
          name: copy.interfaceCopy.menu.closeAction,
          exact: true,
        })
        .click()
      await expect(dialog).toHaveCount(0)
      await expect(search).toHaveValue("a")
      await expect(menu).toBeFocused()
      expect(await roster.evaluate((element) => element.scrollTop)).toBe(
        previousScroll,
      )
      expect(
        await page.evaluate(() => document.scrollingElement!.scrollTop),
      ).toBe(0)
    })
  }
}
