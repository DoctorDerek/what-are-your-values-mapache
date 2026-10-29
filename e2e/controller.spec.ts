import { expect, type Locator, type Page } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"

async function controllerButton(page: Page, button: number, pressed: boolean) {
  await page.evaluate(
    async (input) => {
      window.dispatchEvent(
        new CustomEvent("test:controller", { detail: input }),
      )
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      )
    },
    { button, pressed },
  )
}

async function tapControllerButton(page: Page, button: number) {
  await controllerButton(page, button, true)
  await controllerButton(page, button, false)
}

async function focusWithController(page: Page, target: Locator) {
  await expect(target).toBeAttached()
  for (let step = 0; step < 80; step++) {
    if (await target.evaluate((element) => element === document.activeElement))
      return
    await tapControllerButton(page, 15)
  }
  await expect(
    target,
    "Controller navigation must reach this control",
  ).toBeFocused()
}

async function activateWithController(page: Page, target: Locator) {
  await expect(target).toBeEnabled()
  await focusWithController(page, target)
  await tapControllerButton(page, 0)
}

async function startWithController(page: Page) {
  await activateWithController(
    page,
    page.getByRole("button", { name: "Start", exact: true }),
  )
  await expect(
    page.getByRole("button", { name: "Battle", exact: true }),
  ).toBeEnabled()
}

async function enterKeyboardText(page: Page, target: Locator, text: string) {
  await focusWithController(page, target)
  await page.keyboard.press("ControlOrMeta+A")
  await page.keyboard.insertText(text)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const buttons: GamepadButton[] = Array.from({ length: 17 }, () => ({
      pressed: false,
      touched: false,
      value: 0,
    }))
    const controller = {
      id: "Steam Deck",
      index: 0,
      connected: true,
      mapping: "standard",
      timestamp: 0,
      axes: [0, 0],
      buttons,
      vibrationActuator: {
        playEffect: async () => "complete",
        reset: async () => "complete",
      },
    } satisfies Gamepad
    Object.defineProperty(navigator, "getGamepads", {
      value: () => [controller],
    })
    window.addEventListener("test:controller", (event) => {
      if (!(event instanceof CustomEvent)) return
      const input: unknown = event.detail
      if (
        !input ||
        typeof input !== "object" ||
        !("button" in input) ||
        !("pressed" in input) ||
        typeof input.button !== "number" ||
        typeof input.pressed !== "boolean"
      )
        return
      buttons[input.button] = {
        pressed: input.pressed,
        touched: input.pressed,
        value: input.pressed ? 1 : 0,
      }
    })
  })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")
  await page.bringToFront()
})

for (const locale of ["en", "es-MX"] as const) {
  test(`Menu command reaches Home, Settings, Import & Export and Results in ${locale}`, async ({
    page,
  }) => {
    const catalog = getLocaleCatalog(locale)
    const copy = catalog.interfaceCopy
    const action = (name: string) =>
      page.getByRole("button", { name, exact: true })
    const menu = page.getByRole("dialog", {
      name: copy.menu.title,
      exact: true,
    })
    await page.goto(catalog.metadata.webPath)
    await action(catalog.introduction.startAction).click()
    await expect(action(catalog.hub.battle)).toBeEnabled()
    await tapControllerButton(page, 9)
    await expect(menu).toBeVisible()
    await menu
      .getByRole("button", { name: copy.settings.title, exact: true })
      .click()
    await expect(
      page.getByRole("heading", { name: copy.settings.title, exact: true }),
    ).toBeVisible()
    await tapControllerButton(page, 9)
    await expect(menu).toBeVisible()
    await menu
      .getByRole("button", { name: copy.portability.screenTitle, exact: true })
      .click()
    await expect(
      page.getByRole("heading", {
        name: copy.portability.screenTitle,
        exact: true,
      }),
    ).toBeVisible()
    await tapControllerButton(page, 9)
    await expect(menu).toBeVisible()
    await tapControllerButton(page, 1)
    await expect(menu).toHaveCount(0)
    await action(copy.controlActions.back).click()
    await action(catalog.hub.battle).click()
    await expect(
      page
        .getByRole("region", { name: copy.screen.battleChoices, exact: true })
        .getByRole("button")
        .first(),
    ).toBeEnabled()
    await tapControllerButton(page, 4)
    await expect(action(copy.controlActions.undo)).toBeEnabled()
    await tapControllerButton(page, 8)
    await expect(action(copy.results.seeValuesAction)).toBeVisible()
    await tapControllerButton(page, 9)
    await expect(menu).toBeVisible()
    await tapControllerButton(page, 9)
    await expect(menu).toHaveCount(1)
    await tapControllerButton(page, 1)
    await expect(action(copy.results.seeValuesAction)).toBeVisible()
  })
}

