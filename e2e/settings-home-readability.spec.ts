import { expect, type Locator } from "@playwright/test"
import { test } from "./fixtures"

test.use({
  serviceWorkers: "block",
  contextOptions: { reducedMotion: "reduce" },
})

test("the shipped stylesheet uses only the xl breakpoint", async ({ page }) => {
  await page.goto("/")
  const responsiveQueries = await page.evaluate(() => {
    const viewport = new Set<string>()
    const container = new Set<string>()
    function inspect(rules: CSSRuleList) {
      for (const rule of rules) {
        if (
          rule instanceof CSSMediaRule &&
          /width|height|size|orientation|aspect-ratio/.test(rule.conditionText)
        )
          viewport.add(rule.conditionText)
        if (rule instanceof CSSContainerRule) container.add(rule.conditionText)
        if (rule instanceof CSSGroupingRule) inspect(rule.cssRules)
      }
    }
    for (const sheet of document.styleSheets) inspect(sheet.cssRules)
    return { viewport: [...viewport], container: [...container] }
  })
  expect(responsiveQueries.container).toEqual([])
  expect(responsiveQueries.viewport.length).toBeGreaterThan(0)
  for (const query of responsiveQueries.viewport)
    expect(query).toMatch(
      /^(?:not all and )?\((?:width (?:>=|<) |min-width: |max-width: )80rem\)$/,
    )
})

const languages = [
  {
    locale: "en",
    path: "/",
    start: "Start",
    menu: "Menu",
    settings: "Settings",
    back: "Back",
    language: "Language",
    languageName: "English (US)",
    motion: "Reduced Motion",
    followSystem: "Follow System",
    off: "Off",
    actions: [
      "Add value",
      "Battle",
      "Customize my card",
      "Share my values card",
      "Browse All Values",
    ],
  },
  {
    locale: "es-MX",
    path: "/que-valoras-en-la-vida",
    start: "Empezar",
    menu: "Menú",
    settings: "Configuración",
    back: "Volver",
    language: "Idioma",
    languageName: "Español (México)",
    motion: "Reducir movimiento",
    followSystem: "Seguir al sistema",
    off: "Desactivado",
    actions: [
      "Agregar valor",
      "Combatir",
      "Personalizar mi tarjeta",
      "Compartir mi tarjeta de valores",
      "Ver todos los valores",
    ],
  },
] as const

async function expectReadableText(locator: Locator) {
  const geometry = await locator.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const textBounds: { left: number; right: number }[] = []
    while (walker.nextNode()) {
      const range = document.createRange()
      range.selectNodeContents(walker.currentNode)
      for (const rect of range.getClientRects())
        if (rect.width > 0 && rect.height > 0)
          textBounds.push({ left: rect.left, right: rect.right })
    }
    return {
      left: bounds.left,
      right: bounds.right,
      width: element.clientWidth,
      content: element.scrollWidth,
      viewport: document.documentElement.clientWidth,
      textBounds,
    }
  })
  expect(geometry.left).toBeGreaterThanOrEqual(-1)
  expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1)
  expect(geometry.content).toBeLessThanOrEqual(geometry.width + 1)
  expect(geometry.textBounds.length).toBeGreaterThan(0)
  for (const text of geometry.textBounds) {
    expect(text.left).toBeGreaterThanOrEqual(geometry.left - 1)
    expect(text.right).toBeLessThanOrEqual(geometry.right + 1)
  }
}

