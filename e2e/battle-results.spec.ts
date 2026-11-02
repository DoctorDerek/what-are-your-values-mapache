import { expect } from "@playwright/test"
import { test } from "./fixtures"
import { getRenderedTextLines } from "./visible-text-bounds"

test.use({
  viewport: { width: 320, height: 640 },
  reducedMotion: "no-preference",
})

for (const scale of [100, 200]) {
  test(`Spanish Results actions keep complete words and reachable exits at 320px/${scale}%`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto("/que-valoras-en-la-vida")
    await page.getByRole("button", { name: "Empezar", exact: true }).click()
    await page.getByRole("button", { name: "Combatir", exact: true }).click()
    await page
      .getByRole("button", { name: /^Elegir .* Nivel .* Opción/ })
      .first()
      .click()
    await expect(
      page.getByRole("button", { name: "Deshacer", exact: true }),
    ).toBeEnabled()
    await page.getByRole("button", { name: "Detener", exact: true }).click()
    await page.addStyleTag({ content: `html { font-size: ${scale}%; }` })
    const resume = page.getByRole("button", {
      name: "Seguir combatiendo",
      exact: true,
    })
    await expect(resume).toBeInViewport({ ratio: 1 })
    const roster = page.getByRole("list", {
      name: "Resultados de tus valores",
      exact: true,
    })
    const rosterViewport = roster.locator("..")
    const profile = page.getByRole("region", {
      name: "Progreso del perfil",
      exact: true,
    })
    const exit = page.getByRole("button", {
      name: "Ver mis valores",
      exact: true,
    })
    expect((await rosterViewport.boundingBox())!.height).toBeGreaterThanOrEqual(
      160,
    )
    if (scale === 200) {
      const firstRow = roster.getByRole("listitem").first()
      await firstRow.evaluate((row) => row.scrollIntoView({ block: "start" }))
      const dismiss = page
        .getByRole("button", { name: /^Cerrar logro:/ })
        .first()
      if (await dismiss.isVisible()) await dismiss.click()
      await firstRow.evaluate((row) => row.scrollIntoView({ block: "start" }))
      await expect
        .poll(() =>
          firstRow.evaluate((row) => {
            const r = row.getBoundingClientRect()
            return row.contains(
              document.elementFromPoint(
                r.left + r.width / 2,
                r.top + r.height / 2,
              ),
            )
          }),
        )
        .toBe(true)
      await expect(exit).toBeInViewport({ ratio: 1 })
      await expect(resume).toBeInViewport({ ratio: 1 })
      await page.screenshot({
        path: testInfo.outputPath("enlarged-results-roster-and-exits.png"),
      })
      await profile.evaluate((strip) => strip.scrollIntoView({ block: "end" }))
    }
    await expect(profile).toBeInViewport({ ratio: 1 })
    const profileBounds = (await profile.boundingBox())!
    for (const action of [exit, resume]) {
      const r = (await action.boundingBox())!
      expect(r.y + r.height).toBeLessThanOrEqual(profileBounds.y + 1)
      expect(
        await action.evaluate((button) => {
          const rect = button.getBoundingClientRect()
          return button.contains(
            document.elementFromPoint(
              rect.x + rect.width / 2,
              rect.y + rect.height / 2,
            ),
          )
        }),
      ).toBe(true)
    }
    if (scale === 200) {
      await page.addStyleTag({
        content:
          "nav button { font-family: Verdana, sans-serif; letter-spacing: 0.12em; }",
      })
      await expect(exit).toBeInViewport({ ratio: 1 })
      await expect(resume).toBeInViewport({ ratio: 1 })
    }
    expect(
      await resume.evaluate(
        (button) => button.scrollWidth - button.clientWidth,
      ),
    ).toBe(0)
    const lines = await resume.evaluate(getRenderedTextLines)
    expect(
      lines.some((line) => line.toLowerCase().includes("combatiendo")),
    ).toBe(true)
    const bounds = await resume.boundingBox()
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
    expect(bounds!.y + bounds!.height + 6).toBeLessThanOrEqual(568)
    await page.screenshot({
      path: testInfo.outputPath(`results-spanish-${scale}.png`),
    })
    const scroller = resume.locator(
      "xpath=ancestor::*[@data-controller-scroll][1]",
    )
    await resume.hover()
    await page.mouse.down()
    try {
      await expect(resume).toHaveCSS("translate", "6px 6px")
      expect(
        await scroller.evaluate(
          (element) => element.scrollWidth - element.clientWidth,
        ),
      ).toBe(0)
    } finally {
      await page.mouse.up()
    }
    await expect(
      page.getByRole("button", { name: "Detener", exact: true }),
    ).toBeVisible()
  })
}