test("controller starts play, makes one held choice, guards overlays, and returns through rewards", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeVisible()
  await tapControllerButton(page, 15)
  await expect(page.getByTestId("information-panel-body")).toBeFocused()
  await tapControllerButton(page, 15)
  await expect(page.getByRole("combobox", { name: "Language" })).toBeFocused()
  await tapControllerButton(page, 15)
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeFocused()
  await tapControllerButton(page, 0)
  await expect(
    page.getByRole("heading", { name: "My Values", exact: true }),
  ).toBeVisible()
  await activateWithController(
    page,
    page.getByRole("button", { name: "Battle", exact: true }),
  )
  const choices = page.getByRole("button", { name: /^Choose / })
  await expect(choices.first()).toBeEnabled()
  await activateWithController(
    page,
    page.getByRole("button", { name: "Skip battle animations", exact: true }),
  )
  await expect(choices.first()).toBeEnabled()
  const initialChoices = await choices.allTextContents()
  await controllerButton(page, 4, true)
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled()
  await expect.poll(() => choices.allTextContents()).not.toEqual(initialChoices)
  const nextChoices = await choices.allTextContents()
  await page.screenshot({
    path: test.info().outputPath("controller-battle.png"),
  })
  await controllerButton(page, 4, true)
  expect(await choices.allTextContents()).toEqual(nextChoices)
  await controllerButton(page, 4, false)
  await tapControllerButton(page, 9)
  await expect(
    page.getByRole("dialog", { name: "Menu", exact: true }),
  ).toBeVisible()
  await tapControllerButton(page, 7)
  await tapControllerButton(page, 1)
  await expect(
    page.getByRole("dialog", { name: "Menu", exact: true }),
  ).toHaveCount(0)
  expect(await choices.allTextContents()).toEqual(nextChoices)
  await tapControllerButton(page, 1)
  await expect(
    page.getByRole("button", { name: "Redo", exact: true }),
  ).toBeEnabled()
  await tapControllerButton(page, 3)
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled()
  await tapControllerButton(page, 8)
  await expect(
    page.getByRole("button", { name: "See my values", exact: true }),
  ).toBeVisible()
  await tapControllerButton(page, 8)
  await expect(
    page.getByRole("heading", { name: "My Top Five Life Values", exact: true }),
  ).toBeVisible()
})

test("controller hints stay supplementary and readable at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await startWithController(page)
  await activateWithController(
    page,
    page.getByRole("button", { name: "Battle", exact: true }),
  )
  await expect(
    page.getByRole("button", { name: /^Choose / }).first(),
  ).toBeEnabled()
  await tapControllerButton(page, 15)
  const prompt = page.getByTitle("L1 / L2", { exact: true })
  await expect(prompt).toBeVisible()
  const atlas = await prompt.evaluate(async (element) => {
    const url = getComputedStyle(element).backgroundImage.slice(5, -2)
    const image = new Image()
    image.src = url
    await image.decode()
    return { width: image.naturalWidth, height: image.naturalHeight }
  })
  expect(atlas).toEqual({ width: 384, height: 512 })
  for (const name of ["Menu", "Undo", "Redo", "Stop"]) {
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toBeInViewport()
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320)
  await page.screenshot({ path: test.info().outputPath("controller-320.png") })
  await tapControllerButton(page, 9)
  await activateWithController(
    page,
    page.getByRole("button", { name: "Controls", exact: true }),
  )
  await expect(
    page.getByRole("heading", { name: "Controller", exact: true }),
  ).toHaveCount(1)
  await tapControllerButton(page, 1)
  await expect(
    page.getByRole("dialog", { name: "Controls", exact: true }),
  ).toHaveCount(0)
})

