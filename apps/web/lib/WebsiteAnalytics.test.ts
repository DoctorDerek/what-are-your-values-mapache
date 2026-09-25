import { describe, expect, it } from "vitest"
import { CANONICAL_WEB_ROOT_URL } from "@/lib/WebDistribution"
import { sanitizeWebsiteAnalyticsEvent } from "@/lib/WebsiteAnalytics"

describe("Website analytics payload boundary", () => {
  it("retains a public homepage page view", () => {
    expect(
      sanitizeWebsiteAnalyticsEvent({
        type: "pageview",
        url: CANONICAL_WEB_ROOT_URL,
      }),
    ).toEqual({ type: "pageview", url: CANONICAL_WEB_ROOT_URL })
  })

  it("removes queries, fragments, and unexpected payload fields", () => {
    const pageView = {
      type: "pageview" as const,
      url: `${CANONICAL_WEB_ROOT_URL}?value=Ingenuity&token=private#TopFive`,
      customValue: "Ingenuity",
    }

    expect(sanitizeWebsiteAnalyticsEvent(pageView)).toEqual({
      type: "pageview",
      url: CANONICAL_WEB_ROOT_URL,
    })
    expect(pageView.url).toContain("token=private")
  })

  it.each([
    "https://deployment.vercel.app/?ref=portfolio",
    "https://www.whatareyourvaluesmapache.com/?ref=portfolio#TopFive",
  ])("normalizes production aliases to the bare public URL: %s", (url) => {
    expect(sanitizeWebsiteAnalyticsEvent({ type: "pageview", url })).toEqual({
      type: "pageview",
      url: "https://whatareyourvaluesmapache.com/",
    })
  })

  it("rejects custom events", () => {
    expect(
      sanitizeWebsiteAnalyticsEvent({
        type: "event",
        url: CANONICAL_WEB_ROOT_URL,
      }),
    ).toBeNull()
  })

  it.each(["/values/Ingenuity", "/unknown", "/_not-found"])(
    "does not report non-public paths: %s",
    (path) => {
      expect(
        sanitizeWebsiteAnalyticsEvent({
          type: "pageview",
          url: new URL(path, CANONICAL_WEB_ROOT_URL).href,
        }),
      ).toBeNull()
    },
  )

  it("discards malformed URLs without throwing into the application", () => {
    expect(
      sanitizeWebsiteAnalyticsEvent({ type: "pageview", url: "not a URL" }),
    ).toBeNull()
  })
})
