import { expect, type Page } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

test.use({
  serviceWorkers: "block",
  contextOptions: { reducedMotion: "reduce" },
})

async function wheelAtPointer(page: Page, distance: number) {
  const handled = page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.addEventListener(
          "wheel",
          () =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          { once: true, passive: true },
        )
      }),
  )
  await page.mouse.wheel(0, distance)
  await handled
}

for (const locale of ["en", "es-MX"] as const) {
  const catalog = getLocaleCatalog(locale)
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 740 },
    { width: 1440, height: 900 },
  ]) {
    test(`${locale} Home confines scrolling to its roster at ${viewport.width}×${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport)
      await page.goto(catalog.metadata.webPath)
      await page
        .getByRole("button", {
          name: catalog.introduction.startAction,
          exact: true,
        })
        .click()
      const heading = page.locator("#your-values-heading")
      await expect(heading).toBeVisible()
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      const composition = page
        .getByRole("main")
        .locator(":scope > [data-controller-scroll]")
      const roster = page.getByRole("region", {
        name: catalog.hub.unrankedList,
        exact: true,
      })
      const menu = page.getByRole("button", {
        name: catalog.interfaceCopy.menu.openAction,
        exact: true,
      })
      const originalHeading = await heading.boundingBox()
      const originalMenu = await menu.boundingBox()
      const documentPosition = () =>
        page.evaluate(() => ({
          top: document.scrollingElement!.scrollTop,
          extra:
            document.scrollingElement!.scrollHeight -
            document.documentElement.clientHeight,
        }))
      await expect
        .poll(() =>
          composition.evaluate(
            (element) => element.scrollHeight - element.clientHeight,
          ),
        )
        .toBeLessThanOrEqual(1)
      await heading.hover()
      await wheelAtPointer(page, 400)
      await expect
        .poll(() => composition.evaluate((element) => element.scrollTop))
        .toBe(0)
      expect(await heading.boundingBox()).toEqual(originalHeading)
      expect(await documentPosition()).toEqual({ top: 0, extra: 0 })

      await roster.hover()
      await wheelAtPointer(page, 400)
      await expect
        .poll(() => roster.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0)
      expect(await heading.boundingBox()).toEqual(originalHeading)
      await roster.focus()
      await page.keyboard.press("End")
      await expect
        .poll(() =>
          roster.evaluate(
            (element) =>
              element.scrollHeight - element.clientHeight - element.scrollTop,
          ),
        )
        .toBeLessThanOrEqual(1)
      await wheelAtPointer(page, 700)
      expect(await composition.evaluate((element) => element.scrollTop)).toBe(0)
      expect(await documentPosition()).toEqual({ top: 0, extra: 0 })
      await page.keyboard.press("Home")
      await expect
        .poll(() => roster.evaluate((element) => element.scrollTop))
        .toBe(0)
      await wheelAtPointer(page, -700)
      expect(await heading.boundingBox()).toEqual(originalHeading)
      expect(await menu.boundingBox()).toEqual(originalMenu)

      const clippingBounds = await composition.boundingBox()
      expect(originalMenu!.x + originalMenu!.width + 14).toBeLessThanOrEqual(
        clippingBounds!.x + clippingBounds!.width + 1,
      )
      expect(originalMenu!.y - 12).toBeGreaterThanOrEqual(clippingBounds!.y - 1)
      await menu.focus()
      await expect(menu).toBeFocused()
      await page.screenshot({
        path: testInfo.outputPath("home-menu-focus.png"),
      })
      await menu.hover()
      await page.screenshot({
        path: testInfo.outputPath("home-menu-hover.png"),
      })
      await page.mouse.down()
      await expect
        .poll(async () => (await menu.boundingBox())!.x - originalMenu!.x)
        .toBeCloseTo(6, 1)
      const pressedMenu = await menu.boundingBox()
      expect(pressedMenu!.x + pressedMenu!.width + 8).toBeLessThanOrEqual(
        clippingBounds!.x + clippingBounds!.width + 1,
      )
      await page.screenshot({
        path: testInfo.outputPath("home-menu-pressed.png"),
      })
      await heading.hover()
      await page.mouse.up()

      const browse = page.getByRole("button", {
        name: catalog.hub.browse,
        exact: true,
      })
      const achievements = page.getByRole("button", {
        name: catalog.interfaceCopy.screen.achievements,
        exact: true,
      })
      const browseBounds = await browse.boundingBox()
      const achievementBounds = await achievements.boundingBox()
      expect(achievementBounds!.x).toBeGreaterThan(browseBounds!.x)
      expect(achievementBounds!.y).toBeCloseTo(browseBounds!.y, 0)
      await browse.focus()
      await page.keyboard.press("Tab")
      await expect(achievements).toBeFocused()
      await page.keyboard.press("Enter")
      await expect(
        page.getByRole("heading", {
          name: catalog.interfaceCopy.screen.achievements,
          exact: true,
        }),
      ).toBeVisible()
      await page
        .getByRole("button", {
          name: catalog.interfaceCopy.controlActions.back,
          exact: true,
        })
        .click()
      await expect(achievements).toBeFocused()
      expect(await documentPosition()).toEqual({ top: 0, extra: 0 })

      await page
        .getByRole("button", { name: catalog.hub.battle, exact: true })
        .click()
      await page
        .getByRole("button", {
          name: locale === "en" ? /^Choose / : /^Elegir /,
        })
        .first()
        .click()
      await page
        .getByRole("button", {
          name: catalog.interfaceCopy.controlActions.stop,
          exact: true,
        })
        .click()
      await page
        .getByRole("button", {
          name: catalog.interfaceCopy.results.seeValuesAction,
          exact: true,
        })
        .click()
      await expect(
        page.getByRole("heading", {
          name: catalog.hub.rankedTitle,
          exact: true,
        }),
      ).toBeVisible()
      for (const dismiss of await page
        .getByRole("button", { name: /^(Dismiss achievement|Cerrar logro):/ })
        .all())
        await dismiss.click()
      const rankedHeading = await heading.boundingBox()
      await heading.hover()
      await wheelAtPointer(page, 400)
      expect(await composition.evaluate((element) => element.scrollTop)).toBe(0)
      expect(await heading.boundingBox()).toEqual(rankedHeading)
      const rankedRoster = page.getByRole("region", {
        name: catalog.hub.rankedList,
        exact: true,
      })
      await rankedRoster.hover()
      await wheelAtPointer(page, 400)
      await expect
        .poll(() => rankedRoster.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0)
      expect(await heading.boundingBox()).toEqual(rankedHeading)
      expect(await documentPosition()).toEqual({ top: 0, extra: 0 })
    })
  }

  test(`${locale} outside dismissal preserves an unfinished value instead of discarding it`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(catalog.metadata.webPath)
    await page
      .getByRole("button", {
        name: catalog.introduction.startAction,
        exact: true,
      })
      .click()
    await page
      .getByRole("button", { name: catalog.hub.add, exact: true })
      .click()
    const name = page.getByRole("textbox", {
      name: catalog.interfaceCopy.customValues.name,
      exact: true,
    })
    await name.fill("Cloud watching")
    await page
      .getByRole("button", {
        name: catalog.interfaceCopy.menu.openAction,
        exact: true,
      })
      .click()
    const confirmation = page.getByRole("dialog", {
      name: catalog.interfaceCopy.dressingRoom.keepTitle,
      exact: true,
    })
    await expect(confirmation).toBeVisible()
    const bounds = await confirmation.boundingBox()
    await page.mouse.click(bounds!.x - 8, bounds!.y + bounds!.height / 2)
    await expect(confirmation).toHaveCount(0)
    await expect(name).toBeFocused()
    await expect(name).toHaveValue("Cloud watching")
    await expect(
      page.getByRole("button", {
        name: catalog.interfaceCopy.customValues.apply,
        exact: true,
      }),
    ).toBeDisabled()
  })

  test(`${locale} Share dismisses at its visible boundary without activating Home`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(catalog.metadata.webPath)
    await page
      .getByRole("button", {
        name: catalog.introduction.startAction,
        exact: true,
      })
      .click()
    const share = page.getByRole("button", {
      name: catalog.card.title,
      exact: true,
    })
    await share.click()
    const dialog = page.getByRole("dialog", {
      name: catalog.card.title,
      exact: true,
    })
    await expect(dialog).toBeVisible()
    await dialog
      .getByRole("heading", { name: catalog.card.title, exact: true })
      .click()
    await expect(dialog).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath("share-visible-boundary.png"),
    })
    const bounds = await dialog.boundingBox()
    await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y - 8)
    await expect(dialog).toHaveCount(0)
    await expect(share).toBeFocused()
    await expect(page.locator("#your-values-heading")).toBeVisible()
    await share.click()
    await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).toHaveCount(0)
    await expect(share).toBeFocused()
  })
}
