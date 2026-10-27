import { SHIPPED_LOCALES } from "@game/data/src/LocaleRegistry"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import { createSerwistRoute } from "@serwist/turbopack"

const serviceWorkerFileName = "sw.js" as const
const generatedServiceWorkerRoute = createSerwistRoute({
  additionalPrecacheEntries: SHIPPED_LOCALES.map((locale) => ({
    url: getLocaleCatalog(locale).metadata.webPath,
    revision: process.env.VERCEL_GIT_COMMIT_SHA ?? "development",
  })),
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
  esbuildOptions: {
    sourcemap: false,
  },
})

export const dynamic = "force-static"
export const revalidate = false
export const GET = (request: Request) =>
  generatedServiceWorkerRoute.GET(request, {
    params: Promise.resolve({ path: serviceWorkerFileName }),
  })
