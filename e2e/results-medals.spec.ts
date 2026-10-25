import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block", reducedMotion: "no-preference" })

for (const width of [320, 1440]) {
  test(`Results medals progress visibly without shifting their slot at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width === 320 ? 720 : 900 })
    await page.addInitScript(() => {
      Object.defineProperty(crypto, "randomUUID", {
        value: () => "bfc518dd-4ee2-42c6-906a-e9baf8edfc40",
      })
    })
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
    await page.screenshot({
      path: testInfo.outputPath(`results-medals-${width}.png`),
    })
  })
}
