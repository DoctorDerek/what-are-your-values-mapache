import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block" })

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
    await expect(language.getByRole("option")).toHaveText(["English (US)"])
    await language.selectOption("en")
    await game.getByRole("button", { name: "Start", exact: true }).click()
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
