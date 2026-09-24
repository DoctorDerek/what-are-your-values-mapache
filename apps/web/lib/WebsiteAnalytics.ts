import type { BeforeSendEvent } from "@vercel/analytics"
import {
  CANONICAL_WEB_ROOT_URL,
  SHIPPED_ENGLISH_WEB_PATH,
} from "@/lib/WebDistribution"

export function sanitizeWebsiteAnalyticsEvent(
  event: BeforeSendEvent,
): BeforeSendEvent | null {
  if (event.type !== "pageview") return null

  let pageUrl: URL
  try {
    pageUrl = new URL(event.url)
  } catch {
    return null
  }

  if (pageUrl.pathname !== SHIPPED_ENGLISH_WEB_PATH) return null

  return { type: "pageview", url: CANONICAL_WEB_ROOT_URL }
}
