import { expect } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block", reducedMotion: "reduce" })

test("enlarged Home retains readable values and reachable lower actions", async ({
  page,
}, testInfo) => {
  const catalog = getLocaleCatalog("es-MX")
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto(catalog.metadata.webPath)
  await page
    .getByRole("button", {
      name: catalog.introduction.startAction,
      exact: true,
    })
    .click()
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({ content: "html { font-size: 200%; }" })
  const upperComposition = page.locator("[data-controller-scroll]").first()
  const add = page.getByRole("button", { name: catalog.hub.add, exact: true })
  const battle = page.getByRole("button", {
    name: catalog.hub.battle,
    exact: true,
  })
  const addBounds = await add.boundingBox()
  const battleBounds = await battle.boundingBox()
  await upperComposition.focus()
  await page.keyboard.press("End")
  await expect(
    page.getByRole("heading", { name: "Aceptación", exact: true }),
  ).toBeInViewport({ ratio: 1 })
  await expect(
    upperComposition.getByText("que me acepten tal como soy", { exact: true }),
  ).toBeInViewport({ ratio: 1 })
  await expect(add).toBeInViewport({ ratio: 1 })
  await expect(battle).toBeInViewport({ ratio: 1 })
  expect(await add.boundingBox()).toEqual(addBounds)
  expect(await battle.boundingBox()).toEqual(battleBounds)
  await page.screenshot({
    path: testInfo.outputPath("enlarged-home-values.png"),
  })
  await page.keyboard.press("Home")
  const menu = page.getByRole("button", {
    name: catalog.interfaceCopy.menu.openAction,
    exact: true,
  })
  await expect(menu).toBeInViewport({ ratio: 1 })
  await menu.click()
  await expect(
    page.getByRole("heading", {
      name: catalog.interfaceCopy.menu.title,
      exact: true,
    }),
  ).toBeVisible()
})

test("a pending Spanish save remains recoverable with enlarged text", async ({
  page,
}) => {
  const catalog = getLocaleCatalog("es-MX")
  const copy = catalog.interfaceCopy.recovery.pendingSave
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto(catalog.metadata.webPath)
  await page
    .getByRole("button", {
      name: catalog.introduction.startAction,
      exact: true,
    })
    .click()
  await page
    .getByRole("button", { name: catalog.hub.battle, exact: true })
    .click()
  const choices = page.getByRole("button", { name: /^Elegir / })
  await expect(choices).toHaveCount(2)
  const restoreStorage = await page.evaluateHandle(() => {
    const transaction = IDBDatabase.prototype.transaction
    IDBDatabase.prototype.transaction = function (storeNames, mode, options) {
      if (mode === "readwrite")
        throw new DOMException("Test storage unavailable", "QuotaExceededError")
      return transaction.call(this, storeNames, mode, options)
    }
    return () => {
      IDBDatabase.prototype.transaction = transaction
    }
  })
  await choices.first().click()
  await expect(
    page.getByRole("heading", { name: copy.title, exact: true }),
  ).toBeVisible()
  await page.addStyleTag({ content: "html { font-size: 200%; }" })
  const retry = page.getByRole("button", { name: copy.retry, exact: true })
  const backup = page.getByRole("button", { name: copy.export, exact: true })
  const retryBounds = await retry.boundingBox()
  await page.locator("[data-controller-scroll]").evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(retry).toBeInViewport({ ratio: 1 })
  await expect(backup).toBeInViewport({ ratio: 1 })
  expect(await retry.boundingBox()).toEqual(retryBounds)
  await restoreStorage.evaluate((restore) => restore())
  await restoreStorage.dispose()
  await retry.click()
  await expect(choices).toHaveCount(2)
  await expect(
    page.getByRole("button", {
      name: catalog.interfaceCopy.controlActions.undo,
      exact: true,
    }),
  ).toBeEnabled()
})

test("a secondary tab uses saved Spanish and keeps its recovery actions reachable", async ({
  page,
  context,
}) => {
  const catalog = getLocaleCatalog("es-MX")
  const copy = catalog.interfaceCopy.writerConflict
  await page.goto(catalog.metadata.webPath)
  await page
    .getByRole("button", {
      name: catalog.introduction.startAction,
      exact: true,
    })
    .click()
  await expect(
    page.getByRole("button", { name: catalog.hub.battle, exact: true }),
  ).toBeVisible()
  const secondary = await context.newPage()
  await secondary.setViewportSize({ width: 320, height: 568 })
  await secondary.goto("/")
  await expect(
    secondary.getByRole("heading", { name: copy.title, exact: true }),
  ).toBeVisible()
  await secondary.addStyleTag({ content: "html { font-size: 200%; }" })
  const loadLatest = secondary.getByRole("button", {
    name: copy.loadLatestAction,
    exact: true,
  })
  const cancel = secondary.getByRole("button", {
    name: copy.cancelAction,
    exact: true,
  })
  await expect(loadLatest).toBeInViewport({ ratio: 1 })
  await expect(cancel).toBeInViewport({ ratio: 1 })
  await secondary
    .getByRole("button", { name: copy.exportThisTabAction, exact: true })
    .scrollIntoViewIfNeeded()
  await expect(cancel).toBeInViewport({ ratio: 1 })
  await cancel.click()
  await secondary
    .getByRole("button", { name: copy.reviewOptionsAction, exact: true })
    .click()
  await expect(loadLatest).toBeFocused()
  await secondary.close()
})
