import { expect, type Page } from "@playwright/test"
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
  await page.goto("/")
  await page.bringToFront()
})

test("controller starts play, makes one held choice, guards overlays, and returns through rewards", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeVisible()
  await tapControllerButton(page, 15)
  await expect(page.getByTestId("information-panel-body")).toBeFocused()
  await tapControllerButton(page, 15)
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeFocused()
  await tapControllerButton(page, 0)
  await expect(
    page.getByRole("heading", { name: "My Values", exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Battle", exact: true }).click()
  const choices = page.getByRole("button", { name: /^Choose / })
  await expect(choices.first()).toBeEnabled()
  await page
    .getByRole("button", { name: "Skip battle animations", exact: true })
    .click()
  await expect(choices.first()).toBeEnabled()
  const initialChoices = await choices.allTextContents()
  await controllerButton(page, 4, true)
  await expect(
    page.getByRole("button", { name: "Undo", exact: true }),
  ).toBeEnabled()
  const nextChoices = await choices.allTextContents()
  expect(nextChoices).not.toEqual(initialChoices)
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
  await page.getByRole("button", { name: "Start", exact: true }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).click()
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
  await page.getByRole("button", { name: "Controls", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Controller", exact: true }),
  ).toHaveCount(1)
  await tapControllerButton(page, 1)
  await expect(
    page.getByRole("dialog", { name: "Controls", exact: true }),
  ).toHaveCount(0)
})
