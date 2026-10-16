import { SHIPPED_LOCALES } from "@game/data/src/LocaleRegistry"
import { createWebManifest } from "@/lib/WebManifest"

export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return SHIPPED_LOCALES.map((locale) => ({ locale }))
}

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ locale: string }> },
) {
  const requestedLocale = (await params).locale
  const locale = SHIPPED_LOCALES.find(
    (candidate) => candidate === requestedLocale,
  )
  if (!locale) return new Response(null, { status: 404 })
  return Response.json(createWebManifest(locale), {
    headers: { "Content-Type": "application/manifest+json" },
  })
}
