import { expect, type Locator } from "@playwright/test"
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

async function expectCompleteTextReachable(text: Locator) {
  for (const edge of ["start", "end"] as const) {
    const evidence = await text.evaluate((element, edge) => {
      const surface = element.closest("main")!
      const surfaceBounds = surface.getBoundingClientRect()
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      const textNodes: Node[] = []
      while (walker.nextNode()) {
        if (walker.currentNode.textContent?.length)
          textNodes.push(walker.currentNode)
      }
      const node = edge === "start" ? textNodes[0]! : textNodes.at(-1)!
      const offset = edge === "start" ? 0 : node.textContent!.length - 1
      const character = document.createRange()
      character.setStart(node, offset)
      character.setEnd(node, offset + 1)
      const beforeScroll = character.getBoundingClientRect()
      surface.scrollBy({
        top:
          edge === "start"
            ? beforeScroll.top - surfaceBounds.top - surface.clientTop
            : beforeScroll.bottom -
              surfaceBounds.top -
              surface.clientTop -
              surface.clientHeight,
        behavior: "instant",
      })
      const characterBounds = character.getBoundingClientRect()
      const content = document.createRange()
      content.selectNodeContents(element)
      return {
        edgeIsVisible:
          characterBounds.top >=
            Math.max(0, surfaceBounds.top + surface.clientTop) - 1 &&
          characterBounds.bottom <=
            Math.min(
              innerHeight,
              surfaceBounds.top + surface.clientTop + surface.clientHeight,
            ) +
              1,
        allLinesFitWidth: [...content.getClientRects()].every(
          (line) =>
            line.left >= surfaceBounds.left &&
            line.right <= Math.min(innerWidth, surfaceBounds.right),
        ),
        textIsNotClipped:
          getComputedStyle(element).overflowY === "visible" ||
          element.scrollHeight <= element.clientHeight + 1,
      }
    }, edge)
    expect(evidence, `${edge} of ${await text.textContent()}`).toEqual({
      edgeIsVisible: true,
      allLinesFitWidth: true,
      textIsNotClipped: true,
    })
  }
}

for (const width of [390, 1100, 1440]) {
  test(`Hub wheel scrolling works before and after ranking at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    for (const hasComparisons of [false, true]) {
      const rows = page.getByRole("button", { name: /^Open .+ in All Values$/ })
      await expect(rows).toHaveCount(100)
      await rows.first().scrollIntoViewIfNeeded()
      await rows.first().hover()
      const before = await page.evaluate(() => ({
        scrollY,
        height: document.documentElement.scrollHeight,
      }))
      await page.mouse.wheel(0, 500)
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(before.scrollY + 100)
      const after = await page.evaluate(() => scrollY)
      await page.mouse.wheel(0, -250)
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeLessThan(after - 50)
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight),
      ).toBe(before.height)
      await expect(rows).toHaveCount(100)
      await expect(
        page.getByRole("article", {
          name: "What Are Your Values, Mapache? information",
        }),
      ).toBeAttached()
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
          page.getByRole("heading", { name: "Top Five", exact: true }),
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
              ?.getAttribute("data-battle-role") !== "attack"
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
    if (viewport.width < 1280) {
      expect(first.card.bottom).toBeLessThanOrEqual(second.card.top)
      expect(first.card.bottom).toBeLessThanOrEqual(first.animal.top)
      expect(second.animal.bottom).toBeLessThanOrEqual(second.card.top)
      expect(first.card.width).toBe(second.card.width)
    } else {
      expect(first.card.right).toBeLessThanOrEqual(second.card.left)
      expect(first.card.bottom).toBeLessThanOrEqual(first.animal.top)
      expect(second.card.bottom).toBeLessThanOrEqual(second.animal.top)
    }
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
]) {
  test(`controls and full definitions share scrolling at ${viewport.width}px with ${viewport.textScale}% text`, async ({
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
    const battle = page.getByRole("main", { name: "Value battle" })
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
    expect(actionBounds.map(({ name }) => name)).toEqual([
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
      await expect(action).toBeInViewport({ ratio: 1 })
    }
    if (viewport.textScale === 400)
      expect((await actionBar.boundingBox())!.height).toBeGreaterThan(
        viewport.height,
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
    await expect(battle.getByRole("region")).toHaveCount(0)
    expect(
      await battle.evaluate(
        (surface) =>
          [...surface.querySelectorAll("*")].filter((element) =>
            ["auto", "scroll"].includes(getComputedStyle(element).overflowY),
          ).length,
      ),
    ).toBe(0)
    await expect(choices).toHaveCount(2)
    for (const choice of await choices.all()) {
      const heading = choice.getByRole("heading")
      await expectCompleteTextReachable(heading)
      await expect(
        battle.getByText((await heading.textContent())!, { exact: true }),
      ).toHaveCount(1)
      const definition = choice.locator("p")
      await expectCompleteTextReachable(definition)
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
      await expect(choice.getByText(/^Level \d+$/)).toBeVisible()
    }
    await menuAction.focus()
    const surfaceBoundsBeforeFocus = await battle.boundingBox()
    await page.keyboard.press("Shift+Tab")
    await expect(battle).toBeFocused()
    await page.keyboard.press("Home")
    await expect(battle).toHaveCSS("border-left-color", "rgb(255, 255, 255)")
    expect(await battle.boundingBox()).toEqual(surfaceBoundsBeforeFocus)
    await expect
      .poll(() => battle.evaluate((element) => element.scrollTop))
      .toBe(0)
    const beforeWheel = await battle.evaluate((surface) => ({
      pageScroll: window.scrollY,
      controlsTop: surface.querySelector("nav")!.getBoundingClientRect().top,
    }))
    await menuAction.hover()
    await page.mouse.wheel(0, 200)
    await expect
      .poll(() => battle.evaluate((surface) => surface.scrollTop))
      .toBeGreaterThan(0)
    expect((await actionBar.boundingBox())!.y).toBeLessThan(
      beforeWheel.controlsTop,
    )
    expect(await page.evaluate(() => scrollY)).toBe(beforeWheel.pageScroll)
    await page.keyboard.press("End")
    await expect
      .poll(() =>
        battle.evaluate(
          (element) =>
            element.scrollTop >=
            element.scrollHeight - element.clientHeight - 1,
        ),
      )
      .toBe(true)
    await expect(menuAction).not.toBeInViewport()
    await choices.last().hover()
    const beforeValueWheel = await battle.evaluate(
      (surface) => surface.scrollTop,
    )
    await page.mouse.wheel(0, -200)
    await expect
      .poll(() => battle.evaluate((surface) => surface.scrollTop))
      .toBeLessThan(beforeValueWheel)
    expect(
      await battle.evaluate((element) => element.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width)
    const identity = await battle
      .locator("[data-choreography-identity]")
      .getAttribute("data-choreography-identity")
    const originalChoiceLabels = await choices.evaluateAll((buttons) =>
      buttons.map((button) => button.getAttribute("aria-label")!),
    )
    await choices.last().click()
    await expect(
      battle.locator("[data-choreography-identity]"),
    ).not.toHaveAttribute("data-choreography-identity", identity!)
    await expect(undoAction).toBeEnabled()
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
      page.getByRole("heading", { name: "Top Five", exact: true }),
    ).toBeVisible()
  })
}
