import { expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { test } from "./fixtures"

const playwrightTestBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL

async function waitForControlledApplication(page: Page) {
  const serviceWorkerIsReady = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false
    await navigator.serviceWorker.ready
    return true
  })
  expect(serviceWorkerIsReady).toBe(true)

  await page.reload({ waitUntil: "networkidle" })
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true)
}

if (playwrightTestBaseUrl) {
  test("the deployment publishes the generated service worker", async ({
    request,
  }) => {
    const response = await request.get("/sw.js")

    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("javascript")
    expect(await response.text()).toContain("precache")
  })
}

test("the web runtime follows its deployment offline policy", async ({
  browserName,
  context,
  page,
  isProtectedVercelPreview,
}, testInfo) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "What Are Your Values, Mapache?" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Start", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Your Values", exact: true }),
  ).toBeVisible()
  const registrationIsExpected =
    Boolean(playwrightTestBaseUrl) && !isProtectedVercelPreview
  await expect
    .poll(() =>
      page.evaluate(
        async () => (await navigator.serviceWorker.getRegistrations()).length,
      ),
    )
    .toBe(registrationIsExpected ? 1 : 0)

  if (!registrationIsExpected) {
    expect(await page.evaluate(() => caches.keys())).toEqual([])
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller),
    ).toBeNull()
    return
  }

  if (browserName === "webkit") {
    testInfo.annotations.push({
      type: "verification-limit",
      description:
        "WebKit registration only: this runner cannot complete offline navigation. Chromium and Firefox verify the cache and disconnected reload.",
    })
    return
  }

  await waitForControlledApplication(page)

  const cacheNames = await page.evaluate(() => caches.keys())
  expect(cacheNames).toHaveLength(1)
  expect(cacheNames[0]).toContain("serwist-precache")
  await context.setOffline(true)
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("heading", { name: "What Are Your Values, Mapache?" }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Your Values", exact: true }),
  ).toBeVisible()
})