test("Saved locally fades without moving the Results composition", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Start" }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).click()
  await page
    .getByRole("button", { name: /^Choose / })
    .first()
    .click()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
  await page.getByRole("button", { name: /Stop/ }).click()
  const confirmation = page
    .getByRole("status")
    .filter({ hasText: "Saved locally" })
  await expect(confirmation).toBeVisible()
  const roster = page.getByRole("list", { name: "Your value results" })
  const before = await roster.boundingBox()
  await expect(confirmation).not.toBeVisible({ timeout: 7000 })
  expect(await roster.boundingBox()).toEqual(before)
  const finalRows = await roster.innerText()
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await page.getByRole("button", { name: "Settings", exact: true }).click()
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Results", exact: true }),
  ).toBeVisible()
  expect(await roster.innerText()).toBe(finalRows)
  await expect(
    page.getByRole("region", { name: "Profile progress" }),
  ).toContainText("Profile Level 3")
  await expect(
    page.getByRole("status").filter({ hasText: "Saved locally" }),
  ).toHaveCount(0)
})

test("browser Back closes actual parents, preserves drafts and permits Hub departure", async ({
  page,
}) => {
  await page.goto("/robots.txt")
  await page.goto("/")
  await page.getByRole("button", { name: "Start" }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).waitFor()
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(history.state?.wayvmSemanticBackBoundary)),
    )
    .toBe(false)
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .click()
  await page.evaluate(() => history.back())
  await expect(
    page.getByRole("heading", {
      name: /^My (?:Top Five Life )?Values$/,
      exact: true,
    }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Add value", exact: true }).click()
  await page.getByLabel("Value name", { exact: true }).fill("Keep my draft")
  await page.evaluate(() => history.back())
  await expect(
    page.getByRole("dialog", { name: "Keep your changes?" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Keep editing", exact: true }).click()
  await expect(page.getByLabel("Value name", { exact: true })).toBeFocused()
  await expect(page.getByLabel("Value name", { exact: true })).toHaveValue(
    "Keep my draft",
  )
  await page
    .getByLabel("Definition", { exact: true })
    .fill("to retain my considered choices")
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(
    page.getByText("Your Custom Values are saved and ready to battle.", {
      exact: true,
    }),
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(history.state?.wayvmSemanticBackBoundary)),
    )
    .toBe(false)
  await page.goBack()
  await expect(page).toHaveURL(/\/robots\.txt$/)
})

test("battle results show committed progress without delaying either exit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(crypto, "randomUUID", {
      value: () => "bfc518dd-4ee2-42c6-906a-e9baf8edfc40",
    })
  })
  await page.goto("/")
  await expect(
    page.getByRole("button", { name: "Start", exact: true }),
  ).toBeVisible()
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
  await page.getByRole("button", { name: "Start" }).click()
  await page.getByRole("button", { name: "Battle", exact: true }).click()

  await page
    .getByRole("button", { name: "Skip battle animations", exact: true })
    .click()
  const choices = page.getByRole("button", { name: /^Choose / })
  const entryPair = await choices.evaluateAll((buttons) =>
    buttons.map((button) => button.getAttribute("aria-label")),
  )
  const winner = page.getByRole("button", { name: /^Choose Wealth\./ })
  await winner.click()
  await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
  await page
    .getByRole("button", {
      name: "Dismiss achievement: First Battle",
      exact: true,
    })
    .click()
  await page.clock.pauseAt(new Date("2026-01-01T01:00:00Z"))
  await page.getByRole("button", { name: /Stop/ }).click()
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible()

  const row = page
    .getByRole("list", { name: "Your value results" })
    .getByRole("listitem")
    .first()
  await expect(row.locator(".sr-only")).toContainText("Wealth")
  const counter = row.locator("span.absolute").filter({ hasText: /^#\d+$/ })
  const profile = page.getByRole("region", { name: "Profile progress" })
  const rank = async () => Number((await counter.textContent())!.slice(1))
  const rankWidth = () =>
    counter.evaluate(
      (element) => getComputedStyle(element.parentElement!).width,
    )
  const startRank = await rank()
  const startWidth = await rankWidth()
  const startTravel = await row.evaluate((element: HTMLElement) =>
    element.style.getPropertyValue("--results-travel"),
  )
  await expect(
    page.getByRole("button", { name: "See my values" }),
  ).toBeEnabled()
  await expect(
    page.getByRole("button", { name: "Keep battling" }),
  ).toBeEnabled()

  await page.clock.runFor(650)
  expect(await rank()).toBeLessThan(startRank)
  expect(await rank()).toBeGreaterThan(1)
  expect(await rankWidth()).toBe(startWidth)
  expect(
    Number(
      await row.evaluate((element: HTMLElement) =>
        element.style.getPropertyValue("--results-travel"),
      ),
    ),
  ).toBeGreaterThan(Number(startTravel))
  for (const progress of [
    profile.getByRole("progressbar"),
    row.getByRole("progressbar", { includeHidden: true }),
  ])
    expect(
      Number(await progress.getAttribute("aria-valuenow")),
    ).toBeGreaterThan(0)

  await page.clock.runFor(3_150)
  await expect(counter).toHaveText("#1")
  expect(await rankWidth()).toBe(startWidth)
  await expect(
    page
      .getByRole("list", { name: "Your value results" })
      .getByRole("listitem"),
  ).toHaveCount(103)
  await expect(
    page.getByRole("region", { name: "Profile progress" }),
  ).toContainText("Profile XP 4")
  await expect(
    page.getByRole("button", { name: "See my values" }),
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Keep battling" }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)

  await page.clock.resume()
  await page.getByRole("button", { name: "Keep battling" }).click()
  await expect(page.getByRole("main", { name: "Value battle" })).toBeVisible()
  await expect
    .poll(() =>
      choices.evaluateAll((buttons) =>
        buttons.map((button) => button.getAttribute("aria-label")),
      ),
    )
    .not.toEqual(entryPair)

  await page.getByRole("button", { name: /Stop/ }).click()
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /^My (?:Top Five Life )?Values$/,
    }),
  ).toBeVisible()
  await expect(page.getByRole("heading", { name: "Results" })).toHaveCount(0)
})

