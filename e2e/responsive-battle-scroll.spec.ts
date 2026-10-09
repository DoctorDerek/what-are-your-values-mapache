import { expect } from "@playwright/test"
import { expectCompleteBattleTextReachable } from "./battle-text-reachability"
import { test } from "./fixtures"
import { installVisibleTextBounds } from "./visible-text-bounds"

test.use({ serviceWorkers: "block" })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installVisibleTextBounds)
})

interface ResponsiveStrikeEvidence {
  identity: string | null
  side: string | null
  originDistance: number
  contactDistance: number
  expectedContactDistance: number
  baselineDifference: number
  inViewport: boolean
  overlapsVisibleText: boolean
  imageIsLoaded: boolean
  attackerIsUnobscured: boolean
}

declare global {
  interface Window {
    responsiveStrikes: ResponsiveStrikeEvidence[]
  }
}

for (const width of [320, 390, 1280]) {
  test(`Personal Hub preserves the complete ranking before and after comparisons at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    for (const hasComparisons of [false, true]) {
      const rows = page.getByRole("listitem")
      await expect(rows).toHaveCount(100)
      await rows.first().scrollIntoViewIfNeeded()
      await page.screenshot({
        path: test
          .info()
          .outputPath(
            `home-${width}-${hasComparisons ? "ranked" : "unranked"}.png`,
          ),
      })
      await rows.last().scrollIntoViewIfNeeded()
      await expect(rows.last()).toBeInViewport()
      await page
        .getByRole("button", { name: "Browse All Values", exact: true })
        .click()
      await expect(rows).toHaveCount(100)
      await page.getByRole("button", { name: "Close", exact: true }).click()
      await expect(rows).toHaveCount(100)
      const editorial = page.getByRole("article", {
        name: "What Are Your Values, Mapache? information",
        includeHidden: true,
      })
      await expect(editorial).toBeAttached()
      await expect(editorial).toBeHidden()
      if (!hasComparisons) {
        await page.getByRole("button", { name: "Battle", exact: true }).click()
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
        await page.getByRole("button", { name: "Stop", exact: true }).click()
        await expect(
          page.getByRole("heading", { name: "Results", exact: true }),
        ).toBeVisible()
        await page
          .getByRole("button", { name: "See my values", exact: true })
          .click()
        await expect(
          page.getByRole("heading", {
            name: /^My (?:Top Five Life )?Values$/,
            level: 2,
          }),
        ).toBeVisible()
      }
    }
  })
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 844, height: 390 },
  { width: 1100, height: 844 },
  { width: 1279, height: 844 },
  { width: 1280, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`both animals make visible contact within two-composition cards at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await page.addInitScript(() => {
      window.responsiveStrikes = []
      document.addEventListener(
        "animationstart",
        (event) => {
          const image = event.target
          if (
            !(image instanceof HTMLImageElement) ||
            image
              .closest("[data-battle-role]")
              ?.getAttribute("data-battle-role") !== "attack" ||
            image
              .closest("[data-combatant-side]")
              ?.getAttribute("data-battle-cue") !== "strike"
          )
            return
          const stage = image.closest("[data-choreography-identity]")
          const anchor = image.closest("[data-combatant-side]")
          const traveler = image.closest("[data-combatant-traveler]")
          const side = anchor?.getAttribute("data-combatant-side") ?? null
          const defender = stage?.querySelector(
            `[data-combatant-side="${side === "first" ? "second" : "first"}"]`,
          )
          if (
            !stage ||
            !anchor ||
            !(traveler instanceof HTMLElement) ||
            !defender
          )
            return
          const origin = anchor.getBoundingClientRect()
          const current = traveler.getBoundingClientRect()
          const target = defender.getBoundingClientRect()
          const previousPointerEvents = traveler.style.pointerEvents
          let attackerIsUnobscured: boolean
          try {
            traveler.style.pointerEvents = "auto"
            attackerIsUnobscured = traveler.contains(
              document.elementFromPoint(
                current.x + current.width / 2,
                current.y + current.height / 2,
              ),
            )
          } finally {
            traveler.style.pointerEvents = previousPointerEvents
          }
          const distance = (bounds: DOMRect) =>
            Math.hypot(
              bounds.x + bounds.width / 2 - target.x - target.width / 2,
              bounds.y + bounds.height / 2 - target.y - target.height / 2,
            )
          window.responsiveStrikes.push({
            identity: stage.getAttribute("data-choreography-identity"),
            side,
            originDistance: distance(origin),
            contactDistance: distance(current),
            expectedContactDistance: (current.width * 3) / 4,
            baselineDifference: Math.abs(current.bottom - target.bottom),
            inViewport: [current, target].every(
              (bounds) =>
                bounds.left >= 0 &&
                bounds.top >= 0 &&
                bounds.right <= innerWidth &&
                bounds.bottom <= innerHeight,
            ),
            imageIsLoaded: image.complete && image.naturalWidth > 0,
            attackerIsUnobscured,
            overlapsVisibleText: [...stage.querySelectorAll("h2, p")].some(
              (text) => {
                const { left, right, top, bottom } =
                  window.getVisibleTextBounds(text)
                return (
                  left < right &&
                  top < bottom &&
                  current.left < right &&
                  current.right > left &&
                  current.top < bottom &&
                  current.bottom > top
                )
              },
            ),
          })
        },
        true,
      )
    })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const stage = page.locator("[data-choreography-identity]")
    await expect(stage).toHaveAttribute("data-battle-stage-mode", "licensed")
    const cardGeometry = await stage
      .locator("[data-value-card]")
      .evaluateAll((cards) => {
        const measure = (element: Element) => {
          const { left, right, top, bottom, width } =
            element.getBoundingClientRect()
          return { left, right, top, bottom, width }
        }
        return cards.map((card) => ({
          card: measure(card.querySelector("button")!),
          animal: measure(card.querySelector("[data-combatant-side]")!),
        }))
      })
    const [first, second] = cardGeometry
    if (!first || !second) throw new Error("Both value cards must be present")
    await expect(stage.locator("[data-combatant-side]")).toHaveCount(2)
    expect(
      Math.abs(first.animal.bottom - second.animal.bottom),
    ).toBeLessThanOrEqual(1)
    expect(first.animal.right).toBeLessThanOrEqual(second.animal.left)
    expect(first.card.right).toBeLessThanOrEqual(second.card.left)
    expect(first.card.top).toBeCloseTo(second.card.top, 0)
    expect(first.card.bottom).toBeCloseTo(second.card.bottom, 0)
    expect(first.card.bottom).toBeLessThanOrEqual(first.animal.top)
    expect(second.card.bottom).toBeLessThanOrEqual(second.animal.top)
    for (const side of ["first", "second"] as const) {
      const identity = await stage.getAttribute("data-choreography-identity")
      await expect
        .poll(() =>
          stage
            .locator("img")
            .evaluateAll(
              (images: HTMLImageElement[]) =>
                images.length > 0 &&
                images.every(
                  (image) => image.complete && image.naturalWidth > 0,
                ),
            ),
        )
        .toBe(true)
      await stage
        .locator(`[data-battle-arena-side="${side}"]`)
        .scrollIntoViewIfNeeded()
      const animalBounds = await stage
        .locator(`[data-combatant-side="${side}"]`)
        .boundingBox()
      if (!animalBounds) throw new Error("The selected animal must be visible")
      await page.mouse.click(
        animalBounds.x + animalBounds.width / 2,
        animalBounds.y + animalBounds.height / 2,
      )
      await expect(stage).not.toHaveAttribute(
        "data-choreography-identity",
        identity!,
      )
      const strikes = await page.evaluate(
        (identity) =>
          window.responsiveStrikes.filter(
            (strike) => strike.identity === identity,
          ),
        identity,
      )
      expect(strikes.length).toBeGreaterThanOrEqual(1)
      for (const strike of strikes) {
        expect(strike.side).toBe(side)
        expect(strike.imageIsLoaded).toBe(true)
        expect(strike.attackerIsUnobscured, JSON.stringify(strike)).toBe(true)
        expect(strike.inViewport, JSON.stringify(strike)).toBe(true)
        expect(strike.overlapsVisibleText).toBe(false)
        expect(strike.contactDistance).toBeLessThan(strike.originDistance)
        expect(
          Math.abs(strike.contactDistance - strike.expectedContactDistance),
          JSON.stringify(strike),
        ).toBeLessThanOrEqual(1)
        expect(strike.baselineDifference).toBeLessThanOrEqual(1)
      }
      await expect(
        page.getByRole("button", { name: /^Choose / }).first(),
      ).toBeEnabled()
    }
  })
}

