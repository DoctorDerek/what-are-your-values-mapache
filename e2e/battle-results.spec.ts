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
    const observer = new MutationObserver(() => {
      const indicator = document.querySelector(
        '[aria-label="Profile progress"] [data-slot="progress-indicator"]',
      )
      const transform = indicator?.getAttribute("style")
      if (transform && !transform.includes("translateX(-100%)")) {
        document.documentElement.dataset.resultsBarMoved = "true"
        observer.disconnect()
      }
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
