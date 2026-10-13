import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { prepareMapachitoAssets } from "./MapachitoAssetPreparer"

const temporaryRoots: string[] = []

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function createAssetWorkspace() {
  const root = await mkdtemp(join(tmpdir(), "wayvm-brand-assets-"))
  temporaryRoots.push(root)
  const files = [
    ["apps/web/package.json", '{"name":"test-web"}'],
    ["apps/web/node_modules/@rive-app/react-canvas-lite/package.json", '{"name":"@rive-app/react-canvas-lite","main":"index.js"}'],
    ["apps/web/node_modules/@rive-app/react-canvas-lite/index.js", ""],
    ["apps/web/node_modules/@rive-app/canvas-lite/package.json", '{"name":"@rive-app/canvas-lite","main":"rive.js"}'],
    ["apps/web/node_modules/@rive-app/canvas-lite/rive.js", ""],
    ["apps/web/node_modules/@rive-app/canvas-lite/rive.wasm", "primary runtime bytes"],
    ["apps/web/node_modules/@rive-app/canvas-lite/rive_fallback.wasm", "fallback runtime bytes"],
    ["packages/data/assets/mapachito/ice-cream.riv", "authored animation bytes"],
    ["packages/data/assets/mapachito/ice-cream.png", "authored poster bytes"],
  ]
  for (const [path, content] of files) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), content)
  }
  return root
}

describe("self-hosted first-arrival assets", () => {
  it("copies authored art and both installed runtimes, replacing outdated output on the next preparation", async () => {
    const root = await createAssetWorkspace()
    await prepareMapachitoAssets(root)
    const output = join(root, "apps/web/public/generated/mapachito")
    for (const [filename, expected] of [
      ["ice-cream.riv", "authored animation bytes"],
      ["ice-cream.png", "authored poster bytes"],
      ["rive.wasm", "primary runtime bytes"],
      ["rive_fallback.wasm", "fallback runtime bytes"],
    ]) {
      expect(await readFile(join(output, filename), "utf8")).toBe(expected)
    }
    await writeFile(join(root, "packages/data/assets/mapachito/ice-cream.png"), "revised poster bytes")
    await prepareMapachitoAssets(root)
    expect(await readFile(join(output, "ice-cream.png"), "utf8")).toBe("revised poster bytes")
  })

  it("reports missing source art instead of silently producing an incomplete deployment", async () => {
    const root = await createAssetWorkspace()
    await rm(join(root, "packages/data/assets/mapachito/ice-cream.riv"))
    await expect(prepareMapachitoAssets(root)).rejects.toMatchObject({ code: "ENOENT" })
  })
})
