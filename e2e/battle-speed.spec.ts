import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block", reducedMotion: "no-preference" })

for (const rate of [2, 3]) {
  test(`Battle travel and visible sprite frames run together at ${rate}×`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      document.addEventListener(
        "animationstart",
        (event) => {
          const target = event.target
          if (
            !(target instanceof HTMLElement) ||
            event.animationName !== "seething-swarm-approach"
          )
            return
          const image = target.querySelector(
            '[data-battle-active-clip="true"] img',
          )
          if (!image) return
          const style = getComputedStyle(image)
          const frameCount = Number(
            style.getPropertyValue("--animal-animation-step-count"),
          )
          document.documentElement.dataset.battleSpriteFrameMs = String(
            (Number.parseFloat(style.animationDuration) * 1000) / frameCount,
          )
        },
        true,
      )
      document.addEventListener(
        "animationend",
        (event) => {
          const target = event.target
          if (
            !(target instanceof HTMLElement) ||
            event.animationName !== "seething-swarm-approach"
          )
            return
          const style = getComputedStyle(target)
          const image = target.querySelector(
            '[data-battle-active-clip="true"] img',
          )
          if (!image) return
          const frameCount = Number(
            getComputedStyle(image).getPropertyValue(
              "--animal-animation-step-count",
            ),
          )
          document.documentElement.dataset.battleTravelFrameMs = String(
            (Number.parseFloat(style.animationDuration) * 1000) / frameCount,
          )
          document.documentElement.dataset.battleTravelOffset = String(
            Math.abs(new DOMMatrixReadOnly(style.transform).m41),
          )
        },
        true,
      )
    })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    await page
      .getByRole("button", { name: `Battle animation speed ${rate}×` })
      .click()
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toBeEnabled()
    await page
      .getByRole("button", { name: /^Choose / })
      .first()
      .click()
    await expect
      .poll(() =>
        page.locator("html").getAttribute("data-battle-travel-offset"),
      )
      .not.toBeNull()
    const timings = await page.locator("html").evaluate((root) => ({
      frameMs: Number(root.dataset.battleSpriteFrameMs),
      travelFrameMs: Number(root.dataset.battleTravelFrameMs),
      distance: Number(root.dataset.battleTravelOffset),
    }))
    expect(timings.frameMs).toBeCloseTo(100 / rate, 2)
    expect(timings.travelFrameMs).toBeCloseTo(100 / rate, 2)
    expect(timings.distance).toBeGreaterThan(1)
    await expect(
      page.getByRole("button", { name: "Undo", exact: true }),
    ).toBeEnabled()
  })
}

for (const width of [320, 1440]) {
  test(`Battle speed choices remain stable and persist at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const controls = page.getByRole("group", { name: "Battle animation speed" })
    const choiceRows = await controls
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getBoundingClientRect().y),
      )
    expect(new Set(choiceRows).size).toBe(1)
    await expect(
      controls.getByRole("button", { pressed: true }),
    ).toHaveAccessibleName("Battle animation speed 1×")
    const before = await controls.boundingBox()
    for (const name of [
      "Battle animation speed 2×",
      "Battle animation speed 3×",
      "Skip battle animations",
    ]) {
      const choice = controls.getByRole("button", { name })
      await choice.hover()
      expect(await controls.boundingBox()).toEqual(before)
      await choice.click()
      await expect(choice).toHaveAttribute("aria-pressed", "true")
      await expect(
        page.getByRole("button", { name: "Menu", exact: true }),
      ).toBeEnabled()
      expect(await controls.boundingBox()).toEqual(before)
    }
    await page.screenshot({ path: testInfo.outputPath("battle-controls.png") })
    await page.reload()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    await expect(
      controls.getByRole("button", { name: "Skip battle animations" }),
    ).toHaveAttribute("aria-pressed", "true")
    const choices = page.getByRole("button", { name: /^Choose / })
    const pair = await choices.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")),
    )
    await choices.first().click()
    await expect
      .poll(() =>
        choices.evaluateAll((buttons) =>
          buttons.map((button) => button.getAttribute("aria-label")),
        ),
      )
      .not.toEqual(pair)
    await expect(
      page.getByRole("button", { name: "Undo", exact: true }),
    ).toBeEnabled()
    await page.getByRole("button", { name: "Stop", exact: true }).click()
    await expect(
      page.getByRole("heading", { name: "Results", exact: true }),
    ).toBeVisible()
    await expect(
      page.getByRole("status").filter({ hasText: "Saved locally" }),
    ).toBeVisible()
  })
}
