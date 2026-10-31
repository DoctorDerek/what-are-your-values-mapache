import deployment from "@/vercel.json"

type PermanentRedirect = Readonly<{
  from: string
  to: string
  addedInVersion: string
}>

export const PERMANENT_WEB_REDIRECTS = deployment.redirects.map(
  ({ source, destination }) => ({
    from: source,
    to: destination,
    addedInVersion: "0.1.0",
  }),
) satisfies readonly PermanentRedirect[]

export function getWebEntryRedirect(pathname: string) {
  return PERMANENT_WEB_REDIRECTS.find((redirect) => redirect.from === pathname)
}
