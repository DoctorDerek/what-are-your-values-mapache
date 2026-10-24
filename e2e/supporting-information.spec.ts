import { expect, type Locator, type Page } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

async function expectReadableRegion(region: Locator) {
  const dimensions = await region.evaluate((element) => ({
    width: element.clientWidth,
    contentWidth: element.scrollWidth,
    height: element.clientHeight,
  }))
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width + 1)
  expect(dimensions.height).toBeGreaterThan(80)
}

async function scrollWithPinnedAction(region: Locator, action: Locator) {
  await expect(action).toBeInViewport({ ratio: 1 })
  const bounds = await action.boundingBox()
  await region.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(action).toBeInViewport({ ratio: 1 })
  expect(await action.boundingBox()).toEqual(bounds)
}

async function expectNoPageOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    contentWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width)
}

for (const locale of ["en", "es-MX"] as const) {
  const catalog = getLocaleCatalog(locale)
  const copy = catalog.interfaceCopy
  const destinations = copy.menuDestinations.filter(
    (destination) =>
      destination.id === "achievements" ||
      destination.kind === "information-panel",
  )
  for (const width of [320, 390, 1440]) {
    for (const destination of destinations) {
      test(`${destination.id} stays readable and dismissible at ${width}px in ${locale}`, async ({
        page,
      }, testInfo) => {
        const pageErrors: string[] = []
        page.on("pageerror", (error) => pageErrors.push(error.message))
        await page.setViewportSize({ width, height: width === 320 ? 540 : 900 })
        await page.goto(locale === "en" ? "/" : "/que-valoras-en-la-vida")
        await page
          .getByRole("button", {
            name: catalog.introduction.startAction,
            exact: true,
          })
          .click()
        await page.evaluate(() => document.fonts.ready)

        const menu = page.getByRole("button", {
          name: copy.menu.openAction,
          exact: true,
        })
        await menu.click()
        await page
          .getByRole("button", { name: destination.label, exact: true })
          .click()
        const isAchievements = destination.id === "achievements"
        const panel =
          destination.kind === "information-panel"
            ? copy.information[destination.id]
            : null
        const surface = isAchievements
          ? page.getByRole("main")
          : page.getByRole("dialog", { name: panel!.title, exact: true })
        const action = surface.getByRole("button", {
          name: isAchievements
            ? copy.controlActions.back
            : panel!.primaryActionLabel,
          exact: true,
        })
        const reading = isAchievements
          ? surface.locator("[data-controller-scroll]")
          : surface.getByTestId("information-panel-body")
        await expect(surface).toBeVisible()
        if (isAchievements) {
          await expect(surface.getByRole("listitem")).toHaveCount(40)
          await expect(
            surface.getByRole("listitem").first().getByRole("heading"),
          ).toBeInViewport({ ratio: 1 })
          await expect(surface.getByRole("button")).toHaveCount(1)
        }

        for (const scale of [100, 200]) {
          const scaling =
            scale === 200
              ? await page.addStyleTag({ content: "html { font-size: 200%; }" })
              : null
          await reading.evaluate((element) => {
            element.scrollTop = 0
          })
          await page.mouse.move(0, 0)
          await expectReadableRegion(reading)
          await expectNoPageOverflow(page)
          await expect(action).toBeInViewport({ ratio: 1 })
          await page.screenshot({
            path: testInfo.outputPath(`${destination.id}-${scale}.png`),
          })
          await scrollWithPinnedAction(reading, action)
          const finalContent = isAchievements
            ? surface.getByRole("listitem").last().getByRole("heading")
            : reading.locator("p").last()
          await finalContent.scrollIntoViewIfNeeded()
          await expect(finalContent).toBeInViewport()
          await expect(action).toBeInViewport({ ratio: 1 })
          await scaling?.evaluate((element) => element.remove())
        }
        await action.click()
        await expect(menu).toBeFocused()
        if (destination.id === "introduction") {
          await menu.click()
          await page
            .getByRole("button", {
              name: destination.label,
              exact: true,
            })
            .click()
          await expect(
            page.getByRole("dialog", {
              name: copy.information.introduction.title,
              exact: true,
            }),
          ).toBeVisible()
          await page.keyboard.press("Escape")
          await expect(page.getByRole("dialog")).toHaveCount(0)
          await expect(menu).toBeFocused()
        }
        expect(pageErrors).toEqual([])
      })
    }
  }
}
