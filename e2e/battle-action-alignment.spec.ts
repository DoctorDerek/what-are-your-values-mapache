import { expect, type Locator } from "@playwright/test"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block" })

async function readActionAlignment(actions: Locator) {
  return actions.evaluate((navigation) => {
    const navigationBounds = navigation.getBoundingClientRect()
    return [...navigation.querySelectorAll("button")].map((button) => {
      const buttonBounds = button.getBoundingClientRect()
      const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT)
      const visibleTextBounds: DOMRect[] = []
      while (walker.nextNode()) {
        const node = walker.currentNode
        const text = node.textContent ?? ""
        const firstCharacter = text.search(/\S/u)
        if (firstCharacter < 0 || !node.parentElement) continue
        if (getComputedStyle(node.parentElement).visibility !== "visible")
          continue
        const range = document.createRange()
        range.setStart(node, firstCharacter)
        range.setEnd(node, text.trimEnd().length)
        visibleTextBounds.push(
          ...[...range.getClientRects()].filter(({ width }) => width > 0),
        )
      }
      const left = Math.min(...visibleTextBounds.map((bounds) => bounds.left))
      const right = Math.max(...visibleTextBounds.map((bounds) => bounds.right))
      return {
        name: button.getAttribute("aria-label"),
        visibleTextCount: visibleTextBounds.length,
        centerOffset: Math.abs(
          (left + right) / 2 - (buttonBounds.left + buttonBounds.right) / 2,
        ),
        textFits: left >= buttonBounds.left && right <= buttonBounds.right,
        geometry: {
          x: buttonBounds.left - navigationBounds.left,
          y: buttonBounds.top - navigationBounds.top,
          width: buttonBounds.width,
          height: buttonBounds.height,
        },
      }
    })
  })
}

for (const width of [390, 1440]) {
  test(`battle action text stays centered across input modes at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/")
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const actions = page.getByRole("navigation", { name: "Battle actions" })
    for (const textScale of [100, 200]) {
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${scale}%`
      }, textScale)
      await actions.scrollIntoViewIfNeeded()
      await page.keyboard.press("Tab")
      const shortcut = actions.getByText("[ESC]", { exact: true })
      if (width >= 1280) await expect(shortcut).toBeVisible()
      else await expect(shortcut).toBeHidden()
      const keyboardAlignment = await readActionAlignment(actions)
      await actions.click({ position: { x: 4, y: 4 } })
      await expect(shortcut).toBeHidden()
      const pointerAlignment = await readActionAlignment(actions)
      for (const alignment of [...keyboardAlignment, ...pointerAlignment]) {
        expect(
          alignment.visibleTextCount,
          `${alignment.name} has visible text`,
        ).toBeGreaterThan(0)
        expect(
          alignment.centerOffset,
          `${alignment.name} at ${textScale}% text`,
        ).toBeLessThanOrEqual(1)
        expect(
          alignment.textFits,
          `${alignment.name} text fits its button`,
        ).toBe(true)
      }
      expect(pointerAlignment.map(({ geometry }) => geometry)).toEqual(
        keyboardAlignment.map(({ geometry }) => geometry),
      )
      await actions.screenshot({
        path: testInfo.outputPath(`actions-${textScale}.png`),
      })
    }
  })
}
