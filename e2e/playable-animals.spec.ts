import { expect, type Locator } from "@playwright/test"
import { test } from "./fixtures"

test("Reduced Motion keeps added animals in their calm first frame on row taps", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).tap()
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .tap()
  for (const value of ["order", "fitness", "caring"]) {
    const row = page.locator(`[id="all-values-row-pvcs-2011:${value}"]`)
    await row.scrollIntoViewIfNeeded()
    const visible = row.locator('[data-hub-active-clip="true"]')
    const sprite = visible.locator("img")
    await expect(sprite).toHaveAttribute(
      "src",
      /(?:squirrel|tiger|bear)_idle_strip/,
    )
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

test("Bear varies complete attacks and preserves the next usable comparison", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", {
      value: () => "00000000-0000-4000-8000-00000000046e",
    })
  })
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).tap()
  await page.getByRole("button", { name: "Battle", exact: true }).tap()
  const stage = page.locator("[data-choreography-identity]")
  const identity = await stage.getAttribute("data-choreography-identity")
  const attacks = ["bite", "stand_attack01", "stand_attack02"]
  for (const attack of attacks) {
    const bear = stage.locator('[data-combatant-side="first"]')
    await expect(bear).toHaveAttribute("data-animal-id", "bearpack")
    await stage.locator('[data-battle-arena-side="first"]').tap()
    const sprite = bear.locator('[data-battle-active-clip="true"] img')
    await expect(sprite).toHaveAttribute(
      "src",
      new RegExp(`bear_${attack}_strip`),
    )
    await expect
      .poll(() =>
        sprite.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true)
    if (attack.startsWith("stand_"))
      await expect(sprite).toHaveAttribute("src", /bear_stand_go_down_strip/)
    await expect(stage).not.toHaveAttribute(
      "data-choreography-identity",
      identity!,
    )
    await expect(
      page.getByRole("button", { name: "Undo", exact: true }),
    ).toBeEnabled()
    if (attack !== attacks.at(-1)) {
      await page.getByRole("button", { name: "Undo", exact: true }).tap()
      await expect(stage).toHaveAttribute(
        "data-choreography-identity",
        identity!,
      )
    }
  }
  await page.getByRole("button", { name: "Stop", exact: true }).tap()
  await expect(
    page.getByRole("heading", { name: "Results", exact: true }),
  ).toBeVisible()
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
  const search = page.getByRole("searchbox")
  await search.fill("fitness")
  await tapTigerTwice(page.locator('[id="all-values-row-pvcs-2011:fitness"]'))
  await expect(search).toBeFocused()
  await expect(search).toHaveValue("fitness")
  await page.reload()
  await expect(
    page.getByRole("button", { name: "Battle", exact: true }),
  ).toBeVisible()
  await expect(page.locator('[id="hub-value-pvcs-2011:fitness"]')).toBeVisible()
})

test("an unavailable optional Tiger blink preserves the already decoded portrait", async ({
  page,
}) => {
  await page.route(/tiger_idle_blink_strip\d+\./, (route) => route.abort())
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).tap()
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .tap()
  await page.getByRole("searchbox").fill("fitness")
  const row = page.locator('[id="all-values-row-pvcs-2011:fitness"]')
  const pose = row.locator('[data-hub-active-clip="true"] img')
  await expect(pose).toHaveAttribute("src", /tiger_idle_strip/)
  await expect
    .poll(() => pose.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)
  const failure = page.waitForEvent("requestfailed", (req) =>
    req.url().includes("tiger_idle_blink_strip"),
  )
  await row.tap()
  await failure
  await expect(pose).toBeVisible()
  await expect(pose).not.toHaveAttribute("src", /idle_blink/)
  await expect
    .poll(() => pose.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)
  await expect(
    row.getByRole("heading", { name: "Fitness", exact: true }),
  ).toBeVisible()
})
