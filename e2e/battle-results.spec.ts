import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({
  viewport: { width: 320, height: 640 },
  reducedMotion: "no-preference",
})

test("battle results show committed progress without delaying either exit", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start" }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).click()

  const choices = page.getByRole("button", { name: /^Choose / })
  const entryPair = await choices.evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("aria-label")),
  )
  await choices.first().click()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
  await page.evaluate(() => {
    let firstPosition: number | undefined
    let startedAt: number | undefined
    const observer = new MutationObserver(() => {
      const indicator = document.querySelector(
        '[aria-label="Profile progress"] [data-slot="progress-indicator"]',
      )
      const transform = indicator?.getAttribute("style")
      if (transform && !transform.includes("translateX(-100%)")) {
        document.documentElement.dataset.resultsBarMoved = "true"
      }
      const row = Array.from(
        document.querySelectorAll('ol[aria-label="Your value results"] li'),
      ).find((element) =>
        element.querySelector(".sr-only")?.textContent?.startsWith("Rank 1,"),
      )
      if (!row) return
      startedAt ??= performance.now()
      firstPosition ??= row.getBoundingClientRect().top
      const elapsedMs = performance.now() - startedAt
      const valueTransform = row
        .querySelector('[data-slot="progress-indicator"]')
        ?.getAttribute("style")
      if (
        elapsedMs > 300 &&
        elapsedMs < 3_400 &&
        valueTransform &&
        !valueTransform.includes("translateX(-100%)")
      ) {
        document.documentElement.dataset.resultsValueBarMoved = "true"
        if (Math.abs(row.getBoundingClientRect().top - firstPosition) > 1)
          document.documentElement.dataset.resultsConcurrentSort = "true"
      }
      if (elapsedMs >= 3_800) observer.disconnect()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    })
  })
  await page.getByRole("button", { name: /Stop/ }).click()

  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute(
    "data-results-bar-moved",
    "true",
  )
  await expect(page.locator("html")).toHaveAttribute(
    "data-results-value-bar-moved",
    "true",
  )
  await expect(page.locator("html")).toHaveAttribute(
    "data-results-concurrent-sort",
    "true",
  )
  await expect(
    page
      .getByRole("list", { name: "Your value results" })
      .getByRole("listitem"),
  ).toHaveCount(100)
  await expect(
    page.getByRole("region", { name: "Profile progress" }),
  ).toContainText("Profile XP 4")
  await expect(
    page.getByRole("button", { name: "See my values" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Keep battling" }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)

  await page.getByRole("button", { name: "Keep battling" }).click()
  await expect(page.getByRole("main", { name: "Value battle" })).toBeVisible()
  await expect
    .poll(() =>
      choices.evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label")),
      ),
    )
    .not.toEqual(entryPair)

  await page.getByRole("button", { name: /Stop/ }).click()
  await expect(
    page.getByRole("heading", { level: 1, name: "Your Values" }),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0)
})

for (const viewport of [
  { width: 320, height: 640 },
  { width: 1440, height: 900 },
]) {
  test(`scrolling settles ranking without skipping rewards at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.getByRole("button", { name: "Start" }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    await page
      .getByRole("button", { name: /^Choose / })
      .first()
      .click()
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
    await page.getByRole("button", { name: /Stop/ }).click()
    const roster = page.getByRole("list", { name: "Your value results" })
    const profile = page.getByRole("region", { name: "Profile progress" })
    await expect(profile.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      /[1-9]/,
    )
    await roster.dispatchEvent("wheel", { deltaY: 10 })
    await expect(profile).toContainText("Profile Level 1")
    await expect(roster.getByRole("listitem").first()).toHaveCSS(
      "transform",
      "none",
    )
    await page.screenshot({
      path: testInfo.outputPath(`results-${viewport.width}.png`),
    })
    await expect(profile).toContainText("Profile Level 3")
    await expect(profile).toContainText("Profile XP 4")
    await expect(
      page.getByRole("button", { name: "See my values" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Keep battling" }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.getByRole("button", { name: "See my values" }).click()
    await expect(
      page.getByRole("heading", { name: "Your Values", level: 1 }),
    ).toBeVisible()
  })
}