test("controller authors a value, scrolls the catalog and cancels edit and delete reviews", async ({
  page,
}) => {
  test.info().annotations.push({
    type: "evidence-limit",
    description:
      "Text input exercises the keyboard event seam; the physical Steam keyboard remains manual Deck QA.",
  })
  await startWithController(page)
  await activateWithController(
    page,
    page.getByRole("button", { name: "Add value", exact: true }),
  )
  await enterKeyboardText(
    page,
    page.getByRole("textbox", { name: "Value name", exact: true }),
    "Craftsmanship",
  )
  await enterKeyboardText(
    page,
    page.getByRole("textbox", { name: "Definition", exact: true }),
    "To take care in making things well.",
  )
  await tapControllerButton(page, 1)
  await expect(
    page.getByRole("dialog", { name: "Keep your changes?", exact: true }),
  ).toBeVisible()
  await activateWithController(
    page,
    page.getByRole("button", { name: "Keep editing", exact: true }),
  )
  await expect(
    page.getByRole("textbox", { name: "Value name", exact: true }),
  ).toHaveValue("Craftsmanship")
  await activateWithController(
    page,
    page.getByRole("button", { name: "Save", exact: true }),
  )
  await expect(
    page.getByRole("textbox", { name: "Value name", exact: true }),
  ).toHaveCount(0)
  await activateWithController(
    page,
    page.getByRole("button", { name: "Browse All Values", exact: true }),
  )
  const values = page.getByRole("region", { name: "Values", exact: true })
  await focusWithController(page, values)
  const beforeScroll = await values.evaluate((element) => element.scrollTop)
  await tapControllerButton(page, 13)
  await expect
    .poll(() => values.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(beforeScroll)
  await enterKeyboardText(
    page,
    page.getByRole("searchbox", { name: "Search All Values", exact: true }),
    "Craftsmanship",
  )
  const row = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Craftsmanship", exact: true }),
  })
  await expect(row).toHaveCount(1)
  await activateWithController(
    page,
    row.getByRole("button", { name: "Edit", exact: true }),
  )
  await enterKeyboardText(
    page,
    page.getByRole("textbox", {
      name: "What This Value Means to Me",
      exact: true,
    }),
    "A reviewed change.",
  )
  await activateWithController(
    page,
    page.getByRole("button", { name: "Review Update", exact: true }),
  )
  await expect(
    page.getByRole("form", {
      name: "Update Craftsmanship?",
      exact: true,
    }),
  ).toBeVisible()
  await tapControllerButton(page, 1)
  await expect(
    page.getByRole("heading", { name: "Update Craftsmanship?", exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("textbox", {
      name: "What This Value Means to Me",
      exact: true,
    }),
  ).toHaveValue("A reviewed change.")
  await tapControllerButton(page, 1)
  await expect(
    row.getByRole("button", { name: "Edit", exact: true }),
  ).toBeFocused()
  await expect(row).toContainText("To take care in making things well.")
  await activateWithController(
    page,
    row.getByRole("button", { name: "Delete", exact: true }),
  )
  await expect(
    page.getByRole("form", {
      name: "Remove Craftsmanship?",
      exact: true,
    }),
  ).toBeVisible()
  await tapControllerButton(page, 8)
  await expect(
    page.getByRole("heading", { name: "Remove Craftsmanship?", exact: true }),
  ).toHaveCount(0)
  await expect(
    row.getByRole("button", { name: "Delete", exact: true }),
  ).toBeFocused()
  await tapControllerButton(page, 8)
  await expect(
    page.getByRole("button", { name: "Battle", exact: true }),
  ).toBeVisible()
})

test("controller changes settings, customizes a hero and saves a shareable PNG", async ({
  page,
}) => {
  await startWithController(page)
  await tapControllerButton(page, 9)
  await activateWithController(
    page,
    page.getByRole("button", { name: "Settings", exact: true }),
  )
  await activateWithController(
    page,
    page.getByRole("radio", { name: /^Always/ }),
  )
  await expect(page.getByRole("radio", { name: /^Always/ })).toBeChecked()
  await tapControllerButton(page, 8)
  await activateWithController(
    page,
    page.getByRole("button", { name: "Customize my values card", exact: true }),
  )
  const skin = page.getByRole("button", { name: "Skin 2", exact: true })
  await activateWithController(page, skin)
  await expect(skin).toHaveAttribute("aria-pressed", "true")
  await tapControllerButton(page, 8)
  const review = page.getByRole("dialog", {
    name: "Keep your changes?",
    exact: true,
  })
  await expect(review).toBeVisible()
  await activateWithController(
    page,
    review.getByRole("button", { name: "Keep editing", exact: true }),
  )
  await expect(review).toHaveCount(0)
  await expect(skin).toHaveAttribute("aria-pressed", "true")
  await tapControllerButton(page, 8)
  await activateWithController(
    page,
    review.getByRole("button", { name: "Save and return", exact: true }),
  )
  await activateWithController(
    page,
    page.getByRole("button", { name: "Share my values card", exact: true }),
  )
  const share = page.getByRole("dialog", {
    name: "Share my values card",
    exact: true,
  })
  await activateWithController(
    page,
    share.getByRole("button", { name: "PNG · Still", exact: true }),
  )
  const save = share.getByRole("button", { name: "Save PNG", exact: true })
  await expect(save).toBeEnabled()
  const download = page.waitForEvent("download")
  await activateWithController(page, save)
  expect((await download).suggestedFilename()).toBe("my-values-card.png")
  await tapControllerButton(page, 1)
  await expect(share).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Share my values card", exact: true }),
  ).toBeFocused()
})
