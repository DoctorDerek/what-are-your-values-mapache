import { expect, type Locator, type Page } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"
import { getRenderedTextLines } from "./visible-text-bounds"

test.use({ serviceWorkers: "block" })

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  )
}

async function expectReadableControl(control: Locator) {
  await expect(control).toBeInViewport({ ratio: 1 })
  const width = await control.evaluate((element) => ({
    content: element.scrollWidth,
    available: element.clientWidth,
  }))
  expect(width.content).toBeLessThanOrEqual(width.available)
}

async function scrollWithoutMovingControl(region: Locator, control: Locator) {
  const before = await control.boundingBox()
  const overflow = await region.evaluate(
    (element) => element.scrollHeight > element.clientHeight,
  )
  await region.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  if (overflow)
    await expect
      .poll(() => region.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0)
  await expect(control).toBeInViewport()
  expect(await control.boundingBox()).toEqual(before)
}

for (const locale of ["en", "es-MX"] as const) {
  for (const width of [320, 390, 1440]) {
    test(`supporting flows remain reachable and retain player data at ${width}px in ${locale}`, async ({
      page,
    }, testInfo) => {
      const catalog = getLocaleCatalog(locale)
      const copy = catalog.interfaceCopy
      const custom = copy.customValues
      const portability = copy.portability
      await page.setViewportSize({ width, height: 800 })
      await page.goto(locale === "en" ? "/" : "/que-valoras-en-la-vida")
      await page
        .getByRole("button", {
          name: catalog.introduction.startAction,
          exact: true,
        })
        .click()
      await page
        .getByRole("button", { name: catalog.hub.browse, exact: true })
        .click()
      const search = page.getByRole("searchbox", {
        name: copy.screen.searchAllValues,
        exact: true,
      })
      await expect(search).toBeVisible()
      await scrollWithoutMovingControl(
        page.locator("[data-controller-scroll]"),
        search,
      )
      await page.screenshot({
        path: testInfo.outputPath("all-values-pinned.png"),
      })
      const customName =
        locale === "en"
          ? "Patient craftsmanship"
          : "Trabajo paciente y cuidadoso"
      await search.fill(customName)
      await expect(page.getByRole("listitem")).toHaveCount(0)
      await page
        .getByRole("button", { name: catalog.hub.add, exact: true })
        .click()
      const name = page.getByLabel(custom.name, { exact: true })
      const definition = page.getByLabel(custom.definition, { exact: true })
      const save = page.getByRole("button", { name: custom.apply, exact: true })
      const back = page.getByRole("button", { name: custom.back, exact: true })
      await expect(name).toHaveValue(customName)
      await expect(save).toBeDisabled()
      await back.click()
      await expect(
        page.getByRole("dialog", { name: copy.dressingRoom.keepTitle }),
      ).toBeVisible()
      await page
        .getByRole("button", {
          name: copy.dressingRoom.keepEditing,
          exact: true,
        })
        .click()
      await expect(name).toBeFocused()
      const customDefinition =
        locale === "en"
          ? "to make useful things with patience and care"
          : "hacer cosas útiles con paciencia y cuidado"
      await definition.fill(customDefinition)
      await expect(save).toBeEnabled()
      const editorScroll = page
        .getByRole("complementary")
        .locator("[data-controller-scroll]")
      await scrollWithoutMovingControl(editorScroll, save)
      const backBounds = await back.boundingBox()
      const saveBounds = await save.boundingBox()
      expect(backBounds?.y).toBe(saveBounds?.y)
      expect(backBounds!.x + backBounds!.width).toBeLessThan(saveBounds!.x)
      await expectNoHorizontalOverflow(page)
      await page.screenshot({
        path: testInfo.outputPath("custom-value-pinned.png"),
      })
      await page.addStyleTag({ content: "html { font-size: 200%; }" })
      await page.setViewportSize({ width, height: 400 })
      await definition.fill(customDefinition)
      for (
        let tab = 0;
        tab < 8 &&
        !(await save.evaluate((node) => node === document.activeElement));
        tab++
      )
        await page.keyboard.press("Tab")
      await expect(save).toBeFocused()
      await expectReadableControl(save)
      await expectNoHorizontalOverflow(page)
      await page.screenshot({
        path: testInfo.outputPath("custom-value-short-large-text.png"),
      })
      await save.click()
      await expect(page.getByText(custom.saved, { exact: true })).toBeVisible()
      await expect
        .poll(() =>
          page.evaluate(() =>
            Boolean(history.state?.wayvmSemanticBackBoundary),
          ),
        )
        .toBe(false)
      await page.reload()
      await page.setViewportSize({ width, height: 800 })
      await page
        .getByRole("button", { name: catalog.hub.browse, exact: true })
        .click()
      await search.fill(customName)
      await expect(page.getByRole("listitem")).toHaveCount(1)
      await expect(
        page.getByRole("heading", { name: customName, exact: true }),
      ).toBeVisible()
      const edit = page.getByRole("button", {
        name: copy.screen.edit,
        exact: true,
      })
      await edit.click()
      const editName = page.getByLabel(copy.screen.valueName, { exact: true })
      await expect(editName).toBeFocused()
      await expect(search).toHaveCount(0)
      await expect(edit).toHaveCount(0)
      const revisedName = `${customName} II`
      await editName.fill(revisedName)
      await page.addStyleTag({ content: "html { font-size: 200%; }" })
      await page.setViewportSize({ width, height: 440 })
      const review = page.getByRole("button", {
        name: copy.screen.reviewUpdate,
        exact: true,
      })
      const cancelEdit = page.getByRole("button", {
        name: copy.screen.cancel,
        exact: true,
      })
      await scrollWithoutMovingControl(
        page.getByRole("form").locator("[data-controller-scroll]"),
        cancelEdit,
      )
      await expectReadableControl(review)
      await expectNoHorizontalOverflow(page)
      await page.screenshot({
        path: testInfo.outputPath("focused-edit-reachable.png"),
      })
      await review.click()
      await expect(
        page.getByRole("heading", {
          name: copy.screen.updateValue(revisedName),
          exact: true,
        }),
      ).toBeFocused()
      await page.evaluate(() => history.back())
      await expect(editName).toHaveValue(revisedName)
      await expect(editName).toBeFocused()
      await page.addStyleTag({ content: "html { font-size: 100%; }" })
      await page.setViewportSize({ width, height: 800 })
      await cancelEdit.click()
      await expect(search).toHaveValue(customName)
      await expect(edit).toBeFocused()
      const remove = page.getByRole("button", {
        name: copy.screen.delete,
        exact: true,
      })
      await remove.click()
      await expect(
        page.getByRole("heading", {
          name: copy.screen.removeValue(customName),
          exact: true,
        }),
      ).toBeFocused()
      await page
        .getByRole("button", { name: copy.screen.cancel, exact: true })
        .click()
      await expect(remove).toBeFocused()
      await back.click()
      await page
        .getByRole("button", { name: copy.menu.openAction, exact: true })
        .click()
      await page
        .getByRole("button", { name: portability.screenTitle, exact: true })
        .click()
      const downloadPromise = page.waitForEvent("download")
      await page
        .getByRole("button", { name: portability.exportAction, exact: true })
        .click()
      const backupPath = await (await downloadPromise).path()
      if (!backupPath) throw new Error("The exported backup is unavailable")
      const backupInput = page.getByLabel(copy.screen.chooseBackup, {
        exact: true,
      })
      await backupInput.setInputFiles(backupPath)
      const preview = page.getByRole("region", {
        name: portability.importPreviewTitle,
        exact: true,
      })
      const cancelImport = preview.getByRole("button", {
        name: portability.importCancelAction,
        exact: true,
      })
      await expect(preview).toBeVisible()
      await expect(
        preview.getByText(catalog.metadata.languageName, { exact: true }),
      ).toBeVisible()
      await expect(
        preview.getByText(portability.preview.customValues, { exact: true }),
      ).toBeVisible()
      await expect(cancelImport).toBeInViewport()
      await page.screenshot({
        path: testInfo.outputPath("import-focused-summary.png"),
      })
      await preview
        .getByText(portability.technicalDetails, { exact: true })
        .click()
      await scrollWithoutMovingControl(
        preview.locator("[data-controller-scroll]"),
        cancelImport,
      )
      await cancelImport.click()
      await expect(
        page.getByRole("button", {
          name: portability.chooseBackupAction,
          exact: true,
        }),
      ).toBeFocused()
      await backupInput.setInputFiles(backupPath)
      await expect(preview).toBeVisible()
      await page.addStyleTag({ content: "html { font-size: 200%; }" })
      await page.setViewportSize({ width, height: 400 })
      const replace = preview.getByRole("button", {
        name: portability.importReplaceAction,
        exact: true,
      })
      await replace.scrollIntoViewIfNeeded()
      await page.mouse.move(0, 0)
      await expectReadableControl(replace)
      const actionLines = await replace.evaluate(getRenderedTextLines)
      expect(
        actionLines.every((line) => line.length > 1),
        actionLines.join(" / "),
      ).toBe(true)
      await expect(cancelImport).toBeInViewport({ ratio: 1 })
      await page.addStyleTag({
        content: "footer button { letter-spacing: 0.12em; }",
      })
      await expectReadableControl(replace)
      await expect(cancelImport).toBeInViewport({ ratio: 1 })
      const reading = preview.locator("[data-controller-scroll]")
      expect(
        await reading.evaluate((element) => element.clientHeight),
      ).toBeGreaterThan(80)
      await expectNoHorizontalOverflow(page)
      await page.screenshot({
        path: testInfo.outputPath("import-short-large-text.png"),
      })
      await replace.click()
      const confirmation = page
        .getByRole("status")
        .filter({ hasText: portability.importSuccess })
      await expect(confirmation).toBeVisible()
      const header = page.getByRole("main").locator("header").first()
      await expect(header).toContainText(portability.importSuccessSummary)
      const card = page.getByRole("region", {
        name: catalog.hub.unrankedTitle,
        exact: true,
      })
      await expect(card).toBeVisible()
      const cardBeforeExpiry = await card.boundingBox()
      await expect(confirmation).toHaveCount(0, { timeout: 6500 })
      expect(await card.boundingBox()).toEqual(cardBeforeExpiry)
    })
  }
}
