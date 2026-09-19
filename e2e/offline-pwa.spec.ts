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
  if (browserName === "chromium")
    await page.route("**/*", (route) => route.continue())
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
  expect(cacheNames).toContain("wayvm-animal-strips-v1")
  const shellCaches = cacheNames.filter((name) =>
    name.includes("serwist-precache"),
  )
  expect(shellCaches).toHaveLength(1)
  const shellUrls = await page.evaluate(async (name) => {
    const cache = await caches.open(name)
    return (await cache.keys()).map((request) => request.url)
  }, shellCaches[0])
  expect(shellUrls.some((url) => /_strip\d+\./.test(url))).toBe(false)
  const cachedAnimalUrls = await page.evaluate(async () => {
    const cache = await caches.open("wayvm-animal-strips-v1")
    return (await cache.keys()).map((request) => request.url)
  })
  expect(cachedAnimalUrls.length).toBeGreaterThan(0)
  expect(cachedAnimalUrls.length).toBeLessThan(775)
  testInfo.annotations.push({
    type: "cache-scope",
    description: `${shellUrls.length} shell entries; ${cachedAnimalUrls.length} requested animal strips cached after controlled Hub reload`,
  })
  await context.setOffline(true)
  await page.reload({ waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("heading", { name: "Your Values", exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      async (url) => (await fetch(url)).ok,
      cachedAnimalUrls[0],
    ),
  ).toBe(true)
  await page
    .getByRole("button", { name: "Add Custom Value", exact: true })
    .click()
  await page.getByLabel("Value name", { exact: true }).fill("Offline ingenuity")
  await page
    .getByLabel("Definition", { exact: true })
    .fill("to solve problems without a connection")
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(
    page.getByText("Your Custom Values are saved and ready to battle.", {
      exact: true,
    }),
  ).toBeVisible()
  await page.reload({ waitUntil: "domcontentloaded" })
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .click()
  await page
    .getByLabel("Search All Values", { exact: true })
    .fill("Offline ingenuity")
  await expect(page.getByText("1 Value Shown", { exact: true })).toBeVisible()
  await page.evaluate(() => caches.delete("wayvm-animal-strips-v1"))
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.getByRole("button", { name: "Battle", exact: true }).click()
  const customChoice = page.getByRole("button", {
    name: /^Choose Offline ingenuity\./,
  })
  await expect(customChoice).toBeEnabled()
  await expect(page.getByRole("button", { name: /^Choose / })).toHaveCount(2)
  if (browserName === "chromium") {
    await expect(page.locator("[data-placeholder-playback]")).toHaveCount(2)
  } else {
    testInfo.annotations.push({
      type: "verification-limit",
      description:
        "Firefox may retain decoded/HTTP-cached artwork; Chromium verifies forced cache-miss placeholders. Both verify offline custom-value persistence and battle commits.",
    })
    for (const side of ["first", "second"]) {
      const combatant = page.locator(`[data-combatant-side="${side}"]`)
      await expect(
        combatant.locator(
          '[data-placeholder-playback], [data-battle-active-clip="true"] img',
        ),
      ).toBeVisible()
    }
  }
  await customChoice.click()
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled()
  await context.setOffline(false)
  await page.reload({ waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Battle", exact: true }).click()
  await expect(
    page.getByRole("button", { name: /^Choose / }).first(),
  ).toBeEnabled()
  await expect(page.locator("[data-placeholder-playback]")).toHaveCount(0)
})

test("preserves previously precached animal art before activating the new cache policy", async ({
  page,
  context,
  browserName,
  isProtectedVercelPreview,
}) => {
  test.skip(
    !playwrightTestBaseUrl ||
      isProtectedVercelPreview ||
      browserName === "webkit",
    "Requires an unprotected production worker and offline-capable browser",
  )
  const worker = await page.request.get("/sw.js")
  const animalPath = (await worker.text()).match(
    /\/_next\/static\/media\/[^"\s]+_strip\d+\.[^"\s]+\.png/,
  )?.[0]
  expect(animalPath).toBeDefined()
  await page.goto("/icons/icon-192.png")
  await page.evaluate(async (path) => {
    if (!path) throw new Error("Missing animal fixture")
    const cache = await caches.open("serwist-precache-legacy-test")
    await cache.put(`${path}?__WB_REVISION__=legacy`, await fetch(path))
  }, animalPath)
  await page.goto("/")
  await waitForControlledApplication(page)
  await context.setOffline(true)
  const restored = await page.evaluate(async (path) => {
    if (!path) throw new Error("Missing animal fixture")
    const cache = await caches.open("wayvm-animal-strips-v1")
    const cached = await cache.match(path)
    const response = await fetch(path)
    return {
      cached: Boolean(cached),
      ok: response.ok,
      bytes: (await response.arrayBuffer()).byteLength,
    }
  }, animalPath)
  expect(restored.cached).toBe(true)
  expect(restored.ok).toBe(true)
  expect(restored.bytes).toBeGreaterThan(0)
})
