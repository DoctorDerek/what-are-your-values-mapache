"use client"

import { Analytics } from "@vercel/analytics/next"
import { sanitizeWebsiteAnalyticsEvent } from "@/lib/WebsiteAnalytics"

export default function WebsiteAnalytics() {
  return <Analytics beforeSend={sanitizeWebsiteAnalyticsEvent} debug={false} />
}
