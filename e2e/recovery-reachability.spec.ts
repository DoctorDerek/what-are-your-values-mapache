import { expect } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block", reducedMotion: "reduce" })

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
