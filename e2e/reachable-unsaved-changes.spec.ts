import { expect, type Locator } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block" })

async function expectCompleteWords(action: Locator) {
  expect(
    await action.evaluate((node) => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const text = walker.currentNode
        for (const word of text.textContent!.matchAll(/\S+/g)) {
          const range = document.createRange()
          range.setStart(text, word.index)
          range.setEnd(text, word.index + word[0].length)
          if (
            [...range.getClientRects()].filter((rect) => rect.width > 0)
              .length > 1
          )
            return false
        }
      }
      return node.scrollWidth <= node.clientWidth
    }),
  ).toBe(true)
}

for (const locale of ["en", "es-MX"] as const) {
  const catalog = getLocaleCatalog(locale)
  const copy = catalog.interfaceCopy
  for (const textScale of [1, 2]) {
    test(`${locale} custom matching and notices remain separate, scrollable and clear at ${textScale}x text`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
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
      await page.addStyleTag({
        content: `html { font-size:${textScale * 100}%; }`,
      })
      const name = page.getByLabel(copy.customValues.name, { exact: true })
      await name.fill("P")
      const matches = page.getByRole("region", {
        name: copy.screen.matchingValues,
        exact: true,
      })
      const buttons = matches.getByRole("button")
      expect(await buttons.count()).toBeGreaterThan(10)
      const footer = page.locator("footer").filter({
        has: page.getByRole("button", {
          name: copy.customValues.apply,
          exact: true,
        }),
      })
      const footerBounds = await footer.boundingBox()
      await buttons.first().scrollIntoViewIfNeeded()
      await expectCompleteWords(buttons.first())
      const first = await buttons.nth(0).boundingBox()
      const second = await buttons.nth(1).boundingBox()
      expect(first).not.toBeNull()
      expect(second).not.toBeNull()
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height)
      expect(
        await matches.evaluate((node) => node.scrollHeight > node.clientHeight),
      ).toBe(true)
      await buttons.last().scrollIntoViewIfNeeded()
      await buttons.last().click({ trial: true })
      await expectCompleteWords(buttons.last())
      expect(await footer.boundingBox()).toEqual(footerBounds)
      await expect(name).toHaveValue("P")
      await page.screenshot({
        path: testInfo.outputPath("matching-values.png"),
      })
      await name.fill("Patient craftsmanship")
      await page
        .getByLabel(copy.customValues.definition, { exact: true })
        .fill("to make useful things with care")
      const notices = page
        .getByRole("region", { name: copy.screen.saveCustomValues })
        .getByRole("list")
      await expect(notices.getByRole("listitem")).toHaveCount(3)
      for (const item of await notices.getByRole("listitem").all()) {
        await item.scrollIntoViewIfNeeded()
        await expectCompleteWords(item)
      }
      expect(await footer.boundingBox()).toEqual(footerBounds)
      for (const action of [copy.customValues.back, copy.customValues.apply])
        await expect(
          page.getByRole("button", { name: action, exact: true }),
        ).toBeInViewport({ ratio: 1 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true)
      await page.screenshot({
        path: testInfo.outputPath("authoring-notices.png"),
      })
    })
  }
  for (const viewport of [
    { width: 390, height: 844, scale: 1 },
    { width: 320, height: 568, scale: 2 },
    { width: 1440, height: 900, scale: 1 },
  ]) {
    test(`${locale} unsaved decisions retain their complete choices and draft at ${viewport.width}px and ${viewport.scale}x text`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(catalog.metadata.webPath)
      const button = (name: string, parent: Locator | typeof page = page) =>
        parent.getByRole("button", { name, exact: true })
      await button(catalog.introduction.startAction).click()
      for (const flow of ["appearance", "custom"] as const) {
        await page.addStyleTag({ content: "html { font-size: 100%; }" })
        if (flow === "appearance") {
          await button(copy.dressingRoom.customize).click()
          await button(copy.heroChoices.categories.Clothing).click()
          await button(copy.heroChoices.outfit("17")).click()
        } else {
          await button(catalog.hub.add).click()
          await page
            .getByLabel(copy.customValues.name, { exact: true })
            .fill("Patient craftsmanship")
          await page
            .getByLabel(copy.customValues.definition, { exact: true })
            .fill("to make useful things with care")
        }
        await page.addStyleTag({
          content: `html { font-size: ${viewport.scale * 100}%; }`,
        })
        await button(
          flow === "appearance"
            ? copy.dressingRoom.back
            : copy.customValues.back,
        ).click()
        const dialog = page.getByRole("dialog", {
          name: copy.dressingRoom.keepTitle,
          exact: true,
        })
        const keep = button(copy.dressingRoom.keepEditing, dialog)
        const save = button(copy.dressingRoom.saveReturn, dialog)
        const discard = button(copy.dressingRoom.discard, dialog)
        const footer = dialog.getByRole("contentinfo")
        for (const action of [keep, save]) {
          await expect(action).toBeInViewport({ ratio: 1 })
          await expectCompleteWords(action)
          await action.click({ trial: true })
        }
        const saveBounds = await save.boundingBox()
        const footerBounds = await footer.boundingBox()
        if (!saveBounds || !footerBounds)
          throw new Error("Expected the save action and its footer")
        if (viewport.width < 1280)
          expect(
            viewport.height - saveBounds.y - saveBounds.height / 2,
          ).toBeGreaterThan(95)
        else {
          const bounds = await dialog.boundingBox()
          if (!bounds) throw new Error("Expected the confirmation")
          expect(bounds.y + bounds.height / 2).toBeCloseTo(
            viewport.height / 2,
            0,
          )
        }
        await page.screenshot({
          path: testInfo.outputPath(`${flow}-confirmation.png`),
        })
        await discard.scrollIntoViewIfNeeded()
        await expectCompleteWords(discard)
        await discard.click({ trial: true })
        expect(await footer.boundingBox()).toEqual(footerBounds)
        await keep.click()
        if (flow === "appearance") {
          await expect(button(copy.heroChoices.outfit("17"))).toHaveAttribute(
            "aria-pressed",
            "true",
          )
          await button(copy.dressingRoom.back).click()
          await button(
            copy.dressingRoom.discard,
            page.getByRole("dialog"),
          ).click()
        } else {
          await expect(
            page.getByLabel(copy.customValues.name, { exact: true }),
          ).toHaveValue("Patient craftsmanship")
          await page
            .getByLabel(copy.customValues.definition, { exact: true })
            .fill("")
          await button(copy.customValues.back).click()
          await expect(
            button(copy.dressingRoom.saveReturn, page.getByRole("dialog")),
          ).toBeDisabled()
          await page.keyboard.press("Escape")
          await expect(
            page.getByLabel(copy.customValues.name, { exact: true }),
          ).toHaveValue("Patient craftsmanship")
        }
      }
    })
  }
  test(`${locale} constrained authoring keeps keyboard-focused fields and actions visible`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
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
    const customName = "Patient craftsmanship"
    await page
      .getByLabel(copy.customValues.name, { exact: true })
      .fill(customName)
    let definition = "to make useful things with care"
    await page
      .getByLabel(copy.customValues.definition, { exact: true })
      .fill(definition)
    for (const stage of ["add", "edit"] as const) {
      const name = page.getByLabel(
        stage === "add" ? copy.customValues.name : copy.screen.valueName,
        { exact: true },
      )
      const field = page.getByLabel(
        stage === "add" ? copy.customValues.definition : copy.screen.definition,
        { exact: true },
      )
      await field.focus()
      await page.setViewportSize({ width: 390, height: 420 })
      await expect(field).toBeFocused()
      await expect(field).toBeInViewport({ ratio: 1 })
      await name.focus()
      await page.keyboard.press("Tab")
      await expect(field).toBeFocused()
      await expect(field).toBeInViewport({ ratio: 1 })
      await expect(field).toHaveValue(definition)
      await field.press("ControlOrMeta+End")
      expect(
        await field.evaluate(
          (node: HTMLTextAreaElement) => node.selectionStart,
        ),
      ).toBe(definition.length)
      await field.press("!")
      definition += "!"
      await expect(field).toHaveValue(definition)
      const saveLabel =
        stage === "add" ? copy.customValues.apply : copy.screen.reviewUpdate
      const backLabel =
        stage === "add" ? copy.customValues.back : copy.screen.cancel
      const save = page.getByRole("button", { name: saveLabel, exact: true })
      const footer = page.locator("footer").filter({ has: save })
      const footerBounds = await footer.boundingBox()
      await page.screenshot({
        path: testInfo.outputPath(`${stage}-focused-field.png`),
      })
      const port =
        stage === "add"
          ? page
              .getByRole("complementary")
              .locator("fieldset > [data-controller-scroll]")
          : page.getByRole("form").locator("[data-controller-scroll]")
      const bounds = await port.boundingBox()
      expect(bounds).not.toBeNull()
      await page.mouse.move(
        bounds!.x + 4,
        bounds!.y + Math.min(100, bounds!.height / 2),
      )
      await page.mouse.wheel(0, 2000)
      await expect
        .poll(() => port.evaluate((node) => node.scrollTop))
        .toBeGreaterThan(0)
      if (stage === "add") {
        await expect
          .poll(async () => {
            await page.mouse.wheel(0, 400)
            return port.evaluate(
              (node) => node.scrollHeight - node.clientHeight - node.scrollTop,
            )
          })
          .toBeLessThanOrEqual(1)
        await expect(
          page
            .getByRole("region", { name: copy.screen.saveCustomValues })
            .getByRole("listitem")
            .last(),
        ).toBeInViewport({ ratio: 1 })
      }
      await expect(field).toBeFocused()
      await expect(field).toHaveValue(definition)
      expect(await footer.boundingBox()).toEqual(footerBounds)
      for (const action of [backLabel, saveLabel])
        await expect(
          page.getByRole("button", { name: action, exact: true }),
        ).toBeInViewport({ ratio: 1 })
      expect(
        await page.evaluate(
          () => document.documentElement.scrollHeight <= innerHeight,
        ),
      ).toBe(true)
      if (stage === "add") {
        await save.click()
        await page.setViewportSize({ width: 390, height: 844 })
        await page
          .getByRole("button", { name: catalog.hub.browse, exact: true })
          .click()
        await page
          .getByRole("searchbox", {
            name: copy.screen.searchAllValues,
            exact: true,
          })
          .fill(customName)
        await page
          .getByRole("button", { name: copy.screen.edit, exact: true })
          .click()
      }
    }
  })
}
