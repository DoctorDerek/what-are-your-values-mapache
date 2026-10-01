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
  const firstChoice = await choices.first().getAttribute("aria-label")
  await (
    firstChoice?.startsWith("Choose Acceptance")
      ? choices.last()
      : choices.first()
  ).click()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
  await page.evaluate(() => {
    let firstPosition: number | undefined
    let startedAt: number | undefined
    let visibleSamples = 0
    let lastVisibleSampleAt = 0
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
      const roster = row.closest("ol")!
      const rosterBounds = roster.getBoundingClientRect()
      const identity = row.querySelector('div[aria-hidden="true"]')!
      const rewardElements = [
        identity.querySelector("span")!,
        ...identity.querySelectorAll("div.flex-wrap > span"),
        identity.querySelector('[data-slot="progress"]')!,
        identity.querySelector('[data-value-presentation="animal"]'),
      ].filter((element) => element !== null)
      if (
        elapsedMs > 300 &&
        elapsedMs < 3_400 &&
        elapsedMs - lastVisibleSampleAt >= 300
      ) {
        const visible = rewardElements.every((element) => {
          const bounds = element.getBoundingClientRect()
          const centerX = bounds.left + bounds.width / 2
          const centerY = bounds.top + bounds.height / 2
          return (
            bounds.width > 0 &&
            bounds.height > 0 &&
            centerY >= rosterBounds.top &&
            centerY < rosterBounds.bottom &&
            row.contains(document.elementFromPoint(centerX, centerY))
          )
        })
        if (!visible)
          document.documentElement.dataset.resultsRewardObscured = "true"
        else visibleSamples += 1
        lastVisibleSampleAt = elapsedMs
        if (visibleSamples >= 5)
          document.documentElement.dataset.resultsRewardVisible = "true"
      }
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
  await expect(page.locator("html")).toHaveAttribute(
    "data-results-reward-visible",
    "true",
  )
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-results-reward-obscured",
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
    const firstRow = roster.getByRole("listitem").first()
    await expect(
      firstRow.locator(
        '[data-hub-active-clip="true"] [data-playback-ready="true"]',
      ),
    ).toHaveCount(1)
    await firstRow.hover()
    await expect(
      firstRow.locator(
        '[data-hub-active-clip="true"] [data-playback-mode="one-shot"][data-playback-ready="true"]',
      ),
    ).toHaveCount(1)
    await page.mouse.move(0, 0)
    await expect(
      firstRow.locator(
        '[data-hub-active-clip="true"] [data-playback-mode="loop"]',
      ),
    ).toHaveCount(1)
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

  test(`multiple promoted rewards remain painted during simultaneous fills at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.getByRole("button", { name: "Start" }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const choices = page.getByRole("button", { name: /^Choose / })
    await choices.first().click()
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
    await choices.first().click()
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
    await page.getByRole("button", { name: /Stop/ }).click()
    const roster = page.getByRole("list", { name: "Your value results" })
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible()
    const evidence = await roster.evaluate(async (element) => {
      const samples = []
      for (let index = 0; index < 5; index += 1) {
        const bounds = element.getBoundingClientRect()
        const rows = [...element.querySelectorAll("li")].slice(0, 2)
        samples.push(
          rows.map((row) => {
            const reward = row.querySelector('[data-slot="progress"]')!
            const box = reward.getBoundingClientRect()
            return {
              painted:
                box.width > 0 &&
                box.top >= bounds.top &&
                box.bottom <= bounds.bottom &&
                row.contains(
                  document.elementFromPoint(
                    box.left + box.width / 2,
                    box.top + box.height / 2,
                  ),
                ),
              fill: reward.getAttribute("aria-valuenow"),
              identity: row.querySelector(".sr-only")?.textContent,
            }
          }),
        )
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      return samples
    })
    expect(
      evidence.every((sample) => sample.every(({ painted }) => painted)),
    ).toBe(true)
    expect(evidence[0].map(({ identity }) => identity)).toEqual(
      evidence[4].map(({ identity }) => identity),
    )
    expect(evidence[0].map(({ fill }) => fill)).not.toEqual(
      evidence[4].map(({ fill }) => fill),
    )
    await page.screenshot({
      path: testInfo.outputPath(`results-visible-${viewport.width}.png`),
    })
    await page.getByRole("button", { name: "See my values" }).click()
    await expect(
      page.getByRole("heading", { name: "Your Values", level: 1 }),
    ).toBeVisible()
  })
}
