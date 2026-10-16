import { notFound } from "next/navigation"
import WebPublicPage from "@/components/WebPublicPage"
import { getWebRouteLocale } from "@/lib/WebDistribution"

export default async function Page({
  params,
}: {
  readonly params: Promise<{ localePath?: string[] }>
}) {
  const locale = getWebRouteLocale((await params).localePath)
  if (!locale) notFound()
  return <WebPublicPage locale={locale} />
}
