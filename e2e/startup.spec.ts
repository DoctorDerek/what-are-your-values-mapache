import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block" })

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`first arrival uses full-width bands and reachable language and Start controls at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    const start = page.getByRole("button", { name: "Start", exact: true })
    const language = page.getByRole("combobox", { name: "Language" })
    const body = page.getByTestId("information-panel-body")
    const title = page.getByRole("heading", {
      name: "What Are Your Values, Mapache?",
      exact: true,
    })
    const expectedTitleLines = viewport.width >= 1280 ? 1 : 2
    const titleGeometry = await title.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return {
        left: bounds.left,
        right: bounds.right,
        height: bounds.height,
        lineHeight: Number.parseFloat(style.lineHeight),
        letterSpacing: style.letterSpacing,
      }
    })
    expect(titleGeometry.left).toBeGreaterThanOrEqual(0)
    expect(titleGeometry.right).toBeLessThanOrEqual(viewport.width)
    expect(titleGeometry.height).toBeCloseTo(
      titleGeometry.lineHeight * expectedTitleLines,
      0,
    )
    expect(titleGeometry.letterSpacing).toMatch(/^(normal|0px)$/)
    await expect(start).toBeInViewport({ ratio: 1 })
    await expect(language).toBeInViewport({ ratio: 1 })
    const frame = page.getByRole("region", {
      name: "What Are Your Values, Mapache?",
      exact: true,
    })
    const bounds = await frame.boundingBox()
    expect(bounds!.x).toBe(0)
    expect(bounds!.width).toBe(viewport.width)
    expect(bounds!.height).toBeCloseTo(viewport.height, 1)
    const startBounds = await start.boundingBox()
    const languageBounds = await language.boundingBox()
    const link = page.getByRole("link", {
      name: "DoctorDerek.com",
      exact: true,
    })
    const linkBounds = await link.boundingBox()
    expect(startBounds!.y).toBeGreaterThan(
      languageBounds!.y + languageBounds!.height,
    )
    expect(linkBounds!.y).toBeGreaterThan(startBounds!.y + startBounds!.height)
    expect(startBounds!.x + startBounds!.width / 2).toBeCloseTo(
      viewport.width / 2,
      1,
    )
    expect(startBounds!.width).toBeLessThanOrEqual(576)
    await body.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    expect(await start.boundingBox()).toEqual(startBounds)
    await body.evaluate((element) => {
      element.scrollTop = 0
    })
    await page.screenshot({ path: testInfo.outputPath("first-arrival.png") })
    await language.selectOption("es-MX")
    const spanishTitle = page.getByRole("heading", {
      name: "¿Cuáles son tus valores, Mapache?",
      exact: true,
    })
    const spanishTitleBounds = await spanishTitle.boundingBox()
    expect(spanishTitleBounds!.x).toBeGreaterThanOrEqual(0)
    expect(
      spanishTitleBounds!.x + spanishTitleBounds!.width,
    ).toBeLessThanOrEqual(viewport.width)
    expect(spanishTitleBounds!.height).toBeCloseTo(titleGeometry.height, 1)
    await page.evaluate(() => document.fonts.load('400 32px "WAYVM Condensed"'))
    await spanishTitle.evaluate((element) => {
      element.style.fontFamily = '"WAYVM Condensed"'
    })
    const fallbackTitleBounds = await spanishTitle.boundingBox()
    expect(fallbackTitleBounds!.height).toBeCloseTo(titleGeometry.height, 1)
    expect(fallbackTitleBounds!.x).toBeGreaterThanOrEqual(0)
    expect(
      fallbackTitleBounds!.x + fallbackTitleBounds!.width,
    ).toBeLessThanOrEqual(viewport.width)
    await expect(
      page.getByRole("button", { name: "Empezar", exact: true }),
    ).toBeInViewport({ ratio: 1 })
    await page.screenshot({
      path: testInfo.outputPath("first-arrival-spanish.png"),
    })
    await page.getByRole("button", { name: "Empezar", exact: true }).click()
    await expect(
      page.getByRole("button", { name: "Combatir", exact: true }),
    ).toBeVisible()
  })
}

test("startup preserves its viewport while client code waits and opens the saved destination", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const scriptsReady = Promise.withResolvers<void>()
  let scriptsAreDelayed = true
  await page.route(/\.js(?:\?|$)/, async (route) => {
    if (scriptsAreDelayed) await scriptsReady.promise
    await route.continue()
  })

  try {
    await page.goto("/", { waitUntil: "commit" })
    const game = page.getByRole("region", {
      name: "Play What Are Your Values, Mapache?",
    })
    const loading = game.getByRole("main", { name: "Loading your values…" })
    await expect(loading).toHaveAttribute("aria-busy", "true")
    await expect
      .poll(async () => (await loading.boundingBox())?.height)
      .toBeCloseTo(844, 1)
    await expect(loading.getByRole("status")).toHaveText("Loading your values…")
    await expect(loading.getByRole("heading")).toHaveCount(0)
    await expect(game.locator("noscript")).toBeHidden()
    const beforeStartup = await game.boundingBox()
    const announcement = await loading.getByRole("status").boundingBox()
    expect(announcement!.width).toBeLessThanOrEqual(1)
    expect(announcement!.height).toBeLessThanOrEqual(1)

    scriptsAreDelayed = false
    scriptsReady.resolve()
    await expect(
      game.getByRole("button", { name: "Start", exact: true }),
    ).toBeVisible()
    const afterStartup = await game.boundingBox()
    expect(afterStartup).toEqual(beforeStartup)
    await expect(loading).toHaveCount(0)
    const language = game.getByRole("combobox", { name: "Language" })
    await expect(language).toHaveValue("en")
    await expect(language.getByRole("option")).toHaveText([
      "English (US)",
      "Español (México)",
    ])
    await language.selectOption("en")
    await Promise.all([
      page.waitForEvent("framenavigated"),
      game.getByRole("button", { name: "Start", exact: true }).click(),
    ])
    await expect(
      game.getByRole("heading", {
        name: /^My (?:Top Five Life )?Values$/,
        exact: true,
      }),
    ).toBeVisible()

    await page.reload()
    await expect(
      game.getByRole("heading", {
        name: /^My (?:Top Five Life )?Values$/,
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      game.getByRole("button", { name: "Start", exact: true }),
    ).toHaveCount(0)
    await game.getByRole("button", { name: "Menu", exact: true }).click()
    await page
      .getByRole("dialog", { name: "Menu", exact: true })
      .getByRole("button", { name: "Settings", exact: true })
      .click()
    await expect(game.getByRole("combobox", { name: "Language" })).toHaveValue(
      "en",
    )
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US")
  } finally {
    scriptsReady.resolve()
    await page.unrouteAll({ behavior: "wait" })
  }
})

test("first arrival uses the wide composition and completes a full raccoon crossing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto("/")
  const start = page.getByRole("button", { name: "Start", exact: true })
  await expect(start).toBeVisible()
  const title = page.getByRole("heading", {
    name: "What Are Your Values, Mapache?",
    exact: true,
  })
  const titleGeometry = await title.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
  }))
  expect(titleGeometry.height).toBeCloseTo(titleGeometry.lineHeight, 1)
  const poster = page.locator('img[src*="ice-cream.png"]')
  expect((await poster.boundingBox())!.width).toBeLessThanOrEqual(400)
  const creditLines = await page
    .getByRole("link", { name: "DoctorDerek.com" })
    .evaluate((link) =>
      Array.from(
        link.parentElement!.children,
        (line) => line.getBoundingClientRect().top,
      ),
    )
  expect(creditLines[1] - creditLines[0]).toBeCloseTo(
    creditLines[2] - creditLines[1],
    1,
  )

  const startBefore = await start.boundingBox()
  const crossing = page.getByTestId("arrival-raccoon")
  await expect(crossing).toBeAttached({ timeout: 15_000 })
  const sprite = crossing.locator("[data-animal-id]")
  expect((await sprite.boundingBox())!.x).toBeLessThan(0)
  await expect
    .poll(async () => (await sprite.boundingBox())?.x ?? -1, {
      timeout: 6000,
      intervals: [100],
    })
    .toBeGreaterThan(1920 * 0.9)
  await expect(crossing).toHaveCount(0)
  expect(await start.boundingBox()).toEqual(startBefore)
  await start.click()
  await expect(
    page.getByRole("heading", { name: /^My (?:Top Five Life )?Values$/ }),
  ).toBeVisible()
})
