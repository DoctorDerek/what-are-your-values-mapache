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
    await expect(game.locator("noscript p")).toBeHidden()
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
    await game.getByRole("button", { name: "Start", exact: true }).click()
    await expect(
      game.getByRole("heading", { name: "Your Values", exact: true }),
    ).toBeVisible()

    await page.reload()
    await expect(
      game.getByRole("heading", { name: "Your Values", exact: true }),
    ).toBeVisible()
    await expect(
      game.getByRole("button", { name: "Start", exact: true }),
    ).toHaveCount(0)
  } finally {
    scriptsReady.resolve()
    await page.unrouteAll({ behavior: "wait" })
  }
})

test.describe("startup without JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("keeps the static Introduction reachable instead of promising to finish loading", async ({
    page,
  }) => {
    await page.goto("/")
    const game = page.getByRole("region", {
      name: "Play What Are Your Values, Mapache?",
    })
    const explanation = game.locator("noscript p")
    await expect(explanation).toHaveText(
      "The interactive game requires JavaScript.",
    )
    await expect(explanation).toBeVisible()
    await game.getByRole("link", { name: "Read the Introduction" }).click()
    await expect(page).toHaveURL(/#introduction$/)
    await expect(page.locator("#introduction")).toBeInViewport()
    await expect(
      game.getByRole("button", { name: "Start", exact: true }),
    ).toHaveCount(0)
  })
})
