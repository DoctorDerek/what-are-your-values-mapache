import { expect } from "@playwright/test"
import { test } from "./fixtures"
import { getRenderedTextLines } from "./visible-text-bounds"

test.use({ serviceWorkers: "block", reducedMotion: "reduce", hasTouch: true })

const battleViewports: {
  width: number
  height: number
  fontFamily?: string
}[] = [
  { width: 320, height: 568 },
  { width: 320, height: 540 },
  { width: 390, height: 540 },
  { width: 390, height: 640 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 320, height: 540, fontFamily: "Verdana, sans-serif" },
]

for (const viewport of battleViewports) {
  test(`Spanish battle keeps animals and right-thumb controls visible at ${viewport.width}x${viewport.height}${viewport.fontFamily ? " with wider fallback fonts" : ""}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(() => {
      Object.defineProperty(crypto, "randomUUID", {
        value: () => "00000000-0000-4000-8000-000000012944",
      })
    })
    await page.goto("/que-valoras-en-la-vida")
    if (viewport.fontFamily)
      await page.addStyleTag({
        content: `body { font-family: ${viewport.fontFamily}; }`,
      })
    await page.getByRole("button", { name: "Empezar", exact: true }).tap()
    await page.getByRole("button", { name: "Combatir", exact: true }).tap()
    const battle = page.getByRole("main", { name: "Batalla de valores" })
    const choices = battle.getByRole("region", {
      name: "Opciones de la batalla",
    })
    const actions = battle.getByRole("navigation", {
      name: "Acciones de batalla",
    })
    const choiceButtons = battle.getByRole("button", { name: /^Elegir / })
    await expect(
      choiceButtons.first().getByRole("heading"),
    ).toHaveAccessibleName("Cooperación")
    await expect(
      choiceButtons.last().getByRole("heading"),
    ).toHaveAccessibleName("Independencia")
    for (const heading of await choiceButtons.getByRole("heading").all()) {
      const lines = await heading.evaluate(getRenderedTextLines)
      expect(
        lines.every((line) => line.length > 1),
        lines.join(" / "),
      ).toBe(true)
    }
    const animals = battle.locator("[data-combatant-side]")
    await expect(animals).toHaveCount(2)
    for (const animal of await animals.all()) {
      await expect(animal).toBeInViewport({ ratio: 1 })
      await expect(
        animal.locator('[data-battle-active-clip="true"] img'),
      ).toBeVisible()
    }
    const geometry = await battle.evaluate((element) => {
      const rect = (target: Element) => {
        const { top, bottom, left, right, width, height } =
          target.getBoundingClientRect()
        return { top, bottom, left, right, width, height }
      }
      const region = element.querySelector('[role="region"]')!
      return {
        region: rect(region),
        scrollTop: region.scrollTop,
        scrollHeight: region.scrollHeight,
        clientHeight: region.clientHeight,
        definitions: [...element.querySelectorAll("[data-value-card] p")].map(
          rect,
        ),
        animals: [...element.querySelectorAll("[data-combatant-side]")].map(
          rect,
        ),
        actions: [...element.querySelectorAll("nav button")].map((button) => ({
          name: button.getAttribute("aria-label"),
          ...rect(button),
        })),
      }
    })
    expect(geometry.scrollTop).toBe(0)
    expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1)
    const level = await choiceButtons
      .first()
      .getByText(/^Nivel \d+$/)
      .filter({ visible: true })
      .boundingBox()
    const topSpace = level!.y - geometry.region.top
    if (viewport.width >= 1280) {
      expect(topSpace).toBeGreaterThanOrEqual(24)
      if (viewport.height >= 900) expect(topSpace).toBeGreaterThan(60)
    } else {
      expect(topSpace).toBeGreaterThanOrEqual(7)
      expect(topSpace).toBeLessThanOrEqual(25)
    }
    const [menu, redo, undo, ...speedAndStop] = geometry.actions
    const stop = speedAndStop.at(-1)!
    const speeds = speedAndStop.slice(0, -1)
    expect([menu.name, redo.name, undo.name, stop.name]).toEqual([
      "Menú",
      "Rehacer",
      "Deshacer",
      "Detener",
    ])
    expect(menu.right).toBeLessThan(redo.left)
    expect(redo.right).toBeLessThan(undo.left)
    expect(menu.top).toBe(undo.top)
    expect(redo.top).toBe(undo.top)
    for (const speed of speeds) {
      expect(speed.left).toBeLessThan(stop.left)
      expect(speed.right).toBeLessThan(stop.left)
      expect(speed.top).toBeGreaterThanOrEqual(stop.top)
      expect(speed.bottom).toBeLessThanOrEqual(stop.bottom)
    }
    for (const action of geometry.actions) {
      expect(action.width).toBeGreaterThanOrEqual(44)
      expect(action.height).toBeGreaterThanOrEqual(48)
      expect(action.bottom).toBeLessThanOrEqual(viewport.height - 20)
    }
    const definitionBottom = Math.max(
      ...geometry.definitions.map(({ bottom }) => bottom),
    )
    expect(geometry.definitions).toHaveLength(2)
    for (const animal of geometry.animals) {
      expect(animal.top - definitionBottom).toBeGreaterThanOrEqual(
        viewport.width >= 1280 ? 15 : 7,
      )
      expect(animal.top - definitionBottom).toBeLessThanOrEqual(
        viewport.width >= 1280 ? 33 : 17,
      )
      expect(animal.bottom).toBeLessThanOrEqual(geometry.region.bottom - 31)
    }
    await page.screenshot({ path: testInfo.outputPath("spanish-battle.png") })
    await actions
      .getByRole("button", {
        name: "Velocidad de las animaciones de batalla: 2×",
      })
      .click()
    await expect(
      actions.getByRole("button", {
        name: "Velocidad de las animaciones de batalla: 2×",
      }),
    ).toHaveAttribute("aria-pressed", "true")
    await actions.getByRole("button", { name: "Detener", exact: true }).click()
    await expect(
      page.getByRole("button", { name: "Combatir", exact: true }),
    ).toBeVisible()
    await expect(choices).toHaveCount(0)
  })
}

for (const [width, height, textSize] of [
  [1280, 800, 100],
  [1440, 900, 100],
  [1280, 800, 200],
  [1440, 900, 200],
]) {
  test(`wide Battle names keep their first line and center across consecutive matchups at ${width}px and ${textSize}% text`, async ({
    page,
  }) => {
    test.slow()
    await page.setViewportSize({ width, height })
    await page.addInitScript(() => {
      Object.defineProperty(crypto, "randomUUID", {
        value: () => "00000000-0000-4000-8000-0000000005dc",
      })
    })
    await page.goto("/")
    await page.addStyleTag({ content: `html { font-size: ${textSize}%; }` })
    await page.getByRole("button", { name: "Start", exact: true }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const stage = page.locator("[data-choreography-identity]")
    const choices = stage.getByRole("button", { name: /^Choose / })
    const headings = choices.getByRole("heading")
    await expect(headings.first()).toHaveAccessibleName("Fitness")
    await expect(headings.last()).toHaveAccessibleName("Order")
    await page.evaluate(() => document.fonts.ready)
    const readHeadings = () =>
      headings.evaluateAll((elements) =>
        elements.map((heading) => {
          const line = document.createRange()
          line.selectNodeContents(heading)
          const title = heading.getBoundingClientRect()
          const choice = heading.closest("button")!.getBoundingClientRect()
          return {
            firstLine:
              line.getClientRects()[0].top -
              heading
                .closest("[data-choreography-identity]")!
                .getBoundingClientRect().top,
            centerOffset:
              title.left + title.width / 2 - (choice.left + choice.width / 2),
          }
        }),
      )
    const [initial] = await readHeadings()
    for (let turn = 0; turn < 13; turn++) {
      await expect(choices.first()).toBeEnabled()
      for (const heading of await readHeadings()) {
        expect(Math.abs(heading.firstLine - initial.firstLine)).toBeLessThan(1)
        expect(Math.abs(heading.centerOffset)).toBeLessThan(1)
      }
      if (turn === 12) {
        await expect(headings.first()).toHaveAccessibleName("Self-Acceptance")
        await expect(headings.last()).toHaveAccessibleName("Complexity")
        break
      }
      const identity = await stage.getAttribute("data-choreography-identity")
      await stage.locator('[data-battle-arena-side="first"]').click()
      await expect(stage).not.toHaveAttribute(
        "data-choreography-identity",
        identity!,
      )
    }
  })
}
