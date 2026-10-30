import { expect, type Page } from "@playwright/test"
import { test } from "./fixtures"

async function startBattle(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).click()
  await expect(
    page.getByRole("button", { name: /^Choose / }).first(),
  ).toBeEnabled()
}

async function compareNextPair(page: Page) {
  const stage = page.locator("[data-choreography-identity]")
  const identity = await stage.getAttribute("data-choreography-identity")
  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click()
  await expect(stage).not.toHaveAttribute(
    "data-choreography-identity",
    identity!,
  )
  await expect(
    page.getByRole("button", { name: /^Choose / }).first(),
  ).toBeEnabled()
}

function readBattleGeometry(page: Page) {
  return page
    .getByRole("main", { name: "Value battle" })
    .evaluate((surface) => {
      const choices = surface.querySelector<HTMLElement>(
        '[aria-label="Battle choices"]',
      )!
      const measure = (element: Element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y: y + surface.scrollTop, width, height }
      }
      const measureContent = (element: Element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        const viewport = choices.getBoundingClientRect()
        return {
          x: x - viewport.x + choices.scrollLeft,
          y: y - viewport.y + choices.scrollTop,
          width,
          height,
        }
      }
      return {
        scrollTop: surface.scrollTop,
        scrollHeight: surface.scrollHeight,
        scrollWidth: surface.scrollWidth,
        controls: measure(surface.querySelector("nav")!),
        choices: {
          ...measure(choices),
          scrollHeight: choices.scrollHeight,
          scrollWidth: choices.scrollWidth,
        },
        cards: [...choices.querySelectorAll("[data-value-card] button")].map(
          measureContent,
        ),
        arenas: [...choices.querySelectorAll("[data-battle-arena-side]")].map(
          measureContent,
        ),
      }
    })
}

function expectUnchangedBattleGeometry(
  page: Page,
  geometry: Awaited<ReturnType<typeof readBattleGeometry>>,
) {
  const withSubpixelPosition = (bounds: (typeof geometry.cards)[number]) => ({
    ...bounds,
    x: expect.closeTo(bounds.x, 3),
    y: expect.closeTo(bounds.y, 3),
  })
  return expect
    .poll(() => readBattleGeometry(page))
    .toEqual({
      ...geometry,
      cards: geometry.cards.map(withSubpixelPosition),
      arenas: geometry.arenas.map(withSubpixelPosition),
    })
}

for (const viewport of [
  { width: 320, height: 540 },
  { width: 1440, height: 900 },
]) {
  test(`Battle shows earned achievements above its actions without shifting layout at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await startBattle(page)
    await page.evaluate(() => window.dispatchEvent(new Event("blur")))
    await compareNextPair(page)
    const geometry = await readBattleGeometry(page)
    await page.evaluate(() => window.dispatchEvent(new Event("focus")))
    const card = page.getByRole("complementary", {
      name: "Achievement unlocked",
    })
    await expect(card).toBeInViewport({ ratio: 1 })
    await card.hover()
    await expectUnchangedBattleGeometry(page, geometry)
    const bounds = await card.boundingBox()
    const controls = page.getByRole("navigation", { name: "Battle actions" })
    const actionBounds = await controls.boundingBox()
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(actionBounds!.y)
    await expect(
      page.getByRole("button", { name: "Stop", exact: true }),
    ).toBeInViewport({ ratio: 1 })
    await page.screenshot({
      path: testInfo.outputPath("battle-achievement.png"),
    })
    await card.getByRole("button", { name: /^Dismiss achievement/ }).click()
    await expect(card).toHaveCount(0)
    await expectUnchangedBattleGeometry(page, geometry)
  })

  for (const exit of ["See my values", "Keep battling"]) {
    test(`Results ${exit} stays reachable with a hover-paused achievement at ${viewport.width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport)
      await page.clock.install()
      await startBattle(page)
      await compareNextPair(page)
      await page.getByRole("button", { name: "Stop", exact: true }).click()
      await expect(
        page.getByRole("heading", { name: "Results", exact: true }),
      ).toBeVisible()
      const card = page.getByRole("complementary", {
        name: "Achievement unlocked",
      })
      await expect(card).toBeVisible()
      await card.hover()
      const countdown = card.locator("[data-achievement-countdown]")
      const readProgress = () =>
        countdown.evaluate(
          (element) => new DOMMatrix(getComputedStyle(element).transform).a,
        )
      const before = await readProgress()
      await page.clock.fastForward(10_000)
      await expect(card).toBeVisible()
      expect(await readProgress()).toBeCloseTo(before, 2)
      const toast = await card.boundingBox()
      const menu = await page
        .getByRole("button", { name: "Menu", exact: true })
        .boundingBox()
      const profile = await page
        .getByRole("region", { name: "Profile progress" })
        .boundingBox()
      expect(toast!.y).toBeGreaterThan(menu!.y + menu!.height)
      expect(toast!.y + toast!.height).toBeLessThan(profile!.y)
      for (const label of ["See my values", "Keep battling"]) {
        const action = page.getByRole("button", { name: label, exact: true })
        await expect(action).toBeInViewport({ ratio: 1 })
        expect(
          await action.evaluate((element) => {
            const bounds = element.getBoundingClientRect()
            return element.contains(
              document.elementFromPoint(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2,
              ),
            )
          }),
        ).toBe(true)
      }
      await page.screenshot({
        path: testInfo.outputPath("results-visible-achievement.png"),
      })
      await page.getByRole("button", { name: exit, exact: true }).click()
      if (exit === "Keep battling") {
        await expect(
          page.getByRole("button", { name: /^Choose / }).first(),
        ).toBeEnabled()
      } else {
        await expect(
          page.getByRole("button", { name: "Battle", exact: true }),
        ).toBeVisible()
        await expect(card).toBeVisible()
        await card.hover()
        await page.clock.fastForward(10_000)
        await expect(card).toBeVisible()
        await page.screenshot({
          path: testInfo.outputPath("hub-visible-achievement.png"),
        })
        await page
          .getByRole("button", { name: "Browse All Values", exact: true })
          .click()
        await expect(
          page.getByRole("heading", { name: "All Values", exact: true }),
        ).toBeVisible()
      }
    })
  }
}

