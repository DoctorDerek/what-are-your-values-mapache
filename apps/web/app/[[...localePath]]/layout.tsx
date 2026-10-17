import "@/app/globals.css"
import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import { SerwistProvider } from "@serwist/turbopack/react"
import type { Metadata, Viewport } from "next"
import WebsiteAnalytics from "@/components/WebsiteAnalytics"
import {
  getStaticLocaleRouteParams,
  getWebRouteLocale,
} from "@/lib/WebDistribution"
import { createWebMetadata } from "@/lib/WebMetadata"

export function generateStaticParams() {
  return getStaticLocaleRouteParams()
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ localePath?: string[] }>
}): Promise<Metadata> {
  return createWebMetadata(
    process.env.VERCEL_ENV,
    getWebRouteLocale((await params).localePath),
  )
}

export const viewport: Viewport = {
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  readonly params: Promise<{ localePath?: string[] }>
}) {
  const locale = getWebRouteLocale((await params).localePath)
  const serviceWorkerIsDisabled =
    process.env.NODE_ENV !== "production" ||
    process.env.VERCEL_ENV === "preview"

  return (
    <html lang={getLocaleCatalog(locale).metadata.languageTag}>
      <head>
        <link
          rel="preload"
          href="/fonts/Anton-Latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen antialiased">
        <SerwistProvider
          swUrl="/sw.js"
          disable={serviceWorkerIsDisabled}
          cacheOnNavigation={false}
          reloadOnOnline={false}
        >
          {children}
        </SerwistProvider>
        {process.env.VERCEL_ENV === "production" && <WebsiteAnalytics />}
      </body>
    </html>
  )
}
