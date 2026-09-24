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
      const measure = (element: Element) => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return { x, y: y + surface.scrollTop, width, height }
      }
      return {
        scrollTop: surface.scrollTop,
        scrollHeight: surface.scrollHeight,
        scrollWidth: surface.scrollWidth,
        controls: measure(surface.querySelector("nav")!),
        cards: [...surface.querySelectorAll("[data-value-card] button")].map(
          measure,
        ),
        arenas: [...surface.querySelectorAll("[data-battle-arena-side]")].map(
          measure,
        ),
      }
    })
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
    await page.evaluate(() => window.dispatchEvent(new Event("focus")))
    await expect(cards).toHaveCount(2)
    await expect(cards.first().getByRole("heading")).toHaveText("5 Battles")
    await expect(cards.last().getByRole("heading")).toHaveText("First Battle")
    await expect.poll(() => readBattleGeometry(page)).toEqual(beforeArrival)
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
    await expect
      .poll(() => readBattleGeometry(page))
      .toEqual(beforeFirstDismissal)
    const olderDismissButton = cards
      .last()
      .getByRole("button", { name: /^Dismiss achievement/ })
    await olderDismissButton.scrollIntoViewIfNeeded()
    const beforeOlderDismissal = await readBattleGeometry(page)
    await olderDismissButton.click()
    await expect(
      page.getByRole("button", { name: "Dismiss achievement: First Battle" }),
    ).toHaveCount(0)
    await expect
      .poll(() => readBattleGeometry(page))
      .toEqual(beforeOlderDismissal)
  })
}

test("the rainbow clock pauses for hover, focus and inactivity then expires without moving gameplay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.install()
  await startBattle(page)
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
  await page.clock.pauseAt(new Date(Date.now() + 1_000))
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
  await expect.poll(() => readBattleGeometry(page)).toEqual(geometry)
  await expect(
    page.getByRole("button", { name: /^Choose / }).first(),
  ).toBeEnabled()
})
