import { render } from "@testing-library/react"
import type { AnalyticsProps } from "@vercel/analytics/next"
import { describe, expect, it, vi } from "vitest"
import WebsiteAnalytics from "@/components/WebsiteAnalytics"
import { CANONICAL_WEB_ROOT_URL } from "@/lib/WebDistribution"
import { sanitizeWebsiteAnalyticsEvent } from "@/lib/WebsiteAnalytics"

const { analyticsSpy } = vi.hoisted(() => ({
  analyticsSpy: vi.fn((_props: AnalyticsProps) => null),
}))

vi.mock("@vercel/analytics/next", () => ({ Analytics: analyticsSpy }))

describe("WebsiteAnalytics", () => {
  it("supplies the privacy filter without adding UI or game data", () => {
    const { container } = render(<WebsiteAnalytics />)

    expect(container).toBeEmptyDOMElement()
    const [analyticsProps] = analyticsSpy.mock.calls[0]!
    expect(analyticsProps).toEqual({
      beforeSend: sanitizeWebsiteAnalyticsEvent,
      debug: false,
    })
    expect(
      analyticsProps.beforeSend?.({
        type: "pageview",
        url: `${CANONICAL_WEB_ROOT_URL}?private=value`,
      }),
    ).toEqual({ type: "pageview", url: CANONICAL_WEB_ROOT_URL })
  })
})
