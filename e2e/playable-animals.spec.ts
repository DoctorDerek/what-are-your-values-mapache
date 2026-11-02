import { expect, type Locator } from "@playwright/test"
import { test } from "./fixtures"

test("Reduced Motion keeps both new animals in their calm first frame on row taps", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).tap()
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .tap()
  for (const value of ["order", "fitness"]) {
    const row = page.locator(`[id="all-values-row-pvcs-2011:${value}"]`)
    await row.scrollIntoViewIfNeeded()
    const visible = row.locator('[data-hub-active-clip="true"]')
    const sprite = visible.locator("img")
    await expect(sprite).toHaveAttribute("src", /(?:squirrel|tiger)_idle_strip/)
    const path = await sprite.getAttribute("src")
    await row.tap()
    await expect(sprite).toHaveAttribute("src", path!)
    await expect(visible.locator("[data-reduced-motion]")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    )
    await expect(sprite).toHaveCSS("animation-name", "none")
  }
})

test.use({
  hasTouch: true,
  serviceWorkers: "block",
  viewport: { width: 390, height: 844 },
})

async function tapTigerTwice(row: Locator) {
  await row.scrollIntoViewIfNeeded()
  const sprite = row.locator('[data-hub-active-clip="true"] img')
  await expect(sprite).toHaveAttribute("src", /tiger_idle/)
  await row.tap()
  await expect(sprite).toHaveAttribute("src", /tiger_crouch/)
  await row.tap()
  await expect(sprite).toHaveAttribute("src", /tiger_roar/)
}

test("Tiger and Squirrel play a real choice and keep their row gestures through Results, Hub and All Values", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", {
      value: () => "00000000-0000-4000-8000-0000000005dc",
    })
  })
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).tap()
  await page.getByRole("button", { name: "Battle", exact: true }).tap()
  const stage = page.locator("[data-choreography-identity]")
  const tiger = stage.locator('[data-combatant-side="first"]')
  await expect(tiger).toHaveAttribute("data-animal-id", "tigerpack")
  await expect(stage.locator('[data-combatant-side="second"]')).toHaveAttribute(
    "data-animal-id",
    "squirrelpack",
  )
  const identity = await stage.getAttribute("data-choreography-identity")
  await stage.locator('[data-battle-arena-side="first"]').tap()
  await expect(stage).not.toHaveAttribute(
    "data-choreography-identity",
    identity!,
  )
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Stop", exact: true }).tap()
  await expect(
    page.getByRole("heading", { name: "Results", exact: true }),
  ).toBeVisible()
  await tapTigerTwice(page.locator('[data-results-value="pvcs-2011:fitness"]'))
  const squirrel = page.locator('[data-results-value="pvcs-2011:order"]')
  await squirrel.tap()
  await expect(
    squirrel.locator('[data-hub-active-clip="true"] img'),
  ).toHaveAttribute("src", /squirrel_idle_blink/)
  await page.getByRole("button", { name: "See my values", exact: true }).tap()
  await tapTigerTwice(page.locator('[id="hub-value-pvcs-2011:fitness"]'))
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .tap()
  await tapTigerTwice(page.locator('[id="all-values-row-pvcs-2011:fitness"]'))
  await page.reload()
  await expect(
    page.getByRole("button", { name: "Battle", exact: true }),
  ).toBeVisible()
  await expect(page.locator('[id="hub-value-pvcs-2011:fitness"]')).toBeVisible()
})
