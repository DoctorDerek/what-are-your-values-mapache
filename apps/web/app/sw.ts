/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { CacheFirst, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const animalCacheName = "wayvm-animal-strips-v1"
const animalStripPath = /^\/_next\/static\/media\/[^/]+_strip\d+\.[^/]+\.png$/

function isAnimalStrip(url: URL) {
  return (
    url.origin === self.location.origin && animalStripPath.test(url.pathname)
  )
}

async function preserveCachedAnimalStrips() {
  const animalCache = await caches.open(animalCacheName)
  for (const cacheName of await caches.keys()) {
    if (!cacheName.startsWith("serwist-precache")) continue
    const precache = await caches.open(cacheName)
    for (const request of await precache.keys()) {
      const url = new URL(request.url)
      if (!isAnimalStrip(url)) continue
      url.searchParams.delete("__WB_REVISION__")
      if (await animalCache.match(url.href)) continue
      const response = await precache.match(request)
      if (response?.ok) await animalCache.put(url.href, response)
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(preserveCachedAnimalStrips())
})

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST?.filter(
    (entry) =>
      !isAnimalStrip(
        new URL(
          typeof entry === "string" ? entry : entry.url,
          self.location.href,
        ),
      ),
  ),
  runtimeCaching: [
    {
      matcher: ({ url }) => isAnimalStrip(url),
      handler: new CacheFirst({ cacheName: animalCacheName }),
    },
  ],
  precacheOptions: {
    cleanupOutdatedCaches: true,
    navigateFallback: "/",
  },
  skipWaiting: false,
  clientsClaim: false,
  navigationPreload: false,
  disableDevLogs: true,
})

serwist.addEventListeners()
