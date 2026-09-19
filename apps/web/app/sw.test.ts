import type { SerwistOptions } from "serwist"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { createSerwist, createCacheFirst, addEventListeners } = vi.hoisted(
  () => {
    const addEventListeners = vi.fn()
    return {
      addEventListeners,
      createSerwist: vi.fn(function (_options: SerwistOptions) {
        return { addEventListeners }
      }),
      createCacheFirst: vi.fn(function (_options: { cacheName: string }) {}),
    }
  },
)

vi.mock("serwist", () => ({
  Serwist: createSerwist,
  CacheFirst: createCacheFirst,
}))

const origin = "https://whatareyourvaluesmapache.com"
const animalPath = "/_next/static/media/bat_attack_strip7.contenthash.png"
const existingPath = "/_next/static/media/bat_hurt_strip5.otherhash.png"
const missingPath = "/_next/static/media/bat_idle_strip4.missinghash.png"
const legacyRequest = new Request(`${origin}${animalPath}?__WB_REVISION__=old`)
const artwork = new Response("previously downloaded artwork", { status: 200 })
const runtimeMatch = vi.fn(
  async (_url: string): Promise<Response | undefined> => undefined,
)
const runtimePut = vi.fn(async (_url: string, _response: Response) => {})
const legacyMatch = vi.fn(
  async (request: Request): Promise<Response | undefined> =>
    request.url === legacyRequest.url ? artwork : undefined,
)
const installListeners: ((event: {
  waitUntil: (promise: Promise<unknown>) => void
}) => void)[] = []

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  installListeners.length = 0
  runtimeMatch.mockImplementation(async (url) =>
    url.endsWith(existingPath) ? artwork : undefined,
  )
  runtimePut.mockResolvedValue(undefined)
  vi.stubGlobal("self", {
    location: new URL(`${origin}/sw.js`),
    __SW_MANIFEST: [
      "/",
      { url: animalPath, revision: null },
      `${origin}${existingPath}`,
      "/icons/icon-192.png",
      `https://other.example${animalPath}`,
    ],
    addEventListener: (
      type: string,
      listener: (typeof installListeners)[number],
    ) => {
      if (type === "install") installListeners.push(listener)
    },
  })
  vi.stubGlobal("caches", {
    keys: async () => [
      "serwist-precache-v2",
      "wayvm-animal-strips-v1",
      "unrelated-cache",
    ],
    open: async (name: string) =>
      name === "wayvm-animal-strips-v1"
        ? {
            match: runtimeMatch,
            put: runtimePut,
          }
        : {
            keys: async () => [
              legacyRequest,
              new Request(`${origin}${existingPath}`),
              new Request(`${origin}${missingPath}`),
              new Request(`${origin}/icons/icon-192.png`),
            ],
            match: legacyMatch,
          },
  })
})

afterEach(() => vi.unstubAllGlobals())

async function installWorker() {
  await import("@/app/sw")
  const pending: Promise<unknown>[] = []
  for (const listener of installListeners)
    listener({ waitUntil: (promise) => pending.push(promise) })
  return Promise.all(pending)
}

describe("animal offline cache lifecycle", () => {
  it("excludes only same-origin animal strips from eager shell installation", async () => {
    await installWorker()
    expect(createSerwist.mock.calls[0]?.[0].precacheEntries).toEqual([
      "/",
      "/icons/icon-192.png",
      `https://other.example${animalPath}`,
    ])
    expect(createCacheFirst).toHaveBeenCalledWith({
      cacheName: "wayvm-animal-strips-v1",
    })
    expect(addEventListeners).toHaveBeenCalledOnce()
  })

  it("preserves revisioned artwork without overwriting already cached strips", async () => {
    await installWorker()
    expect(runtimePut).toHaveBeenCalledExactlyOnceWith(
      `${origin}${animalPath}`,
      artwork,
    )
    expect(await runtimePut.mock.calls[0]?.[1].text()).toBe(
      "previously downloaded artwork",
    )
  })

  it("rejects installation when preserving existing artwork fails", async () => {
    runtimePut.mockRejectedValue(
      new DOMException("Storage full", "QuotaExceededError"),
    )
    await expect(installWorker()).rejects.toThrow("Storage full")
  })
})
