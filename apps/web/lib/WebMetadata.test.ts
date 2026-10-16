import { describe, expect, it } from "vitest"
import {
  createWebMetadata,
  WEB_METADATA_DESCRIPTION,
  WEB_METADATA_TITLE,
} from "@/lib/WebMetadata"

const NON_PRODUCTION_VERCEL_ENVIRONMENTS = Object.freeze([
  "preview",
  "development",
  undefined,
  "staging",
] as const)

describe("web metadata", () => {
  it("publishes the exact canonical English identity in production", () => {
    expect(createWebMetadata("production")).toEqual({
      metadataBase: new URL("https://whatareyourvaluesmapache.com/"),
      title:
        "What Are Your Values, Mapache? A Free Game To Find What You Value in Life",
      description:
        "What Are Your Values, Mapache? is a fast-paced, value-sorting autobattler to help you find out what you value in life.",
      manifest: "/manifest.webmanifest",
      alternates: {
        canonical: "https://whatareyourvaluesmapache.com/",
        languages: {
          en: "https://whatareyourvaluesmapache.com/",
          "es-MX":
            "https://whatareyourvaluesmapache.com/que-valoras-en-la-vida",
          "x-default": "https://whatareyourvaluesmapache.com/",
        },
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://whatareyourvaluesmapache.com/",
        siteName: "What Are Your Values, Mapache?",
        title: WEB_METADATA_TITLE,
        description: WEB_METADATA_DESCRIPTION,
      },
      twitter: {
        card: "summary",
        title: WEB_METADATA_TITLE,
        description: WEB_METADATA_DESCRIPTION,
      },
    })
  })

  it("publishes Spanish identity with a self-referencing canonical and shared language alternates", () => {
    const spanish = createWebMetadata("production", "es-MX")
    expect(spanish.title).toContain("¿Cuáles son tus valores, Mapache?")
    expect(spanish.manifest).toBe("/manifests/es-MX")
    expect(spanish.alternates?.canonical).toBe(
      "https://whatareyourvaluesmapache.com/que-valoras-en-la-vida",
    )
    expect(spanish.alternates?.languages).toEqual(
      createWebMetadata("production").alternates?.languages,
    )
    expect(spanish.openGraph).toMatchObject({
      locale: "es_MX",
      url: "https://whatareyourvaluesmapache.com/que-valoras-en-la-vida",
    })
    expect(createWebMetadata("preview", "es-MX").robots).toEqual({
      index: false,
      follow: false,
    })
  })

  it("preserves canonical identity while refusing non-production indexing", () => {
    const { robots: productionRobots, ...canonicalIdentity } =
      createWebMetadata("production")

    expect(productionRobots).toEqual({ index: true, follow: true })

    for (const environment of NON_PRODUCTION_VERCEL_ENVIRONMENTS) {
      const { robots, ...nonProductionIdentity } =
        createWebMetadata(environment)

      expect(robots).toEqual({ index: false, follow: false })
      expect(nonProductionIdentity).toEqual(canonicalIdentity)
    }
  })
})