for (const textSize of [100, 200, 400]) {
  test(`stack arrival, independent dismissal and queued admission never change game geometry at ${textSize}% text`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      width: textSize === 100 ? 390 : 320,
      height: 844,
    })
    await startBattle(page)
    await page.evaluate((size) => {
      document.documentElement.style.fontSize = `${size}%`
    }, textSize)
    await page.evaluate(() => window.dispatchEvent(new Event("blur")))
    for (let index = 0; index < 10; index += 1) await compareNextPair(page)
    const cards = page.getByRole("complementary", {
      name: "Achievement unlocked",
    })
    await expect(cards).toHaveCount(0)
    const beforeArrival = await readBattleGeometry(page)
    const choices = page.getByRole("region", { name: "Battle choices" })
    const scrollBeforeArrival = await choices.evaluate(
      (element) => element.scrollTop,
    )
    await page.evaluate(() => window.dispatchEvent(new Event("focus")))
    await expect(cards).toHaveCount(2)
    await expect(cards.first().getByRole("heading")).toHaveText("5 Battles")
    await expect(cards.last().getByRole("heading")).toHaveText("First Battle")
    await expectUnchangedBattleGeometry(page, beforeArrival)
    expect(await choices.evaluate((element) => element.scrollTop)).toBe(
      scrollBeforeArrival,
    )
    await cards.first().hover()
    await page.screenshot({
      path: testInfo.outputPath("achievement-stack.png"),
    })
    const beforeFirstDismissal = await readBattleGeometry(page)
    await cards
      .first()
      .getByRole("button", { name: /^Dismiss achievement/ })
      .click()
    await expect(
      page.getByRole("button", { name: "Dismiss achievement: 5 Battles" }),
    ).toHaveCount(0)
    await expect(cards).toHaveCount(2)
    await expect(cards.first().getByRole("heading")).not.toHaveText(
      "First Battle",
    )
    await expect(cards.last().getByRole("heading")).toHaveText("First Battle")
    await expectUnchangedBattleGeometry(page, beforeFirstDismissal)
    const olderDismissButton = cards
      .last()
      .getByRole("button", { name: /^Dismiss achievement/ })
    await olderDismissButton.scrollIntoViewIfNeeded()
    const beforeOlderDismissal = await readBattleGeometry(page)
    await olderDismissButton.click()
    await expect(
      page.getByRole("button", { name: "Dismiss achievement: First Battle" }),
    ).toHaveCount(0)
    await expectUnchangedBattleGeometry(page, beforeOlderDismissal)
  })
}

test("the rainbow clock pauses for hover, focus and inactivity then expires without moving gameplay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
  await startBattle(page)
  await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"))
  await compareNextPair(page)
  const card = page.getByRole("complementary", { name: "Achievement unlocked" })
  await expect(card).toBeVisible()
  const dismiss = card.getByRole("button", { name: /^Dismiss achievement/ })
  const countdown = card.locator("[data-achievement-countdown]")
  const readProgress = () =>
    countdown.evaluate(
      (element) => new DOMMatrix(getComputedStyle(element).transform).a,
    )
  const geometry = await readBattleGeometry(page)
  await page.clock.runFor(2_000)
  const afterTwoSeconds = await readProgress()
  expect(afterTwoSeconds).toBeGreaterThan(0)
  expect(afterTwoSeconds).toBeLessThan(0.95)
  await card.dispatchEvent("pointerdown", { pointerType: "touch" })
  const touchingProgress = await readProgress()
  await page.clock.runFor(10_000)
  expect(await readProgress()).toBeCloseTo(touchingProgress, 2)
  await card.dispatchEvent("pointerup", { pointerType: "touch" })
  await card.hover()
  const hoveringProgress = await readProgress()
  await page.clock.runFor(10_000)
  expect(await readProgress()).toBeCloseTo(hoveringProgress, 2)
  await dismiss.focus()
  await page.mouse.move(0, 843)
  await page.clock.runFor(10_000)
  expect(await readProgress()).toBeCloseTo(hoveringProgress, 2)
  await dismiss.evaluate((element) => element.blur())
  await page.evaluate(() => window.dispatchEvent(new Event("blur")))
  await page.clock.runFor(10_000)
  expect(await readProgress()).toBeCloseTo(hoveringProgress, 2)
  await page.evaluate(() => window.dispatchEvent(new Event("focus")))
  await page.clock.runFor(8_000)
  await expect(card).toHaveCount(0)
  await expectUnchangedBattleGeometry(page, geometry)
  await expect(
    page.getByRole("button", { name: /^Choose / }).first(),
  ).toBeEnabled()
})
