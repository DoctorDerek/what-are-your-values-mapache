import { expect } from "@playwright/test"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block", reducedMotion: "no-preference" })

const languages = [
  {
    language: "en-US",
    path: "/",
    start: "Start",
    battle: "Battle",
    screen: "Value battle",
    choose: /^Choose /,
    reward: "+4 XP · Level 3",
    stop: "Stop",
    results: "Results",
  },
  {
    language: "es-MX",
    path: "/que-valoras-en-la-vida",
    start: "Empezar",
    battle: "Combatir",
    screen: "Batalla de valores",
    choose: /^Elegir /,
    reward: "+4 XP · Nivel 3",
    stop: "Detener",
    results: "Resultados",
  },
] as const

for (const language of languages) {
  for (const viewport of [
    { width: 320, height: 640 },
    { width: 1440, height: 900 },
  ]) {
    test(`${language.language} Battle keeps a single-line reward without moving controls at ${viewport.width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport)
      await page.goto(language.path)
      await page.getByRole("button", { name: language.start, exact: true }).click()
      await page.getByRole("button", { name: language.battle, exact: true }).click()
      const battle = page.getByRole("main", { name: language.screen })
      const actions = battle.getByRole("navigation")
      const initialActions = await actions.boundingBox()
      await battle.getByRole("button", { name: language.choose }).first().click()
      const reward = battle.getByText(language.reward, { exact: true })
      await expect(reward).toBeVisible()
      await expect(reward).toBeInViewport({ ratio: 1 })
      const composition = await reward.evaluate((badge) => {
        const bounds = badge.getBoundingClientRect()
        const style = getComputedStyle(badge)
        const textRange = document.createRange()
        textRange.selectNodeContents(badge)
        return {
          height: bounds.height,
          contentHeight:
            Number.parseFloat(style.lineHeight) +
            Number.parseFloat(style.borderTopWidth) +
            Number.parseFloat(style.borderBottomWidth),
          lineCount: textRange.getClientRects().length,
          winningSide: badge.closest("[data-battle-arena-side]")?.getAttribute(
            "data-battle-arena-side",
          ),
        }
      })
      expect(composition.winningSide).toBe("first")
      expect(composition.lineCount).toBe(1)
      expect(composition.height).toBeCloseTo(composition.contentHeight, 1)
      expect(await actions.boundingBox()).toEqual(initialActions)
      await page.screenshot({ path: testInfo.outputPath("battle-reward.png") })
      await actions.getByRole("button", { name: language.stop, exact: true }).click()
      await expect(
        page.getByRole("heading", { name: language.results, exact: true }),
      ).toBeVisible()
    })
  }
}
