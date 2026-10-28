import { readFile } from "node:fs/promises"
import { expect } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import sharp from "sharp"
import { test } from "./fixtures"
import { getRenderedTextLines } from "./visible-text-bounds"

for (const locale of ["en", "es-MX"] as const) {
  test(`bundled Fluent medals preserve localized ranks and appear in saved cards in ${locale}`, async ({
    page,
  }, testInfo) => {
    const catalog = getLocaleCatalog(locale)
    const copy = catalog.interfaceCopy
    await page.setViewportSize({ width: 320, height: 720 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(locale === "en" ? "/" : "/que-valoras-en-la-vida")
    await page
      .getByRole("button", {
        name: catalog.introduction.startAction,
        exact: true,
      })
      .click()
    await expect(page.locator('img[src*="/gold."]')).toHaveCount(0)
    await page
      .getByRole("button", { name: catalog.hub.battle, exact: true })
      .click()
    await page
      .getByRole("button", { name: locale === "en" ? /^Choose / : /^Elegir / })
      .first()
      .click()
    await expect(
      page.getByRole("button", { name: copy.controlActions.undo, exact: true }),
    ).toBeEnabled()
    await page
      .getByRole("button", { name: copy.controlActions.stop, exact: true })
      .click()
    await page
      .getByRole("button", { name: copy.results.seeValuesAction, exact: true })
      .click()
    const homeRank = page.getByLabel(copy.rank.medal(1, copy.rank.gold), {
      exact: true,
    })
    await homeRank.scrollIntoViewIfNeeded()
    await expect(homeRank).toHaveText("#1")
    await expect(homeRank.locator("..").locator("img")).toHaveAttribute(
      "src",
      /\/gold\.[^/]+\.png$/,
    )
    await page.screenshot({ path: testInfo.outputPath("medals-home-320.png") })
    await page
      .getByRole("button", { name: catalog.hub.browse, exact: true })
      .click()
    for (const [rank, color] of [
      [1, "gold"],
      [6, "silver"],
      [11, "bronze"],
    ] as const) {
      const row = page.getByRole("listitem").filter({
        has: page.getByText(copy.rank.medal(rank, copy.rank[color]), {
          exact: true,
        }),
      })
      await row.scrollIntoViewIfNeeded()
      const medal = row.locator('img[aria-hidden="true"]')
      await expect(medal).toBeInViewport()
      await expect(medal).toHaveAttribute("alt", "")
      await expect(medal).toHaveAttribute("aria-hidden", "true")
      await expect
        .poll(() =>
          medal.evaluate((image: HTMLImageElement) => ({
            loaded: image.complete && image.naturalWidth === 256,
            local: new URL(image.src).origin === location.origin,
            width: image.getBoundingClientRect().width,
            height: image.getBoundingClientRect().height,
          })),
        )
        .toEqual({ loaded: true, local: true, width: 24, height: 24 })
      await expect(medal).toHaveAttribute(
        "src",
        new RegExp(`/${color}\\.[^/]+\\.png$`),
      )
      await row.screenshot({
        path: testInfo.outputPath(`${color}-rank-${rank}-320.png`),
      })
    }
    await expect(
      page
        .getByRole("listitem")
        .filter({ has: page.getByText(copy.rank.rank(16), { exact: true }) })
        .locator('img[aria-hidden="true"]'),
    ).toHaveCount(0)
    await page
      .getByRole("button", { name: copy.controlActions.back, exact: true })
      .click()
    await page
      .getByRole("button", { name: catalog.card.title, exact: true })
      .click()
    const preview = page.getByRole("dialog", {
      name: catalog.card.title,
      exact: true,
    })
    await preview.getByRole("button", { name: /PNG/ }).click()
    const save = preview.getByRole("button", {
      name: catalog.card.save("png"),
      exact: true,
    })
    await expect(save).toBeEnabled({ timeout: 30_000 })
    const download = page.waitForEvent("download")
    await save.click()
    const path = testInfo.outputPath(`medals-${locale}.png`)
    await (await download).saveAs(path)
    expect(await sharp(path).metadata()).toMatchObject({
      format: "png",
      width: 1600,
      height: 900,
    })
    const medalPixels = await sharp(path)
      .extract({ left: 540, top: 199, width: 72, height: 72 })
      .stats()
    expect(medalPixels.entropy).toBeGreaterThan(3)
    await preview.screenshot({
      path: testInfo.outputPath("medals-preview-320.png"),
    })
  })
}

for (const copy of [
  {
    route: "/",
    start: "Start",
    title: "Share my values card",
    back: "Back",
    save: "Save GIF",
    share: "Share GIF",
  },
  {
    route: "/que-valoras-en-la-vida",
    start: "Empezar",
    title: "Compartir mi tarjeta de valores",
    back: "Volver",
    save: "Guardar GIF",
    share: "Compartir GIF",
  },
]) {
  for (const viewport of [
    { width: 320, height: 540, textScale: 1 },
    { width: 1440, height: 900, textScale: 1 },
    { width: 320, height: 540, textScale: 2 },
  ]) {
    test(`${copy.title} keeps its preview and lower actions usable at ${viewport.width}px and ${viewport.textScale}x text`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "canShare", {
          configurable: true,
          value: () => true,
        })
        Object.defineProperty(navigator, "share", {
          configurable: true,
          value: async () => undefined,
        })
      })
      await page.goto(copy.route)
      await page.getByRole("button", { name: copy.start, exact: true }).click()
      await page.getByRole("button", { name: copy.title, exact: true }).click()
      await page.mouse.move(0, 0)
      const dialog = page.getByRole("dialog", { name: copy.title })
      const save = dialog.getByRole("button", { name: copy.save, exact: true })
      await expect(save).toBeEnabled({ timeout: 30_000 })
      if (viewport.textScale === 2)
        await page.addStyleTag({ content: "html { font-size: 200%; }" })
      const saveLines = await save.evaluate(getRenderedTextLines)
      expect(saveLines.some(line => line.toLowerCase().includes(copy.save.split(" ")[0].toLowerCase()))).toBe(true)
      const back = dialog.getByRole("button", { name: copy.back, exact: true })
      if (viewport.textScale === 1) {
        await expect(dialog.getByRole("img")).toBeInViewport({ ratio: 1 })
        await expect(back).toBeInViewport({ ratio: 1 })
        const backBounds = await back.boundingBox()
        const saveBounds = await save.boundingBox()
        expect(backBounds!.x).toBeLessThan(saveBounds!.x)
        expect(backBounds!.y).toBeCloseTo(saveBounds!.y, 0)
      }
      const actions = [
        ...(await dialog.getByRole("group").getByRole("button").all()),
        ...[copy.back, copy.save, copy.share].map((name) =>
          dialog.getByRole("button", { name, exact: true }),
        ),
      ]
      for (const action of actions) {
        if (viewport.textScale === 2) await action.scrollIntoViewIfNeeded()
        await expect(action).toBeInViewport({ ratio: 1 })
        await action.click({ trial: true })
        expect(
          await action.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            const range = document.createRange()
            range.selectNodeContents(element)
            const text = range.getBoundingClientRect()
            return (
              text.left >= bounds.left &&
              text.right <= bounds.right &&
              text.top >= bounds.top &&
              text.bottom <= bounds.bottom &&
              bounds.height >= 44
            )
          }),
        ).toBe(true)
      }
      expect(
        await dialog.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true)
      await page.screenshot({ path: testInfo.outputPath("compact-share.png") })
      await back.click()
      await expect(dialog).not.toBeVisible()
    })
  }
}

