/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { CacheFirst, NetworkFirst, Serwist } from "serwist"
import { getPrecachedDeploymentAsset } from "../lib/PrecachedDeploymentAsset"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const animalCacheName = "wayvm-animal-strips-v1"
const animalStripPath = /^\/_next\/static\/media\/[^/]+_strip\d+\.[^/]+\.png$/
const heroLayerPath =
  /^\/_next\/static\/media\/(?:skin_c\d+|face_c\d+|[mf]\d+_c\d+_(?:top|bot)|cloth\d+_c\d+_(?:top|bot)|weapon\d+(?:_c\d+)?_(?:top|bot))\.[^/]+\.png$/

function isArrivalAsset(url: URL) {
  return (
    url.origin === self.location.origin &&
    url.pathname.startsWith("/generated/mapachito/")
  )
}

function isOnDemandArtwork(url: URL) {
  return (
    url.origin === self.location.origin &&
    (animalStripPath.test(url.pathname) || heroLayerPath.test(url.pathname))
  )
}

async function preserveCachedAnimalStrips(source: "install" | "activate") {
  const animalCache = await caches.open(animalCacheName)
  const cacheNames =
    source === "activate"
      ? [animalCacheName]
      : (await caches.keys()).filter((name) =>
          name.startsWith("serwist-precache"),
        )
  for (const cacheName of cacheNames) {
    const precache =
      cacheName === animalCacheName ? animalCache : await caches.open(cacheName)
    for (const request of await precache.keys()) {
      const url = new URL(request.url)
      if (!isOnDemandArtwork(url)) continue
      url.searchParams.delete("__WB_REVISION__")
      url.searchParams.delete("dpl")
      if (
        (cacheName === animalCacheName && url.href === request.url) ||
        (await animalCache.match(url.href))
      )
        continue
      const response = await precache.match(request)
      if (response?.ok) await animalCache.put(url.href, response)
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(preserveCachedAnimalStrips("install"))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(preserveCachedAnimalStrips("activate"))
})

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST?.filter(
    (entry) =>
      !isArrivalAsset(
        new URL(
          typeof entry === "string" ? entry : entry.url,
          self.location.href,
        ),
      ) &&
      !isOnDemandArtwork(
        new URL(
          typeof entry === "string" ? entry : entry.url,
          self.location.href,
        ),
      ),
  ),
  runtimeCaching: [
    {
      matcher: ({ url }) => isArrivalAsset(url),
      handler: new NetworkFirst({ cacheName: "wayvm-arrival-v1" }),
    },
    {
      matcher: ({ url }) => isOnDemandArtwork(url),
      handler: new CacheFirst({
        cacheName: animalCacheName,
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) =>
              getPrecachedDeploymentAsset({ url: new URL(request.url) })[0]
                ?.href ?? request,
          },
        ],
      }),
    },
  ],
  precacheOptions: {
    cleanupOutdatedCaches: true,
    navigateFallback: "/",
    urlManipulation: getPrecachedDeploymentAsset,
  },
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: false,
  disableDevLogs: true,
})

serwist.addEventListeners()
