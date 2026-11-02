export function getPrecachedDeploymentAsset({ url }: { url: URL }): URL[] {
  if (
    url.origin !== self.location.origin ||
    !url.pathname.startsWith("/_next/static/") ||
    !url.searchParams.has("dpl")
  )
    return []
  const asset = new URL(url)
  asset.searchParams.delete("dpl")
  return [asset]
}
