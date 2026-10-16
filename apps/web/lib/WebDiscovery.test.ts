import { describe, expect, it } from "vitest"
import { createRobotsMetadata, createSitemapMetadata } from "@/lib/WebDiscovery"
import { createWebManifest } from "@/lib/WebManifest"

const NON_PRODUCTION_VERCEL_ENVIRONMENTS = Object.freeze([
  "preview",
  "development",
  undefined,
  "",
  "staging",
] as const)

describe("web crawler discovery", () => {
  it("localizes installation copy and launch route while retaining one app identity", () => {
    const english = createWebManifest()
    const spanish = createWebManifest("es-MX")
    expect(english).toMatchObject({
      id: "/",
      lang: "en-US",
      name: "What Are Your Values, Mapache?",
      start_url: "/",
    })
    expect(spanish).toMatchObject({
      id: "/",
      lang: "es-MX",
      name: "¿Cuáles son tus valores, Mapache?",
      start_url: "/que-valoras-en-la-vida",
      scope: "/",
    })
    expect(spanish.icons).toEqual(english.icons)
  })

  it("publishes canonical crawler discovery only in production", () => {
    expect(createRobotsMetadata("production")).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: "https://whatareyourvaluesmapache.com/sitemap.xml",
      host: "https://whatareyourvaluesmapache.com",
    })
  })

  it("blocks every non-production deployment without advertising it", () => {
    for (const environment of NON_PRODUCTION_VERCEL_ENVIRONMENTS) {
      expect(createRobotsMetadata(environment)).toEqual({
        rules: {
          userAgent: "*",
          disallow: "/",
        },
      })
    }
  })

  it("publishes only the shipped canonical routes", () => {
    expect(createSitemapMetadata()).toEqual([
      {
        url: "https://whatareyourvaluesmapache.com/",
      },
      {
        url: "https://whatareyourvaluesmapache.com/que-valoras-en-la-vida",
      },
    ])
  })
})
