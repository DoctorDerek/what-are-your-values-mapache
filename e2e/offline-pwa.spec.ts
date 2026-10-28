import { expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import { SHIPPED_LOCALES } from "#game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

const playwrightTestBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL
const registrationIsExpected =
  Boolean(playwrightTestBaseUrl) &&
  process.env.PLAYWRIGHT_VERCEL_TRUSTED_OIDC !== "true"

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

async function seedPreviouslyCachedAnimalArt(page: Page) {
  const worker = await page.request.get("/sw.js")
  const animalPath = (await worker.text()).match(
    /\/_next\/static\/media\/[^"\s]+_strip\d+\.[^"\s]+\.png/,
  )?.[0]
  if (!animalPath) throw new Error("Built service worker has no animal fixture")
  await page.goto("/icons/icon-192.png")
  await page.evaluate(async (path) => {
    const cache = await caches.open(`serwist-precache-v2-${location.origin}/`)
    const response = await fetch(path)
    const headers = new Headers(response.headers)
    headers.set("x-cache-fixture", "previously-precached")
    await cache.put(
      `${path}?__WB_REVISION__=legacy`,
      new Response(await response.arrayBuffer(), {
        headers,
        status: response.status,
      }),
    )
  }, animalPath)
  return animalPath
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

for (const locale of SHIPPED_LOCALES) {
  test(`${locale} reload preserves its document and immediate All Values navigation`, async ({
    browserName,
    context,
    page,
  }, testInfo) => {
    const catalog = getLocaleCatalog(locale)
    const browse = page.getByRole("button", {
      name: catalog.hub.browse,
      exact: true,
    })
    const search = page.getByRole("searchbox", {
      name: catalog.interfaceCopy.screen.searchAllValues,
      exact: true,
    })
    const expectedDocumentLanguage = new RegExp(
      `<html[^>]*lang="${catalog.metadata.languageTag}"`,
    )
    await page.emulateMedia({ reducedMotion: "reduce" })
    const initialResponse = await page.goto(catalog.metadata.webPath)
    expect(await initialResponse!.text()).toMatch(expectedDocumentLanguage)
    await page
      .getByRole("button", {
        name: catalog.introduction.startAction,
        exact: true,
      })
      .click()
    await browse.click()
    await search.fill("reload regression")
    if (registrationIsExpected) {
      await page.evaluate(() => navigator.serviceWorker.ready)
      const cachedDocument = await page.evaluate(async (path) => {
        const response = await caches.match(path, { ignoreSearch: true })
        return response?.text()
      }, catalog.metadata.webPath)
      expect(cachedDocument).toMatch(expectedDocumentLanguage)
    }

    async function reloadAndBrowseValues() {
      const response = await page.reload({ waitUntil: "domcontentloaded" })
      expect(response!.fromServiceWorker()).toBe(registrationIsExpected)
      await browse.click()
      await search.fill("reload regression")
      await expect(search).toHaveValue("reload regression")
      await expect(page.getByRole("listitem")).toHaveCount(0)
      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        catalog.metadata.languageTag,
      )
    }

    await reloadAndBrowseValues()
    if (!registrationIsExpected) return
    if (browserName === "webkit") {
      testInfo.annotations.push({
        type: "verification-limit",
        description:
          "WebKit verifies the controlled online reload; Chromium and Firefox also verify the localized document and navigation offline.",
      })
      return
    }
    await context.setOffline(true)
    await reloadAndBrowseValues()
  })
}

test("the web runtime follows its deployment offline policy", async ({
  browserName,
  context,
  page,
}, testInfo) => {
  if (browserName === "chromium")
    await page.route("**/*", (route) => route.continue())
  await page.emulateMedia({ reducedMotion: "reduce" })
  const legacyAnimalPath =
    registrationIsExpected && browserName !== "webkit"
      ? await seedPreviouslyCachedAnimalArt(page)
      : null
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "What Are Your Values, Mapache?" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Start", exact: true }).click()
  await expect(
    page.getByRole("heading", {
      name: /^My (?:Top Five Life )?Values$/,
      exact: true,
    }),
  ).toBeVisible()
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
    page.getByRole("heading", {
      name: /^My (?:Top Five Life )?Values$/,
      exact: true,
    }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      async (url) => (await fetch(url)).ok,
      cachedAnimalUrls[0],
    ),
  ).toBe(true)
  if (legacyAnimalPath) {
    const restored = await page.evaluate(async (path) => {
      const cache = await caches.open("wayvm-animal-strips-v1")
      const cached = await cache.match(path)
      const response = await fetch(path)
      return {
        cacheSource: cached?.headers.get("x-cache-fixture"),
        responseSource: response.headers.get("x-cache-fixture"),
        ok: response.ok,
        bytes: (await response.arrayBuffer()).byteLength,
      }
    }, legacyAnimalPath)
    expect(restored.cacheSource).toBe("previously-precached")
    expect(restored.responseSource).toBe("previously-precached")
    expect(restored.ok).toBe(true)
    expect(restored.bytes).toBeGreaterThan(0)
  }
  await page.getByRole("button", { name: "Add value", exact: true }).click()
  await page.getByLabel("Value name", { exact: true }).fill("Offline ingenuity")
  await page
    .getByLabel("Definition", { exact: true })
    .fill("to solve problems without a connection")
  await Promise.all([
    page.waitForEvent("framenavigated", {
      predicate: (frame) => frame === page.mainFrame(),
    }),
    page.getByRole("button", { name: "Save", exact: true }).click(),
  ])
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
    .getByRole("searchbox", { name: "Search All Values", exact: true })
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