for (const viewport of [
  { width: 320, height: 640 },
  { width: 1440, height: 900 },
]) {
  test(`final strongest value owns overlapping row pixels at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.getByRole("button", { name: "Start" }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const choices = page.getByRole("button", { name: /^Choose / })
    const firstChoice = await choices.first().getAttribute("aria-label")
    await (
      firstChoice?.startsWith("Choose Acceptance")
        ? choices.last()
        : choices.first()
    ).click()
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
    await page.evaluate(() => {
      let overlapSamples = 0
      let lastSampleAt = 0
      const observer = new MutationObserver(() => {
        const roster = document.querySelector(
          'ol[aria-label="Your value results"]',
        )
        if (!roster || performance.now() - lastSampleAt < 100) return
        lastSampleAt = performance.now()
        const rosterBounds = roster.parentElement!.getBoundingClientRect()
        const rows = [...roster.querySelectorAll("li")].slice(0, 12)
        for (let index = 0; index < rows.length - 1; index += 1) {
          const stronger = rows[index]
          const weaker = rows[index + 1]
          const strongerBounds = stronger.getBoundingClientRect()
          const weakerBounds = weaker.getBoundingClientRect()
          const top = Math.max(
            strongerBounds.top,
            weakerBounds.top,
            rosterBounds.top,
          )
          const bottom = Math.min(
            strongerBounds.bottom,
            weakerBounds.bottom,
            rosterBounds.bottom,
          )
          if (bottom <= top) continue
          overlapSamples += 1
          const painted = document.elementFromPoint(
            strongerBounds.left + strongerBounds.width / 2,
            (top + bottom) / 2,
          )
          const coveringRows = rows.filter((row) => {
            const bounds = row.getBoundingClientRect()
            const x = strongerBounds.left + strongerBounds.width / 2
            const y = (top + bottom) / 2
            return (
              x >= bounds.left &&
              x < bounds.right &&
              y >= bounds.top &&
              y < bounds.bottom
            )
          })
          const foreground = coveringRows.toSorted(
            (first, second) =>
              Number(getComputedStyle(second).zIndex) -
              Number(getComputedStyle(first).zIndex),
          )[0]
          if (!foreground.contains(painted))
            document.documentElement.dataset.resultsStackObscured = "true"
        }
        if (overlapSamples >= 5)
          document.documentElement.dataset.resultsStackVerified = "true"
        if (!roster.isConnected) observer.disconnect()
      })
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["style"],
        childList: true,
        subtree: true,
      })
    })
    await page.getByRole("button", { name: /Stop/ }).click()
    await expect(page.locator("html")).toHaveAttribute(
      "data-results-stack-verified",
      "true",
    )
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-results-stack-obscured",
      "true",
    )
    const roster = page.getByRole("list", { name: "Your value results" })
    const stackingOrders = await roster
      .getByRole("listitem")
      .evaluateAll((rows) =>
        rows.map((row) => Number(getComputedStyle(row).zIndex)),
      )
    expect(stackingOrders[0]).toBeGreaterThan(
      Math.max(...stackingOrders.slice(1)),
    )
    await expect(
      page.getByRole("button", { name: "Menu", exact: true }),
    ).toBeVisible()
    await page.getByRole("button", { name: "See my values" }).click()
    await expect(
      page.getByRole("heading", {
        name: /^My (?:Top Five Life )?Values$/,
        level: 2,
      }),
    ).toBeVisible()
  })

  test(`scrolling settles ranking without skipping rewards at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.getByRole("button", { name: "Start" }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    await page
      .getByRole("button", { name: /^Choose / })
      .first()
      .click()
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
    await page.getByRole("button", { name: /Stop/ }).click()
    const roster = page.getByRole("list", { name: "Your value results" })
    const profile = page.getByRole("region", { name: "Profile progress" })
    await expect(profile.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      /[1-9]/,
    )
    await roster.dispatchEvent("wheel", { deltaY: 10 })
    await expect(profile).toContainText("Profile Level 1")
    await expect(roster.getByRole("listitem").first()).toHaveCSS(
      "transform",
      "none",
    )
    await page.screenshot({
      path: testInfo.outputPath(`results-${viewport.width}.png`),
    })
    await expect(profile).toContainText("Profile Level 3")
    await expect(profile).toContainText("Profile XP 4")
    const firstRow = roster.getByRole("listitem").first()
    await expect(
      firstRow.locator(
        '[data-hub-active-clip="true"] [data-playback-ready="true"]',
      ),
    ).toHaveCount(1)
    await page.mouse.move(0, 0)
    await firstRow.hover()
    await expect(
      firstRow.locator(
        '[data-hub-active-clip="true"] [data-playback-mode="one-shot"][data-playback-ready="true"]',
      ),
    ).toHaveCount(1)
    await page.mouse.move(0, 0)
    await expect(
      firstRow.locator(
        '[data-hub-active-clip="true"] [data-playback-mode="loop"]',
      ),
    ).toHaveCount(1)
    await expect(
      page.getByRole("button", { name: "See my values" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Keep battling" }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    await page.getByRole("button", { name: "See my values" }).click()
    await expect(
      page.getByRole("heading", {
        name: /^My (?:Top Five Life )?Values$/,
        level: 2,
      }),
    ).toBeVisible()
  })

  test(`multiple promoted rewards remain painted during simultaneous fills at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    await page.getByRole("button", { name: "Start" }).click()
    await page.getByRole("button", { name: "Battle", exact: true }).click()
    const choices = page.getByRole("button", { name: /^Choose / })
    await choices.first().click()
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
    await page
      .getByRole("button", {
        name: "Dismiss achievement: First Battle",
        exact: true,
      })
      .click()
    await choices.first().click()
    await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled()
    await page.getByRole("button", { name: /Stop/ }).click()
    const roster = page.getByRole("list", { name: "Your value results" })
    await expect(page.getByRole("heading", { name: "Results" })).toBeVisible()
    const evidence = await roster.evaluate(async (element) => {
      const samples = []
      for (let index = 0; index < 5; index += 1) {
        const bounds = element.parentElement!.getBoundingClientRect()
        const rows = [...element.querySelectorAll("li")].slice(0, 2)
        samples.push(
          rows.map((row) => {
            const reward = row.querySelector('[data-slot="progress"]')!
            const box = reward.getBoundingClientRect()
            return {
              painted:
                box.width > 0 &&
                box.top >= bounds.top &&
                box.bottom <= bounds.bottom &&
                row.contains(
                  document.elementFromPoint(
                    box.left + box.width / 2,
                    box.top + box.height / 2,
                  ),
                ),
              fill: reward.getAttribute("aria-valuenow"),
              identity: row.querySelector(".sr-only")?.textContent,
            }
          }),
        )
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      return samples
    })
    for (let rowIndex = 0; rowIndex < 2; rowIndex += 1) {
      expect(
        evidence.filter((sample) => sample[rowIndex].painted).length,
      ).toBeGreaterThanOrEqual(2)
    }
    expect(evidence[0].map(({ identity }) => identity)).toEqual(
      evidence[4].map(({ identity }) => identity),
    )
    expect(evidence[0].map(({ fill }) => fill)).not.toEqual(
      evidence[4].map(({ fill }) => fill),
    )
    await page.screenshot({
      path: testInfo.outputPath(`results-visible-${viewport.width}.png`),
    })
    await page.getByRole("button", { name: "See my values" }).click()
    await expect(
      page.getByRole("heading", {
        name: /^My (?:Top Five Life )?Values$/,
        level: 2,
      }),
    ).toBeVisible()
  })
}
