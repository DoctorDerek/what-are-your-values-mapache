import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({
  viewport: { width: 320, height: 640 },
  reducedMotion: "no-preference",
})

test("Saved locally fades without moving the Results composition", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start" }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).click()
  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
  await page.getByRole("button", { name: /Stop/ }).click()
  const confirmation = page
    .getByRole("status")
    .filter({ hasText: "Saved locally" })
  await expect(confirmation).toBeVisible()
  const roster = page.getByRole("list", { name: "Your value results" })
  const before = await roster.boundingBox()
  await expect(confirmation).not.toBeVisible({ timeout: 7000 })
  expect(await roster.boundingBox()).toEqual(before)
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await page.getByRole("button", { name: "Settings", exact: true }).click()
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Results", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("status").filter({ hasText: "Saved locally" }),
  ).toHaveCount(0)
})

test("browser Back closes actual parents, preserves drafts and permits Hub departure", async ({
  page,
}) => {
  await page.goto("/robots.txt")
  await page.goto("/")
  await page.getByRole("button", { name: "Start" }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).waitFor()
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(history.state?.wayvmSemanticBackBoundary)),
    )
    .toBe(false)
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .click()
  await page.evaluate(() => history.back())
  await expect(
    page.getByRole("heading", {
      name: /^My (?:Top Five Life )?Values$/,
      exact: true,
    }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Add value", exact: true }).click()
  await page.getByLabel("Value name", { exact: true }).fill("Keep my draft")
  await page.evaluate(() => history.back())
  await expect(page.getByLabel("Value name", { exact: true })).toHaveValue(
    "Keep my draft",
  )
  await page
    .getByLabel("Definition", { exact: true })
    .fill("to retain my considered choices")
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(
    page.getByText("Your Custom Values are saved and ready to battle.", {
      exact: true,
    }),
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(history.state?.wayvmSemanticBackBoundary)),
    )
    .toBe(false)
  await page.goBack()
  await expect(page).toHaveURL(/\/robots\.txt$/)
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
    let firstRank: number | undefined
    let rankWidth: string | undefined
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
      const roster = row.closest("ol")!.parentElement!
      const rosterBounds = roster.getBoundingClientRect()
      const identity = row.querySelector('div[aria-hidden="true"]')!
      const rankCounter = identity.querySelector("span.absolute")!
      const rank = Number(rankCounter.textContent?.replace("#", ""))
      firstRank ??= rank
      const currentRankWidth = getComputedStyle(
        rankCounter.parentElement!,
      ).width
      rankWidth ??= currentRankWidth
      if (rankWidth !== currentRankWidth)
        document.documentElement.dataset.resultsRankShifted = "true"
      if (rank !== firstRank && rank !== 1)
        document.documentElement.dataset.resultsRankCounted = "true"
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
        if (Math.abs(row.getBoundingClientRect().top - firstPosition) > 40)
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
    "data-results-rank-counted",
    "true",
  )
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-results-rank-shifted",
    "true",
  )
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
  ).toHaveCount(103)
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
    page.getByRole("heading", {
      level: 2,
      name: /^My (?:Top Five Life )?Values$/,
    }),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0)
})

for (const viewport of [
  { width: 320, height: 640 },
  { width: 1440, height: 900 },
]) {
  test(`final strongest value owns overlapping row pixels at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.getByRole("button", { name: "Start" }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const choices = page.getByRole("button", { name: /^Choose / })
    const firstChoice = await choices.first().getAttribute("aria-label")
    await (
      firstChoice?.startsWith("Choose Acceptance")
        ? choices.last()
        : choices.first()
    ).click()
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
    await page.evaluate(() => {
      let overlapSamples = 0
      let lastSampleAt = 0
      const observer = new MutationObserver(() => {
        const roster = document.querySelector(
          'ol[aria-label="Your value results"]',
        )
        if (!roster || performance.now() - lastSampleAt < 100) return
        lastSampleAt = performance.now()
        const rosterBounds = roster.parentElement!.getBoundingClientRect()
        const rows = [...roster.querySelectorAll("li")].slice(0, 12)
        for (let index = 0; index < rows.length - 1; index += 1) {
          const stronger = rows[index]
          const weaker = rows[index + 1]
          const strongerBounds = stronger.getBoundingClientRect()
          const weakerBounds = weaker.getBoundingClientRect()
          const top = Math.max(
            strongerBounds.top,
            weakerBounds.top,
            rosterBounds.top,
          )
          const bottom = Math.min(
            strongerBounds.bottom,
            weakerBounds.bottom,
            rosterBounds.bottom,
          )
          if (bottom <= top) continue
          overlapSamples += 1
          const painted = document.elementFromPoint(
            strongerBounds.left + strongerBounds.width / 2,
            (top + bottom) / 2,
          )
          const coveringRows = rows.filter((row) => {
            const bounds = row.getBoundingClientRect()
            const x = strongerBounds.left + strongerBounds.width / 2
            const y = (top + bottom) / 2
            return (
              x >= bounds.left &&
              x < bounds.right &&
              y >= bounds.top &&
              y < bounds.bottom
            )
          })
          const foreground = coveringRows.toSorted(
            (first, second) =>
              Number(getComputedStyle(second).zIndex) -
              Number(getComputedStyle(first).zIndex),
          )[0]
          if (!foreground.contains(painted))
            document.documentElement.dataset.resultsStackObscured = "true"
        }
        if (overlapSamples >= 5)
          document.documentElement.dataset.resultsStackVerified = "true"
        if (!roster.isConnected) observer.disconnect()
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
        childList: true,
        subtree: true,
      })
    })
    await page.getByRole("button", { name: /Stop/ }).click()
    await expect(page.locator("html")).toHaveAttribute(
      "data-results-stack-verified",
      "true",
    )
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-results-stack-obscured",
      "true",
    )
    const roster = page.getByRole("list", { name: "Your value results" })
    const stackingOrders = await roster.getByRole("listitem").evaluateAll(
      (rows) => rows.map((row) => Number(getComputedStyle(row).zIndex)),
    )
    expect(stackingOrders[0]).toBeGreaterThan(
      Math.max(...stackingOrders.slice(1)),
    )
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toBeVisible()
    await page.getByRole("button", { name: "See my values" }).click()
    await expect(
      page.getByRole("heading", {
        name: /^My (?:Top Five Life )?Values$/,
        level: 2,
      }),
    ).toBeVisible()
  })

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
    await page.mouse.move(0, 0)
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
      page.getByRole("heading", {
        name: /^My (?:Top Five Life )?Values$/,
        level: 2,
      }),
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
        const bounds = element.parentElement!.getBoundingClientRect()
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
    for (let rowIndex = 0; rowIndex < 2; rowIndex += 1) {
      expect(
        evidence.filter((sample) => sample[rowIndex].painted).length,
      ).toBeGreaterThanOrEqual(2)
    }
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
      page.getByRole("heading", {
        name: /^My (?:Top Five Life )?Values$/,
        level: 2,
      }),
    ).toBeVisible()
  })
}