for (const copy of languages) {
  test(`${copy.locale} Home keeps its condensed title and controls usable across the single xl boundary`, async ({
    page,
  }) => {
    await page.goto(copy.path)
    await page.getByRole("button", { name: copy.start, exact: true }).click()
    const title = page
      .getByRole("main")
      .getByRole("heading", { level: 1 })
      .first()
    const menu = page.getByRole("button", { name: copy.menu, exact: true })
    await expect(menu).toBeVisible()
    for (const width of [320, 390, 768, 1279, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      await expectReadableText(title)
      await expect(menu).toBeInViewport({ ratio: 1 })
      const titleBounds = await title.boundingBox()
      const menuBounds = await menu.boundingBox()
      expect(titleBounds!.x + titleBounds!.width).toBeLessThan(menuBounds!.x)
      const typography = await title.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          family: style.fontFamily,
          size: parseFloat(style.fontSize),
          spacing: style.letterSpacing,
          height: element.getBoundingClientRect().height,
          line: parseFloat(style.lineHeight),
        }
      })
      expect(typography.family).toContain("WAYVM Condensed")
      expect(typography.spacing).toBe("normal")
      expect(typography.height).toBeLessThanOrEqual(typography.line + 1)
      expect(typography.size).toBeGreaterThanOrEqual(width >= 768 ? 32 : 13.6)
    }
  })
  for (const { width, scale, fontFamily } of [
    { width: 320, scale: 100 },
    { width: 320, scale: 200 },
    { width: 390, scale: 200 },
    { width: 1440, scale: 100 },
    { width: 1440, scale: 200 },
    {
      width: 320,
      scale: 100,
      fontFamily: 'Verdana, "DejaVu Sans", sans-serif',
    },
    {
      width: 320,
      scale: 200,
      fontFamily: 'Verdana, "DejaVu Sans", sans-serif',
    },
  ]) {
    test(`${copy.locale} Home and Settings preserve readable controls at ${width}px/${scale}% text${fontFamily ? " with wider fallback fonts" : ""}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width < 1280 ? 720 : 900 })
      await page.goto(copy.path)
      await page.getByRole("button", { name: copy.start, exact: true }).click()
      await page.addStyleTag({ content: `html { font-size: ${scale}%; }` })
      if (fontFamily)
        await page.addStyleTag({
          content: `body { font-family: ${fontFamily}; }`,
        })
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      const actions = page.getByRole("main").getByRole("navigation")
      const buttons = actions.getByRole("button")
      await expect(buttons).toHaveText([...copy.actions])
      for (const button of await buttons.all()) {
        await button.scrollIntoViewIfNeeded()
        await expect(button).toBeInViewport()
        await expectReadableText(button)
      }
      const positions = await buttons.evaluateAll((elements) =>
        elements.map((element) => {
          const { x, y, height } = element.getBoundingClientRect()
          return { x, y, bottom: y + height }
        }),
      )
      if (scale === 100 || width >= 1280) {
        expect(positions[0].x).toBeLessThan(positions[1].x)
        expect(Math.max(positions[0].y, positions[1].y)).toBeLessThan(
          Math.min(positions[0].bottom, positions[1].bottom),
        )
      } else {
        expect(positions[0].bottom).toBeLessThanOrEqual(positions[1].y)
      }
      expect(positions[1].bottom).toBeLessThan(positions[2].y)
      await page.screenshot({
        path: test.info().outputPath("home-controls.png"),
      })
      await page.getByRole("button", { name: copy.menu, exact: true }).click()
      await page
        .getByRole("button", { name: copy.settings, exact: true })
        .click()
      const heading = page.getByRole("heading", {
        name: copy.settings,
        level: 1,
      })
      await expect(heading).toBeFocused()
      await expectReadableText(heading)
      if (width < 1280) {
        const title = await heading.evaluate((element) => ({
          fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
          lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
          height: element.getBoundingClientRect().height,
        }))
        expect(title.fontSize).toBeGreaterThanOrEqual((32 * scale) / 100)
        expect(title.height).toBeLessThanOrEqual(
          title.lineHeight *
            (scale === 100 ? 1 : copy.locale === "es-MX" ? 3 : 2) +
            1,
        )
      }
      const language = page.getByRole("combobox", { name: copy.language })
      await expect(language).toHaveValue(copy.locale)
      await language.focus()
      await expect(language).toBeFocused()
      if (width < 1280) {
        const visibleValue = language
          .locator("..")
          .getByText(copy.languageName, { exact: true })
          .last()
        await expect(visibleValue).toBeVisible()
        await expectReadableText(visibleValue)
        for (const badge of await page
          .getByText(copy.locale === "en" ? "Selected" : "Seleccionado", {
            exact: true,
          })
          .all())
          await expect(badge).toBeHidden()
      }
      await page.screenshot({
        path: test.info().outputPath("settings-heading.png"),
      })
      for (const group of await page.getByRole("group").all()) {
        const dimensions = await group.evaluate((element) => ({
          width: element.clientWidth,
          content: element.scrollWidth,
          right: element.getBoundingClientRect().right,
        }))
        expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1)
        expect(dimensions.right).toBeLessThanOrEqual(width)
        if (width >= 1280 && scale === 100) {
          const optionPositions = await group
            .getByRole("radio")
            .evaluateAll((elements) =>
              elements.map(
                (element) => element.parentElement!.getBoundingClientRect().top,
              ),
            )
          expect(optionPositions).toHaveLength(3)
          expect(
            Math.max(...optionPositions) - Math.min(...optionPositions),
          ).toBeLessThanOrEqual(1)
        }
        for (const radio of await group.getByRole("radio").all()) {
          await radio.scrollIntoViewIfNeeded()
          await expect(radio).toBeInViewport()
          await expectReadableText(radio.locator(".."))
        }
      }
      const motion = page.getByRole("group", { name: copy.motion, exact: true })
      await expect(
        motion.getByRole("radio", { name: copy.followSystem, exact: true }),
      ).toBeChecked()
      const off = motion.getByRole("radio", { name: copy.off, exact: true })
      await off.click()
      await expect(off).toBeChecked()
      await expect(off).toBeEnabled()
      await page.screenshot({
        path: test.info().outputPath("settings-options.png"),
      })
      await language.selectOption(copy.locale === "en" ? "es-MX" : "en")
      const changedLanguage = page.getByRole("combobox", {
        name: copy.locale === "en" ? "Idioma" : "Language",
      })
      await expect(changedLanguage).toHaveValue(
        copy.locale === "en" ? "es-MX" : "en",
      )
      await expect(changedLanguage).toBeEnabled()
      await changedLanguage.selectOption(copy.locale)
      await expect(language).toBeEnabled()
      await page.getByRole("button", { name: copy.back, exact: true }).click()
      await expect(
        actions.getByRole("button", { name: copy.actions[1], exact: true }),
      ).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width)
    })
  }
}
