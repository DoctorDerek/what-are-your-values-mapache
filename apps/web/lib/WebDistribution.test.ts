import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import { describe, expect, it } from "vitest"
import {
  CANONICAL_WEB_ORIGIN,
  CANONICAL_WEB_ROOT_URL,
  getStaticLocaleRouteParams,
  getWebRouteLocale,
  isCanonicalProductionDeployment,
  SHIPPED_ENGLISH_WEB_PATH,
} from "@/lib/WebDistribution"
import {
  getWebEntryRedirect,
  PERMANENT_WEB_REDIRECTS,
} from "@/lib/WebEntryRedirects"
import deployment from "@/vercel.json"

const NON_PRODUCTION_VERCEL_ENVIRONMENTS = Object.freeze([
  "preview",
  "development",
  undefined,
  "",
  "Production",
  "staging",
] as const)

describe("web distribution", () => {
  it("ships the printed Spanish entry as a permanent one-hop redirect and a static fallback", () => {
    const spanish = getLocaleCatalog("es-MX")
    expect(spanish.card.invitation).toContain("WhatAreYourValuesMapache.com/es")
    expect(getWebRouteLocale(["es"])).toBe("es-MX")
    expect(getStaticLocaleRouteParams()).toContainEqual({ localePath: ["es"] })
    expect(PERMANENT_WEB_REDIRECTS).toHaveLength(deployment.redirects.length)
    const sources = PERMANENT_WEB_REDIRECTS.map((redirect) => redirect.from)
    expect(new Set(sources).size).toBe(sources.length)
    for (const redirect of PERMANENT_WEB_REDIRECTS) {
      expect(deployment.redirects).toContainEqual({
        source: redirect.from,
        destination: redirect.to,
        permanent: true,
      })
      expect(redirect.addedInVersion).toBe("0.1.0")
      expect(redirect.to).toBe(spanish.metadata.webPath)
      expect(getWebEntryRedirect(redirect.to)).toBeUndefined()
      expect(new URL(redirect.to, CANONICAL_WEB_ORIGIN).origin).toBe(
        CANONICAL_WEB_ORIGIN,
      )
    }
  })
  it("owns one exact canonical English production URL", () => {
    expect(CANONICAL_WEB_ORIGIN).toBe("https://whatareyourvaluesmapache.com")
    expect(SHIPPED_ENGLISH_WEB_PATH).toBe("/")
    expect(CANONICAL_WEB_ROOT_URL).toBe("https://whatareyourvaluesmapache.com/")

    const canonicalUrl = new URL(CANONICAL_WEB_ROOT_URL)
    expect(canonicalUrl.protocol).toBe("https:")
    expect(canonicalUrl.hostname).toBe("whatareyourvaluesmapache.com")
    expect(canonicalUrl.pathname).toBe("/")
    expect(canonicalUrl.username).toBe("")
    expect(canonicalUrl.password).toBe("")
    expect(canonicalUrl.port).toBe("")
    expect(canonicalUrl.search).toBe("")
    expect(canonicalUrl.hash).toBe("")
  })

  it("permits indexing only on the canonical production environment", () => {
    expect(isCanonicalProductionDeployment("production")).toBe(true)

    for (const environment of NON_PRODUCTION_VERCEL_ENVIRONMENTS) {
      expect(isCanonicalProductionDeployment(environment)).toBe(false)
    }
  })
})
