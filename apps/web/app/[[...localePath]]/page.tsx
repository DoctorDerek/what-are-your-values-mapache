import { getLocaleCatalog } from "@game/data/src/LocalizationCatalog"
import { notFound } from "next/navigation"
import WebPublicPage from "@/components/WebPublicPage"
import { getWebRouteLocale } from "@/lib/WebDistribution"
import { getWebEntryRedirect } from "@/lib/WebEntryRedirects"

export default async function Page({
  params,
}: {
  readonly params: Promise<{ localePath?: string[] }>
}) {
  const { localePath = [] } = await params
  const locale = getWebRouteLocale(localePath)
  if (!locale) notFound()
  const redirect = getWebEntryRedirect(`/${localePath.join("/")}`)
  if (redirect)
    return (
      <>
        <meta httpEquiv="refresh" content={`0;url=${redirect.to}`} />
        <a href={redirect.to}>{getLocaleCatalog(locale).introduction.title}</a>
      </>
    )
  return <WebPublicPage locale={locale} />
}
