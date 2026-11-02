import { expect } from "@playwright/test"
import { getLocaleCatalog } from "#game/data/src/LocalizationCatalog"
import { test } from "./fixtures"
import { getRenderedTextLines } from "./visible-text-bounds"

test.use({ serviceWorkers: "block", reducedMotion: "reduce" })

for (const locale of ["en", "es-MX"] as const) {
  const copy = getLocaleCatalog(locale)
  for (const width of [390, 1280]) {
    test(`${locale} value browsing keeps approved placement and Menu continuity at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: width === 390 ? 740 : 900 })
      await page.goto(copy.metadata.webPath)
      await page
        .getByRole("button", {
          name: copy.introduction.startAction,
          exact: true,
        })
        .click()
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      const homeRow = page.locator("[data-value-row]").first()
      await expect(
        homeRow.getByText(copy.hub.level(1), { exact: true }),
      ).toBeVisible()
      const homePlacement = await homeRow.evaluate((row) => {
        const name = row.querySelector("h3")!
        const level = name.parentElement!.querySelector("p")!
        return {
          name: name.getBoundingClientRect().toJSON(),
          level: level.getBoundingClientRect().toJSON(),
        }
      })
      expect(homePlacement.level.left).toBeGreaterThan(homePlacement.name.left)
      await page.screenshot({
        path: testInfo.outputPath(`${locale}-${width}-home.png`),
      })
      await page
        .getByRole("button", { name: copy.hub.browse, exact: true })
        .click()
      const search = page.getByRole("searchbox")
      const menu = page.getByRole("button", {
        name: copy.interfaceCopy.menu.openAction,
        exact: true,
      })
      await search.fill("practicality")
      const row = page.locator("[data-value-row]").first()
      await expect(page.locator("[data-value-row]")).toHaveCount(1)
      for (const scale of [1, 2]) {
        await page.evaluate((scale) => {
          document.documentElement.style.fontSize = `${scale * 100}%`
        }, scale)
        await row.scrollIntoViewIfNeeded()
        const geometry = await row.evaluate((row) => {
          const name = row.querySelector("h3")!
          const bar = row.querySelector('[role="progressbar"]')!
          const box = bar.parentElement!
          const level = box.firstElementChild!
          const xp = box.lastElementChild!
          return {
            name: name.getBoundingClientRect().toJSON(),
            box: box.getBoundingClientRect().toJSON(),
            level: level.getBoundingClientRect().toJSON(),
            bar: bar.getBoundingClientRect().toJSON(),
            xp: xp.getBoundingClientRect().toJSON(),
            levelAlign: getComputedStyle(level).textAlign,
            xpAlign: getComputedStyle(xp).textAlign,
            overflow: row.scrollWidth - row.clientWidth,
          }
        })
        expect(geometry.overflow).toBeLessThanOrEqual(1)
        if (width === 390 && scale === 2) {
          expect(geometry.levelAlign).toBe("left")
          expect(geometry.xpAlign).toBe("right")
          expect(geometry.xp.top).toBeGreaterThanOrEqual(geometry.level.bottom)
          expect(geometry.xp.left).toBeGreaterThanOrEqual(geometry.bar.right)
        } else {
          expect(geometry.levelAlign).toBe("right")
          expect(geometry.xpAlign).toBe("left")
          expect(geometry.bar.top).toBeGreaterThanOrEqual(geometry.level.bottom)
          expect(geometry.xp.top).toBeGreaterThanOrEqual(geometry.bar.bottom)
        }
        if (width < 1280) {
          expect(geometry.name.bottom).toBeLessThanOrEqual(geometry.box.top)
        } else if (scale === 1) {
          expect(geometry.name.right).toBeLessThan(geometry.box.left)
          expect(geometry.name.top).toBeLessThan(geometry.box.bottom)
        }
        await expect(
          page.getByRole("button", {
            name: copy.interfaceCopy.dressingRoom.back,
            exact: true,
          }),
        ).toBeInViewport({ ratio: 1 })
        const titleLines = await page
          .getByRole("heading", {
            name: copy.interfaceCopy.screen.allValues,
            exact: true,
          })
          .evaluate(getRenderedTextLines)
        const titleWords = copy.interfaceCopy.screen.allValues
          .toLocaleLowerCase()
          .split(/\s+/u)
        expect(
          titleWords.every((word) =>
            titleLines.some((line) => line.toLocaleLowerCase().includes(word)),
          ),
        ).toBe(true)
        await row.getByRole("heading").scrollIntoViewIfNeeded()
        await page.screenshot({
          path: testInfo.outputPath(`${locale}-${width}-${scale}x-values.png`),
        })
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "100%"
      })
      await search.fill("a")
      const roster = page.getByRole("region", {
        name: copy.interfaceCopy.screen.values,
        exact: true,
      })
      await roster.evaluate((element) => {
        element.scrollTop = 400
      })
      const previousScroll = await roster.evaluate(
        (element) => element.scrollTop,
      )
      await menu.click()
      const dialog = page.getByRole("dialog")
      await dialog
        .getByRole("button", {
          name: copy.interfaceCopy.menu.closeAction,
          exact: true,
        })
        .click()
      await expect(dialog).toHaveCount(0)
      await expect(search).toHaveValue("a")
      await expect(menu).toBeFocused()
      expect(await roster.evaluate((element) => element.scrollTop)).toBe(
        previousScroll,
      )
      expect(
        await page.evaluate(() => document.scrollingElement!.scrollTop),
      ).toBe(0)
    })
  }

  test(`${locale} keeps names, standings, animals and progress inside the phone cards before and after a battle`, async ({
    page,
  }, testInfo) => {
    await page.addInitScript(() => {
      Object.defineProperty(crypto, "randomUUID", {
        value: () => "00000000-0000-4000-8000-0000000005dc",
      })
    })
    await page.goto(copy.metadata.webPath)
    const button = (name: string) =>
      page.getByRole("button", { name, exact: true })
    await button(copy.introduction.startAction).click()
    for (const ranked of [false, true]) {
      if (ranked) {
        await button(copy.hub.battle).click()
        const battle = page.locator("[data-choreography-identity]")
        const first = battle.locator('[data-combatant-side="first"]')
        await expect(first).toHaveAttribute("data-animal-id", "tigerpack")
        await battle.locator('[data-battle-arena-side="first"]').click()
        await expect(
          button(copy.interfaceCopy.controlActions.undo),
        ).toBeEnabled()
        await button(copy.interfaceCopy.controlActions.stop).click()
        await button(copy.interfaceCopy.results.seeValuesAction).click()
      }
      await button(copy.hub.browse).click()
      const rows = page.locator("[data-value-row]")
      await expect(rows).toHaveCount(103)
      for (const [width, scale] of [
        [390, 1],
        [320, 2],
      ] as const) {
        await page.setViewportSize({ width, height: 844 })
        await page.evaluate(
          (size) => {
            document.documentElement.style.fontSize = size
          },
          scale * 100 + "%",
        )
        const overflow = await rows.evaluateAll((elements) =>
          elements
            .filter((el) => el.scrollWidth > el.clientWidth + 1)
            .map((el) => el.id),
        )
        expect(overflow).toEqual([])
        for (const [id, name, expectedRank] of [
          ["fitness", locale === "en" ? "Fitness" : "Condición física", 1],
          ["order", locale === "en" ? "Order" : "Orden", 70],
        ] as const) {
          const row = page.locator(`[id="all-values-row-pvcs-2011:${id}"]`)
          const heading = row.getByRole("heading", { name, exact: true })
          await expect(heading).toBeVisible()
          await expect(
            row.getByText(
              copy.interfaceCopy.screen.valueLevel(
                ranked && id === "fitness" ? "3" : "1",
              ),
              { exact: true },
            ),
          ).toBeVisible()
          const standing = row.getByText("#" + expectedRank, { exact: true })
          await expect(standing).toHaveCount(ranked ? 1 : 0)
          await expect(row.locator('img[src*="gold"]')).toHaveCount(
            ranked && id === "fitness" ? 1 : 0,
          )
          const frame = row.locator("[data-value-presentation]")
          await expect(frame).toHaveAttribute(
            "data-value-presentation",
            "animal",
          )
          const layout = await row.evaluate((el) => {
            const bounds = (selector: string) =>
              el.querySelector(selector)!.getBoundingClientRect().toJSON()
            return {
              row: el.getBoundingClientRect().toJSON(),
              heading: bounds("h3"),
              art: bounds("[data-value-presentation]"),
              progress: el
                .querySelector('[role="progressbar"]')!
                .parentElement!.getBoundingClientRect()
                .toJSON(),
              definition: bounds("p"),
            }
          })
          expect(layout.heading.bottom).toBeLessThanOrEqual(layout.art.top)
          expect(layout.definition.top).toBeGreaterThanOrEqual(
            layout.progress.bottom,
          )
          for (const bounds of [
            layout.heading,
            layout.art,
            layout.progress,
            layout.definition,
          ]) {
            expect(bounds.left).toBeGreaterThanOrEqual(layout.row.left)
            expect(bounds.right).toBeLessThanOrEqual(layout.row.right)
          }
          expect(layout.art.width).toBe(id === "fitness" ? 173 : 80)
          if (scale === 1)
            expect(layout.art.right).toBeLessThanOrEqual(layout.progress.left)
          else
            expect(layout.progress.top).toBeGreaterThanOrEqual(
              layout.art.bottom,
            )
          if (ranked) {
            const rect = await standing.boundingBox()
            if (scale === 1) expect(rect!.y).toBeLessThan(layout.art.top)
            else {
              expect(rect!.x).toBeGreaterThanOrEqual(layout.art.right)
              expect(rect!.y).toBeLessThan(layout.art.bottom)
            }
          }
          await heading.scrollIntoViewIfNeeded()
          await expect(heading).toBeInViewport()
          const definition = row.locator("p")
          await definition.scrollIntoViewIfNeeded()
          await expect(definition).toBeInViewport()
          await page.setViewportSize({ width, height: 1600 })
          expect((await row.boundingBox())!.height).toBe(layout.row.height)
          await row.screenshot({
            path: testInfo.outputPath(
              `${locale}-${width}-${ranked ? "ranked" : "unranked"}-${id}.png`,
            ),
            animations: "disabled",
          })
          await page.setViewportSize({ width, height: 844 })
        }
      }
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "100%"
      })
      await button(copy.interfaceCopy.dressingRoom.back).click()
    }
  })

  test(`${locale} lets the roster scroll and lets search keep a matching value after its initial reveal`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(copy.metadata.webPath)
    const button = (name: string) =>
      page.getByRole("button", { name, exact: true })
    await button(copy.introduction.startAction).click()
    const roster = page.getByRole("region", {
      name: copy.hub.unrankedList,
      exact: true,
    })
    await roster.focus()
    await page.keyboard.press("ArrowDown")
    await expect
      .poll(() => roster.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0)
    await page.keyboard.press("Tab")
    await expect(button(copy.hub.add)).toBeFocused()
    await button(copy.hub.add).click()
    const valueName = locale === "en" ? "Fitness" : "Condición física"
    await page
      .getByRole("textbox", {
        name: copy.interfaceCopy.customValues.name,
        exact: true,
      })
      .fill(valueName)
    await button(copy.interfaceCopy.screen.openValue(valueName)).click()
    await page
      .getByRole("dialog")
      .getByRole("button", {
        name: copy.interfaceCopy.dressingRoom.discard,
        exact: true,
      })
      .click()
    const row = page.locator('[id="all-values-row-pvcs-2011:fitness"]')
    await expect(row).toBeFocused()
    const search = page.getByRole("searchbox")
    const query = locale === "en" ? "fitness" : "física"
    await search.click()
    await search.pressSequentially(query)
    await expect(search).toHaveValue(query)
    await expect(search).toBeFocused()
    await row.getByRole("heading", { name: valueName }).click()
    await expect(search).toBeFocused()
    await search.press("Backspace")
    await expect(search).toHaveValue(query.slice(0, -1))
    await search.fill("")
    await expect(page.locator("[data-value-row]")).toHaveCount(103)
    await expect(search).toBeFocused()
  })
}