for (const viewport of [
  { width: 320, height: 568, textScale: 200 },
  { width: 640, height: 450, textScale: 200 },
  { width: 1280, height: 844, textScale: 200 },
  { width: 320, height: 568, textScale: 400 },
  { width: 320, height: 568, textScale: 400, fontFamily: "monospace" },
]) {
  test(`bottom controls remain reachable while definitions scroll at ${viewport.width}px with ${viewport.textScale}% text${viewport.fontFamily ? " using fallback font metrics" : ""}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    await page.addStyleTag({
      content: `html { font-size: ${viewport.textScale}%; }`,
    })
    if (viewport.fontFamily)
      await page.addStyleTag({
        content: `body { font-family: ${viewport.fontFamily}; }`,
      })
    const battle = page.getByRole("main", { name: "Value battle" })
    const content = battle.getByRole("region", { name: "Battle choices" })
    const choices = battle.getByRole("button", { name: /^Choose / })
    const actionBar = battle.getByRole("navigation", { name: "Battle actions" })
    const menuAction = actionBar.getByRole("button", {
      name: "Menu",
      exact: true,
    })
    const undoAction = actionBar.getByRole("button", {
      name: "Undo",
      exact: true,
    })
    const redoAction = actionBar.getByRole("button", {
      name: "Redo",
      exact: true,
    })
    const stopAction = actionBar.getByRole("button", {
      name: "Stop",
      exact: true,
    })
    const actionBounds = await actionBar
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const measure = ({ left, right, top, bottom }: DOMRect) => ({
            left,
            right,
            top,
            bottom,
          })
          const label = document.createRange()
          label.selectNodeContents(button)
          return {
            name: button.getAttribute("aria-label"),
            button: measure(button.getBoundingClientRect()),
            label: measure(label.getBoundingClientRect()),
          }
        }),
      )
    expect(actionBounds.slice(0, 4).map(({ name }) => name)).toEqual([
      "Menu",
      "Undo",
      "Redo",
      "Stop",
    ])
    for (const [index, { button, label }] of actionBounds.entries()) {
      expect(button.left).toBeGreaterThanOrEqual(0)
      expect(button.right).toBeLessThanOrEqual(viewport.width)
      expect(label.left).toBeGreaterThanOrEqual(button.left)
      expect(label.right).toBeLessThanOrEqual(button.right)
      expect(label.top).toBeGreaterThanOrEqual(button.top)
      expect(label.bottom).toBeLessThanOrEqual(button.bottom)
      for (const { button: other } of actionBounds.slice(index + 1)) {
        expect(
          button.left < other.right &&
            button.right > other.left &&
            button.top < other.bottom &&
            button.bottom > other.top,
          "Battle actions must not overlap at enlarged text sizes",
        ).toBe(false)
      }
    }
    for (const action of await actionBar.getByRole("button").all()) {
      await action.scrollIntoViewIfNeeded()
      await expect(action).toBeInViewport({ ratio: 0.99 })
      const bounds = await action.boundingBox()
      expect(bounds!.y).toBeGreaterThanOrEqual(
        (await actionBar.boundingBox())!.y - 1,
      )
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
        viewport.height + 1,
      )
    }
    expect((await actionBar.boundingBox())!.height).toBeLessThanOrEqual(
      viewport.height * 0.6 + 1,
    )
    await expect(undoAction).toBeDisabled()
    await expect(redoAction).toBeDisabled()
    await menuAction.click()
    const menu = page.getByRole("dialog", { name: "Menu", exact: true })
    await expect(menu).toBeVisible()
    await menu
      .getByRole("button", { name: "Resume Battle", exact: true })
      .click()
    await expect(menu).toBeHidden()
    await expect(content).toBeVisible()
    await expect(actionBar).toBeInViewport({ ratio: 1 })
    await expect(choices).toHaveCount(2)
    for (const choice of await choices.all()) {
      const heading = choice.getByRole("heading")
      await expectCompleteBattleTextReachable(heading)
      await expect(
        battle.getByText((await heading.textContent())!, { exact: true }),
      ).toHaveCount(1)
      const definition = choice.locator("p")
      await expectCompleteBattleTextReachable(definition)
      expect(
        await definition.evaluate((element) => ({
          overflows: element.scrollHeight > element.clientHeight + 1,
          hasInnerScrollbox: [
            ...element.closest("button")!.parentElement!.querySelectorAll("*"),
          ].some((child) =>
            ["auto", "scroll"].includes(getComputedStyle(child).overflowY),
          ),
        })),
      ).toEqual({ overflows: false, hasInnerScrollbox: false })
      const level = choice.getByText(/^Level \d+$/)
      await expect(level).toBeVisible()
      await expectCompleteBattleTextReachable(level)
    }
    const surfaceBoundsBeforeFocus = await battle.boundingBox()
    for (const choice of await choices.all())
      await expectCompleteBattleTextReachable(
        choice.getByText(/^\[\d \/ [A-Z]\]$/),
      )
    await content.focus()
    await page.keyboard.press("Home")
    expect(await battle.boundingBox()).toEqual(surfaceBoundsBeforeFocus)
    await expect
      .poll(() => content.evaluate((element) => element.scrollTop))
      .toBe(0)
    const beforeWheel = await battle.evaluate((surface) => ({
      pageScroll: window.scrollY,
      controlsTop: surface.querySelector("nav")!.getBoundingClientRect().top,
    }))
    await content.hover()
    await page.mouse.wheel(0, 200)
    await expect
      .poll(() => content.evaluate((surface) => surface.scrollTop))
      .toBeGreaterThan(0)
    expect((await actionBar.boundingBox())!.y).toBe(beforeWheel.controlsTop)
    expect(await page.evaluate(() => scrollY)).toBe(beforeWheel.pageScroll)
    await page.keyboard.press("End")
    await expect
      .poll(() =>
        content.evaluate(
          (element) =>
            element.scrollTop >=
            element.scrollHeight - element.clientHeight - 1,
        ),
      )
      .toBe(true)
    expect((await actionBar.boundingBox())!.y).toBe(beforeWheel.controlsTop)
    await choices.last().hover()
    const beforeValueWheel = await content.evaluate((surface) => ({
      scrollTop: surface.scrollTop,
      remainingScroll:
        surface.scrollHeight - surface.clientHeight - surface.scrollTop,
    }))
    const scrollDown =
      beforeValueWheel.remainingScroll > beforeValueWheel.scrollTop
    await page.mouse.wheel(0, scrollDown ? 200 : -200)
    await expect
      .poll(async () => {
        const scrollTop = await content.evaluate((surface) => surface.scrollTop)
        return scrollDown
          ? scrollTop > beforeValueWheel.scrollTop
          : scrollTop < beforeValueWheel.scrollTop
      })
      .toBe(true)
    expect(
      await battle.evaluate((element) => element.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width)
    const identity = await battle
      .locator("[data-choreography-identity]")
      .getAttribute("data-choreography-identity")
    const originalChoiceLabels = await choices.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")!),
    )
    await choices.last().hover()
    const readChoiceGeometry = () =>
      choices.evaluateAll((buttons) =>
        buttons.map((button) => {
          const surface = button.closest('[aria-label="Battle choices"]')!
          const { x, y, width, height } = button.getBoundingClientRect()
          return { x, y: y + surface.scrollTop + window.scrollY, width, height }
        }),
      )
    const beforeMousePress = await readChoiceGeometry()
    await page.mouse.down()
    for (const choice of await choices.all())
      await expect(choice.getByText(/^\[\d \/ [A-Z]\]$/)).toBeVisible()
    expect(await readChoiceGeometry()).toEqual(beforeMousePress)
    await page.mouse.up()
    await expect(
      battle.locator("[data-choreography-identity]"),
    ).not.toHaveAttribute("data-choreography-identity", identity!)
    await expect(undoAction).toBeEnabled()
    await page
      .getByRole("button", { name: "Dismiss achievement: First Battle" })
      .click()
    const nextChoiceLabels = await choices.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")!),
    )
    await undoAction.click()
    await expect(redoAction).toBeEnabled()
    for (const [index, label] of originalChoiceLabels.entries())
      await expect(choices.nth(index)).toHaveAccessibleName(label)
    await redoAction.click()
    await expect(redoAction).toBeDisabled()
    await expect(undoAction).toBeEnabled()
    for (const [index, label] of nextChoiceLabels.entries())
      await expect(choices.nth(index)).toHaveAccessibleName(label)
    await stopAction.click()
    await expect(
      page.getByRole("heading", { name: "Results", exact: true }),
    ).toBeVisible()
    await page
      .getByRole("button", { name: "See my values", exact: true })
      .click()
    await expect(
      page.getByRole("heading", {
        name: "My Top Five Life Values",
        exact: true,
      }),
    ).toBeVisible()
  })
}
