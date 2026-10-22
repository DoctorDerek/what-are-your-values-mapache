import { expect } from "@playwright/test"
import sharp from "sharp"
import { test } from "./fixtures"

test.use({ serviceWorkers: "block" })

test("Spanish survives gameplay, reload, and language changes without translating private values", async ({
  page,
}) => {
  await page.goto("/que-valoras-en-la-vida")
  await expect(page.locator("html")).toHaveAttribute("lang", "es-MX")
  await expect(page.getByRole("combobox", { name: "Idioma" })).toHaveValue(
    "es-MX",
  )
  await page.getByRole("button", { name: "Empezar", exact: true }).click()
  await page.getByRole("button", { name: "Agregar valor", exact: true }).click()
  await page
    .getByLabel("Nombre del valor", { exact: true })
    .fill("Mi valor “私の価値”")
  await page
    .getByLabel("Definición", { exact: true })
    .fill("Mi definición privada, intacta.")
  await page.getByRole("button", { name: "Guardar", exact: true }).click()
  await expect(
    page.getByText(
      "Tus valores personalizados se guardaron y ya pueden participar en las batallas.",
    ),
  ).toBeVisible()
  await page.getByRole("button", { name: "Combatir", exact: true }).click()
  await page
    .getByRole("button", { name: "Omitir las animaciones de batalla" })
    .click()
  await page
    .getByRole("button", { name: /^Elegir .* Nivel .* Opción/ })
    .first()
    .click()
  await expect(
    page.getByRole("button", { name: "Deshacer", exact: true }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Detener", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Resultados", exact: true }),
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Ver mis valores", exact: true })
    .click()
  await page.reload()
  await expect(
    page.getByRole("heading", {
      name: "Mis cinco principales valores de vida",
      exact: true,
    }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Menú", exact: true }).click()
  await page.getByRole("button", { name: "Configuración", exact: true }).click()
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("en")
  await expect(page.getByRole("combobox", { name: "Language" })).toHaveValue(
    "en",
  )
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "My Top Five Life Values", exact: true }),
  ).toBeVisible()
  await expect(page.locator("[data-game-surface=active]")).toHaveAttribute(
    "lang",
    "en-US",
  )
  await page
    .getByRole("button", { name: "Browse All Values", exact: true })
    .click()
  await page
    .getByRole("searchbox", { name: "Search All Values" })
    .fill("Mi valor")
  await expect(page.getByRole("listitem")).toHaveCount(1)
  await expect(
    page.getByText("“Mi definición privada, intacta.”", { exact: true }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Back", exact: true }).click()
  await page.getByRole("button", { name: "Menu", exact: true }).click()
  await page.getByRole("button", { name: "Settings", exact: true }).click()
  await page.getByRole("combobox", { name: "Language" }).selectOption("es-MX")
  await expect(page.getByRole("combobox", { name: "Idioma" })).toHaveValue(
    "es-MX",
  )
  await page.getByRole("button", { name: "Volver", exact: true }).click()
  await expect(
    page.getByRole("button", {
      name: "Compartir mi tarjeta de valores",
      exact: true,
    }),
  ).toBeVisible()
})

test("Spanish exports genuine GIF and PNG cards", async ({
  page,
}, testInfo) => {
  await page.goto("/que-valoras-en-la-vida")
  await page.getByRole("button", { name: "Empezar", exact: true }).click()
  await page
    .getByRole("button", {
      name: "Compartir mi tarjeta de valores",
      exact: true,
    })
    .click()
  const preview = page.getByRole("dialog", {
    name: "Compartir mi tarjeta de valores",
  })
  await expect(
    preview.getByRole("button", { name: "Guardar GIF" }),
  ).toBeEnabled({ timeout: 30_000 })
  const animatedDownload = page.waitForEvent("download")
  await preview.getByRole("button", { name: "Guardar GIF" }).click()
  const animatedOutput = testInfo.outputPath("tarjeta-de-valores.gif")
  await (await animatedDownload).saveAs(animatedOutput)
  const animatedMetadata = await sharp(animatedOutput, {
    animated: true,
  }).metadata()
  expect(animatedMetadata).toMatchObject({
    format: "gif",
    width: 1600,
    pageHeight: 900,
  })
  expect(animatedMetadata.pages).toBeGreaterThan(1)
  await preview.getByRole("button", { name: "PNG · Estático" }).click()
  await expect(
    preview.getByRole("button", { name: "Guardar PNG" }),
  ).toBeEnabled()
  const downloaded = page.waitForEvent("download")
  await preview.getByRole("button", { name: "Guardar PNG" }).click()
  const output = testInfo.outputPath("tarjeta-de-valores.png")
  await (await downloaded).saveAs(output)
  expect(await sharp(output).metadata()).toMatchObject({
    format: "png",
    width: 1600,
    height: 900,
  })
  await preview.screenshot({ path: testInfo.outputPath("spanish-preview.png") })
})

for (const width of [320, 390, 768, 1280]) {
  test(`Spanish first arrival and Home remain usable at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: width >= 1280 ? 800 : 844 })
    await page.goto("/que-valoras-en-la-vida")
    await expect(
      page.getByRole("heading", {
        name: "¿Cuáles son tus valores, Mapache?",
        exact: true,
      }),
    ).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("spanish-arrival.png") })
    await page.getByRole("button", { name: "Empezar", exact: true }).click()
    await expect(
      page.getByRole("button", { name: "Combatir", exact: true }),
    ).toBeInViewport()
    await expect(
      page.getByRole("heading", { name: "Mis valores", exact: true }),
    ).toBeVisible()
    await page.screenshot({ path: testInfo.outputPath("spanish-home.png") })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)
  })
}

test.describe("Spanish static document", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 720 } })
  test("serves Spanish meanings, metadata, and language links before JavaScript", async ({
    page,
    request,
  }) => {
    await page.goto("/que-valoras-en-la-vida")
    await expect(page.locator("html")).toHaveAttribute("lang", "es-MX")
    await expect(page).toHaveTitle(/¿Cuáles son tus valores, Mapache\?/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://whatareyourvaluesmapache.com/que-valoras-en-la-vida",
    )
    await expect(page.locator('link[hreflang="es-MX"]')).toHaveAttribute(
      "href",
      "https://whatareyourvaluesmapache.com/que-valoras-en-la-vida",
    )
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      "es_MX",
    )
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifests/es-MX",
    )
    const manifest = await request.get("/manifests/es-MX")
    expect(manifest.ok()).toBe(true)
    expect(await manifest.json()).toMatchObject({
      id: "/",
      lang: "es-MX",
      name: "¿Cuáles son tus valores, Mapache?",
      start_url: "/que-valoras-en-la-vida",
    })
    const noScriptCopy = page
      .getByRole("main", { name: "Cargando tus valores…" })
      .locator("noscript p")
    await expect(noScriptCopy).toHaveText([
      "Un juego rápido de batallas automáticas que te ayuda a descubrir tus valores de vida.",
      "El juego interactivo requiere JavaScript.",
    ])
    for (const paragraph of await noScriptCopy.all())
      await expect(paragraph).toBeVisible()
    const article = page.getByRole("article")
    await expect(article.locator("dt")).toHaveCount(103)
    await expect(article.locator("dt").first()).toHaveText("Aceptación")
    await expect(article.locator("dd").first()).toHaveText(
      "que me acepten tal como soy",
    )
    await expect(article.locator("dt").last()).toHaveText("Mascotas")
    await expect(
      article.getByRole("link", { name: "English (US)" }),
    ).toHaveAttribute("href", "/")
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320)
  })
})
