import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({
  serviceWorkers: "block",
  reducedMotion: "no-preference",
  screenshot: "only-on-failure",
})

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", {
      value: () => "bfc518dd-4ee2-42c6-906a-e9baf8edfc40",
    })
  })
})

for (const width of [320, 1440]) {
  test(`First Results reveal medal tiers before sorting finishes at ${width}px`, async ({
    page,
  }) => {
    await page.clock.install()
    await page.setViewportSize({ width, height: width === 320 ? 720 : 900 })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    await page
      .getByRole("button", { name: "Skip battle animations", exact: true })
      .click()
    const winnerId = await page
      .locator('[data-combatant-side="first"]')
      .getAttribute("data-value-id")
    await page.getByRole("button", { name: /^Choose / }).first().click()
    await page
      .getByRole("button", {
        name: "Dismiss achievement: First Battle",
        exact: true,
      })
      .click()
    await expect(page.getByRole("button", { name: "Undo", exact: true }))
      .toBeEnabled()
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1_000))
    await page.getByRole("button", { name: "Stop", exact: true }).click()
    const row = page.locator(`[data-results-value="${winnerId}"]`)
    const slot = row.locator("[data-results-medal]")
    await expect(slot).toHaveAttribute("data-results-medal", "none")
    const summary = await row.locator(".sr-only").textContent()
    const initialGeometry = await slot.evaluate((element: HTMLElement) => ({
      width: element.offsetWidth,
      height: element.offsetHeight,
      left: element.offsetLeft,
      top: element.offsetTop,
    }))
    expect(initialGeometry.width).toBe(24)
    expect(initialGeometry.height).toBe(24)
    for (const [advanceMs, medal] of [
      [50, "bronze"],
      [650, "silver"],
      [900, "gold"],
    ] as const) {
      await page.clock.runFor(advanceMs)
      await expect(slot).toHaveAttribute("data-results-medal", medal)
      const image = slot.locator("img")
      await expect(image).toHaveAttribute(
        "src",
        new RegExp(`/${medal}(?:\\.[^/]+)?\\.png$`),
      )
      await image.evaluate((element: HTMLImageElement) => element.decode())
      await expect(image).toBeInViewport()
      const evidence = await slot.evaluate((element: HTMLElement) => {
        const bounds = element.getBoundingClientRect()
        return {
          geometry: {
            width: element.offsetWidth,
            height: element.offsetHeight,
            left: element.offsetLeft,
            top: element.offsetTop,
          },
          painted: element.contains(
            document.elementFromPoint(
              bounds.left + bounds.width / 2,
              bounds.top + bounds.height / 2,
            ),
          ),
        }
      })
      expect(evidence.geometry).toEqual(initialGeometry)
      expect(evidence.painted).toBe(true)
      await expect(row.locator(".sr-only")).toHaveText(summary!)
    }
    await page.clock.runFor(2_100)
    await expect(slot).toHaveAttribute("data-results-medal", "gold")
    await page.getByRole("button", { name: "See my values", exact: true }).click()
    await expect(page.getByRole("button", { name: "Battle", exact: true }))
      .toBeVisible()
  })

  test(`Results medals progress visibly without shifting their slot at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 320 ? 720 : 900 })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    await page
      .getByRole("button", { name: "Skip battle animations", exact: true })
      .click()
    const choices = page.getByRole("button", { name: /^Choose / })
    await choices.first().click()
    await page
      .getByRole("button", {
        name: "Dismiss achievement: First Battle",
        exact: true,
      })
      .click()
    await page.getByRole("button", { name: "Stop", exact: true }).click()
    await page
      .getByRole("button", { name: "See my values", exact: true })
      .click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const winnerId = await page
      .locator('[data-combatant-side="first"]')
      .getAttribute("data-value-id")
    await choices.first().click()
    await expect(
      page.getByRole("button", { name: "Undo", exact: true }),
    ).toBeEnabled()
    await page.getByRole("button", { name: "Stop", exact: true }).click()
    const row = page.locator(`[data-results-value="${winnerId}"]`)
    const summary = await row.locator(".sr-only").textContent()
    expect(summary).toContain("gold medal")
    const evidence = await row.evaluate(async (element) => {
      const slot = element.querySelector<HTMLElement>("[data-results-medal]")!
      const initialWidth = slot.clientWidth
      const initialHeight = slot.clientHeight
      const seen = new Set<string>()
      const startedAt = performance.now()
      let stableGeometry = true
      await new Promise<void>((resolve) => {
        const sample = () => {
          const color = slot.getAttribute("data-results-medal")!
          const image = slot.querySelector("img")
          const bounds = slot.getBoundingClientRect()
          const rosterBounds = element
            .closest("ol")!
            .parentElement!.getBoundingClientRect()
          const centerX = bounds.left + bounds.width / 2
          const centerY = bounds.top + bounds.height / 2
          stableGeometry &&=
            slot.clientWidth === initialWidth &&
            slot.clientHeight === initialHeight
          if (
            image?.complete &&
            image.naturalWidth > 0 &&
            bounds.top >= rosterBounds.top &&
            bounds.bottom <= rosterBounds.bottom &&
            element.contains(document.elementFromPoint(centerX, centerY))
          )
            seen.add(color)
          if (performance.now() - startedAt >= 3_900) resolve()
          else requestAnimationFrame(sample)
        }
        sample()
      })
      return { seen: [...seen], stableGeometry, initialWidth, initialHeight }
    })
    expect(evidence.seen).toEqual(["bronze", "silver", "gold"])
    expect(evidence.stableGeometry).toBe(true)
    expect(evidence.initialWidth).toBe(24)
    expect(evidence.initialHeight).toBe(24)
    await expect(row.locator(".sr-only")).toHaveText(summary!)
    await expect(row.locator("[data-results-medal] img")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "See my values", exact: true }),
    ).toBeInViewport()
    await expect(
      page.getByRole("button", { name: "Keep battling", exact: true }),
    ).toBeInViewport()
    if (width === 320) {
      await page.addStyleTag({ content: "html { font-size: 200%; }" })
      const heading = page.getByRole("heading", {
        name: "Results",
        exact: true,
      })
      const menu = page.getByRole("button", { name: "Menu", exact: true })
      const headingBounds = await heading.boundingBox()
      const menuBounds = await menu.boundingBox()
      expect(headingBounds).not.toBeNull()
      expect(menuBounds).not.toBeNull()
      expect(menuBounds!.y).toBeGreaterThanOrEqual(
        headingBounds!.y + headingBounds!.height,
      )
      const keepBattling = page.getByRole("button", {
        name: "Keep battling",
        exact: true,
      })
      await keepBattling.scrollIntoViewIfNeeded()
      await expect(keepBattling).toBeInViewport()
      await expect(
        page.getByRole("button", { name: "See my values", exact: true }),
      ).toBeInViewport()
    }
  })
}