test("a player previews and saves genuine GIF and PNG cards", async ({
  page,
}, testInfo) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).click()
  await page
    .getByRole("button", { name: "Share my values card", exact: true })
    .click()
  const preview = page.getByRole("dialog", { name: "Share my values card" })
  await expect(
    preview.getByRole("button", { name: /GIF · Animated/ }),
  ).toHaveAttribute("aria-pressed", "true")
  await expect(preview.getByRole("button", { name: "Save GIF" })).toBeEnabled({
    timeout: 30_000,
  })
  const gifDownload = page.waitForEvent("download")
  await preview.getByRole("button", { name: "Save GIF" }).click()
  const gifPath = testInfo.outputPath("my-values-card.gif")
  await (await gifDownload).saveAs(gifPath)
  const gif = await readFile(gifPath)
  const metadata = await sharp(gif, { animated: true }).metadata()
  expect(metadata).toMatchObject({
    format: "gif",
    width: 1600,
    pageHeight: 900,
    loop: 0,
  })
  expect(metadata.pages).toBeGreaterThan(1)
  expect(metadata.pages).toBeLessThanOrEqual(24)
  expect(metadata.delay?.every((delay) => delay === 160)).toBe(true)
  expect(gif.byteLength).toBeLessThan(5 * 1024 * 1024)
  const first = await sharp(gif, { page: 0 }).raw().toBuffer()
  const second = await sharp(gif, { page: 1 }).raw().toBuffer()
  expect(first.equals(second)).toBe(false)
  expect(
    first
      .subarray(0, 1600 * 160 * (metadata.channels ?? 3))
      .equals(second.subarray(0, 1600 * 160 * (metadata.channels ?? 3))),
  ).toBe(true)
  await preview.getByRole("button", { name: "PNG · Still" }).click()
  await expect(preview.getByRole("button", { name: "Save PNG" })).toBeEnabled()
  const pngDownload = page.waitForEvent("download")
  await preview.getByRole("button", { name: "Save PNG" }).click()
  const pngPath = testInfo.outputPath("my-values-card.png")
  await (await pngDownload).saveAs(pngPath)
  const pngMetadata = await sharp(pngPath).metadata()
  expect(pngMetadata).toMatchObject({ format: "png", width: 1600, height: 900 })
  expect(pngMetadata.pages ?? 1).toBe(1)
  await preview.screenshot({ path: testInfo.outputPath("preview.png") })
  await page.keyboard.press("Escape")
  await expect(preview).not.toBeVisible()
  await expect(
    page.getByRole("button", { name: "Share my values card", exact: true }),
  ).toBeFocused()
  await expect(
    page.getByRole("heading", { name: "My Values", exact: true }),
  ).toBeVisible()
})

test("sharing returns to the unchanged appearance draft without saving it", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).click()
  const preview = page.getByRole("dialog", { name: "Share my values card" })
  await page
    .getByRole("button", { name: "Customize my card", exact: true })
    .click()
  await page.getByRole("button", { name: "Skin 6", exact: true }).click()
  await page
    .getByRole("button", { name: "Share my values card", exact: true })
    .click()
  await expect(preview).toBeVisible()
  await preview.getByRole("button", { name: "Back", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "Skin 6", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Customize my card", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Skin 6", exact: true }),
  ).toHaveAttribute("aria-pressed", "false")
})
