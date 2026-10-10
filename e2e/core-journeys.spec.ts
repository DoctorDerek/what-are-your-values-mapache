import { expect, type Locator } from "@playwright/test"
import {
  CUSTOM_VALUE_INVITATION_COPY as copy,
  CUSTOM_VALUE_AUTHORING_EXAMPLE as example,
} from "#game/data/src/CustomValueInvitationCopy"
import { test } from "./fixtures"

const getChoiceValueName = async (choice: Locator) => {
  const valueName = await choice
    .getByRole("heading", { level: 2 })
    .textContent()

  if (!valueName) throw new Error("The projected choice is missing its name")

  return valueName
}

test("a player previews every appearance category and retains only saved choices", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).click()
  await page
    .getByRole("button", { name: "Customize my card", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Dressing Room", exact: true }),
  ).toBeVisible()
  await expect(
    page
      .getByRole("img", { name: "Your Heroes99 character" })
      .locator("canvas"),
  ).toBeVisible()
  const heroCanvas = page
    .getByRole("img", { name: "Your Heroes99 character" })
    .locator("canvas")
  const initialAppearance = await heroCanvas.evaluate(
    (canvas: HTMLCanvasElement) => canvas.toDataURL(),
  )
  await page.getByRole("button", { name: "Skin 6", exact: true }).click()
  await page.getByRole("button", { name: "Face", exact: true }).click()
  await page.getByRole("button", { name: "Face 7", exact: true }).click()
  await page.getByRole("button", { name: "Hair", exact: true }).click()
  await page.getByRole("button", { name: "None", exact: true }).click()
  await expect(page.getByRole("group", { name: "Hair palette" })).toHaveCount(0)
  await page.getByRole("button", { name: "Clothing", exact: true }).click()
  await page.getByRole("button", { name: "Outfit 17", exact: true }).click()
  await page.getByRole("button", { name: "Palette 8", exact: true }).click()
  await page.getByRole("button", { name: "Weapon", exact: true }).click()
  await page.getByRole("button", { name: "Dagger", exact: true }).click()
  await page.getByRole("button", { name: "Palette 4", exact: true }).click()
  await expect
    .poll(() =>
      heroCanvas.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
    )
    .not.toBe(initialAppearance)
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await page.getByRole("button", { name: "Keep editing", exact: true }).click()
  await page
    .getByRole("button", { name: "Save appearance", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "My Values", exact: true }),
  ).toBeVisible()
  await page.reload()
  await page
    .getByRole("button", { name: "Customize my card", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Skin 6", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
  await page.getByRole("button", { name: "Randomize", exact: true }).click()
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  await page
    .getByRole("button", { name: "Customize my card", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Skin 6", exact: true }),
  ).toHaveAttribute("aria-pressed", "true")
})

test("a new player starts immediately and reviews the complete ranking", async ({
  page,
}) => {
  await page.goto("/")

  const gameIsland = page.getByRole("region", {
    name: "Play What Are Your Values, Mapache?",
  })
  await expect(
    gameIsland.getByRole("heading", {
      level: 1,
      name: "What Are Your Values, Mapache?",
    }),
  ).toBeVisible()
  await expect(
    gameIsland.getByText(
      "Private. Offline. Account-free. Your choices and Custom Values stay on this device unless you choose to export them.",
    ),
  ).toBeVisible()
  const editorial = page.getByRole("article", {
    name: "What Are Your Values, Mapache? information",
    includeHidden: true,
  })
  await expect(editorial).toBeVisible()

  await page.getByRole("button", { name: "Start" }).click()
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /^My (?:Top Five Life )?Values$/,
    }),
  ).toBeVisible()
  await expect(page.getByText("Not ranked yet")).toBeVisible()
  await expect(editorial).toBeHidden()
  const roster = page.getByRole("region", { name: "Included values" })
  await expect(roster.getByRole("listitem")).toHaveCount(103)
  await roster.focus()
  await page.keyboard.press("End")
  await expect(roster.getByRole("listitem").last()).toBeInViewport()
  const scrollTop = await roster.evaluate((element) => element.scrollTop)

  await page.getByRole("button", { name: "Browse All Values" }).click()
  await expect(
    page.getByRole("heading", { level: 1, name: "All Values" }),
  ).toBeVisible()
  await expect(page.getByText("103 Active Values")).toBeVisible()
  await expect(page.getByRole("listitem")).toHaveCount(103)

  await page
    .getByRole("searchbox", { name: "Search All Values" })
    .fill("health")
  await expect(page.getByRole("listitem")).toHaveCount(1)
  await expect(page.getByRole("heading", { name: "Health" })).toBeVisible()

  for (const name of ["Ingenuity", "Destiny", "Pets"]) {
    await page.getByRole("searchbox", { name: "Search All Values" }).fill(name)
    const row = page.getByRole("listitem")
    await expect(row).toHaveCount(1)
    await expect(row.getByRole("heading", { name, exact: true })).toBeVisible()
    await expect(
      row.getByRole("button", { name: "Edit", exact: true }),
    ).toHaveCount(0)
  }

  await page.getByRole("button", { name: "Close" }).click()
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /^My (?:Top Five Life )?Values$/,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Browse All Values" }),
  ).toBeFocused()
  await expect
    .poll(() => roster.evaluate((element) => element.scrollTop))
    .toBe(scrollTop)
  await expect(editorial).toBeHidden()
  await page.reload()
  await expect(page.getByText("Home screen", { exact: true })).toBeVisible()
  await expect(editorial).toBeHidden()
})

test("a player uses the informational example to author a custom value and retains it after reload", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start", exact: true }).click()
  await expect(page.getByText(copy.example)).toHaveCount(0)
  await page.getByRole("button", { name: "Add value", exact: true }).click()
  await expect(page.getByLabel("Value name", { exact: true })).toHaveValue("")
  await expect(page.getByLabel("Definition", { exact: true })).toHaveValue("")
  await expect(page.getByText(copy.example)).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toBeDisabled()
  await expect(page.getByRole("button", { name: "Add all three" })).toHaveCount(
    0,
  )
  await page.getByLabel("Value name", { exact: true }).fill(example.name)
  await page.getByLabel("Definition", { exact: true }).fill(example.definition)
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(
    page.getByText("Your Custom Values are saved and ready to battle."),
  ).toBeVisible()
  await page.reload()
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .click()
  await expect(page.getByText("104 Active Values")).toBeVisible()
  await page
    .getByRole("searchbox", { name: "Search All Values" })
    .fill("Craftsmanship")
  const row = page.getByRole("listitem")
  await expect(row).toHaveCount(1)
  await expect(
    row.getByText("“to take care and pride in making things well”"),
  ).toBeVisible()
  await expect(
    row.getByRole("button", { name: "Edit", exact: true }),
  ).toBeVisible()
})

test("a returning player keeps Undo and Redo across reloads", async ({
  page,
}) => {
  await page.goto("/")

  await page.getByRole("button", { name: "Start" }).click()
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /^My (?:Top Five Life )?Values$/,
    }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Battle", exact: true }).click()
  await expect(page.getByRole("main", { name: "Value battle" })).toBeVisible()

  const firstChoice = page.getByRole("button", { name: /^Choose / }).first()
  const firstChoiceName = await getChoiceValueName(firstChoice)

  await expect(firstChoice).toHaveAccessibleDescription(/^“.+”$/)
  await expect(firstChoice.locator("p")).toBeVisible()
  await expect(page.locator("details")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^Choose / })).toHaveCount(2)

  await firstChoice.click()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
  await page.getByRole("button", { name: "Undo" }).click()
  await expect(page.getByRole("button", { name: "Redo" })).toBeEnabled()
  await page.reload()

  await page.getByRole("button", { name: "Battle", exact: true }).click()
  await expect(page.getByRole("button", { name: "Redo" })).toBeEnabled()
  await page.getByRole("button", { name: "Redo" }).click()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
  await page.reload()

  const winningValue = page
    .getByRole("listitem")
    .filter({ has: page.getByText(firstChoiceName, { exact: true }) })
  await expect(winningValue).toContainText("#1")
  const firstRankedValue = winningValue
  await expect(firstRankedValue).toContainText(firstChoiceName)
  await expect(firstRankedValue).toContainText("Level 3")
  await expect(page.getByRole("listitem")).toHaveCount(103)
})

test("a secondary tab stays read-only then inherits released writer ownership", async ({
  context,
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start" }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).click()
  await expect(page.getByRole("main", { name: "Value battle" })).toBeVisible()

  const secondaryPage = await context.newPage()
  await secondaryPage.goto("/")
  await expect(
    secondaryPage.getByRole("heading", { name: "Another Tab Is Active" }),
  ).toBeVisible()
  await expect(
    secondaryPage.getByText(
      "This game was updated in another tab. Reload the latest progress or export this tab’s current state before continuing.",
    ),
  ).toBeVisible()
  await expect(
    secondaryPage.getByRole("button", { name: "Export This Tab" }),
  ).toBeEnabled()
  await expect(
    secondaryPage.getByRole("button", { name: "Start" }),
  ).toHaveCount(0)
  await expect(
    secondaryPage.getByRole("button", { name: "Battle", exact: true }),
  ).toHaveCount(0)
  await expect(
    secondaryPage.getByRole("button", { name: /^Choose / }),
  ).toHaveCount(0)

  const ownerChoice = page.getByRole("button", { name: /^Choose / }).first()
  const ownerChoiceName = await getChoiceValueName(ownerChoice)

  await ownerChoice.click()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
  await page.close()

  await secondaryPage.getByRole("button", { name: "Load Latest" }).click()
  await expect(
    secondaryPage.getByRole("heading", {
      level: 2,
      name: /^My (?:Top Five Life )?Values$/,
    }),
  ).toBeVisible()
  const inheritedWinningValue = secondaryPage
    .getByRole("listitem")
    .filter({ has: secondaryPage.getByText(ownerChoiceName, { exact: true }) })
  await expect(inheritedWinningValue).toContainText("#1")
  const inheritedTopValue = inheritedWinningValue
  await expect(inheritedTopValue).toContainText(ownerChoiceName)
  await expect(inheritedTopValue).toContainText("Level 3")

  await secondaryPage
    .getByRole("button", { name: "Battle", exact: true })
    .click()
  await expect(
    secondaryPage.getByRole("main", { name: "Value battle" }),
  ).toBeVisible()
  const choiceButtons = secondaryPage.getByRole("button", { name: /^Choose / })
  const inheritedPair = await choiceButtons.evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("aria-label")),
  )

  await choiceButtons.first().click()
  await expect
    .poll(() =>
      choiceButtons.evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label")),
      ),
    )
    .not.toEqual(inheritedPair)
})
