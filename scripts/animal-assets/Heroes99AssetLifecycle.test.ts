import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, resolve } from "node:path"
import { DEFAULT_HEROES99_APPEARANCE, getHeroes99LayerPaths } from "#game/data/src/Heroes99Appearance"
import { applyHeroes99Choice, getHeroes99PaletteChoices, HEROES99_CATEGORIES, HEROES99_CHOICES } from "#game/data/src/Heroes99DressingRoom"
import { Uint8ArrayReader, Uint8ArrayWriter, ZipWriter } from "@zip.js/zip.js/index-native.js"
import sharp from "sharp"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { decryptHeroes99Assets, getHeroes99AssetCustodyPaths, HEROES99_ARCHIVE_CONTRACT } from "./Heroes99AssetCustody"
import { prepareHeroes99Assets } from "./Heroes99AssetPreparer"
import { SEETHING_SWARM_ASSET_KEY_ENVIRONMENT_VARIABLE_NAME } from "./SeethingSwarmAssetCustody"

const sourceOwners = [
  "scripts/animal-assets/Heroes99AssetPreparer.ts",
  "packages/data/src/Heroes99Appearance.ts",
  "packages/data/src/Heroes99DressingRoom.ts",
  "packages/data/src/Heroes99RuntimeAssets.ts",
  "packages/data/src/Heroes99SpatialArchitecture.ts",
]

describe("Heroes99 asset custody and preparation", () => {
  let repositoryRoot: string
  beforeEach(async () => {
    repositoryRoot = await mkdtemp(resolve(tmpdir(), "wayvm-heroes99-test-"))
    for (const owner of sourceOwners) {
      const destination = resolve(repositoryRoot, owner)
      await mkdir(dirname(destination), { recursive: true })
      await copyFile(resolve(process.cwd(), owner), destination)
    }
  })
  afterEach(async () => { await rm(repositoryRoot, { recursive: true, force: true }) })

  it("uses the protected key to extract both collections and preserves custody after a rejected key", async () => {
    const paths = getHeroes99AssetCustodyPaths(repositoryRoot)
    await mkdir(dirname(paths.archivePath), { recursive: true })
    const writer = new ZipWriter(new Uint8ArrayWriter(), { useWebWorkers: false })
    for (const name of HEROES99_ARCHIVE_CONTRACT.requiredEntryNames) {
      await writer.add(name, new Uint8ArrayReader(new TextEncoder().encode(name)), { password: "synthetic-key", encryptionStrength: 3, useWebWorkers: false })
    }
    await writeFile(paths.archivePath, await writer.close())
    await decryptHeroes99Assets(repositoryRoot, {})
    await expect(stat(paths.custodyDirectory)).rejects.toMatchObject({ code: "ENOENT" })
    await decryptHeroes99Assets(repositoryRoot, { [SEETHING_SWARM_ASSET_KEY_ENVIRONMENT_VARIABLE_NAME]: "synthetic-key" })
    for (const name of HEROES99_ARCHIVE_CONTRACT.requiredEntryNames) expect(await readFile(resolve(paths.vendorDirectory, name), "utf8")).toBe(name)
    await expect(decryptHeroes99Assets(repositoryRoot, { [SEETHING_SWARM_ASSET_KEY_ENVIRONMENT_VARIABLE_NAME]: "incorrect-key" })).rejects.toThrow("Heroes99 asset extraction failed; verify the encrypted archive and its protected key.")
    for (const name of HEROES99_ARCHIVE_CONTRACT.requiredEntryNames) expect(await readFile(resolve(paths.vendorDirectory, name), "utf8")).toBe(name)
    expect(await readdir(paths.vendorDirectory)).toEqual(["heroes99"])
  })

  it("publishes typed empty assets for an unkeyed checkout without shipping artwork", async () => {
    await prepareHeroes99Assets(repositoryRoot)
    for (const platform of ["web", "mobile"]) {
      const root = resolve(repositoryRoot, `apps/${platform}/generated/heroes99`)
      const generatedModule = await readFile(resolve(root, "Heroes99Assets.ts"), "utf8")
      expect(generatedModule).toContain("layers: {}")
      expect(generatedModule).toContain("thumbnailAtlas: null")
      expect(await readdir(root)).toEqual(["Heroes99Assets.ts", "identity.txt"])
    }
  })

  it("builds both runtime trees from the complete recipe inventory, caches them, and rejects malformed replacements atomically", async () => {
    const layerPaths = new Set<string>()
    for (const category of HEROES99_CATEGORIES) {
      for (const choice of HEROES99_CHOICES[category]) {
        const appearance = applyHeroes99Choice(DEFAULT_HEROES99_APPEARANCE, choice.change)
        for (const variant of [appearance, ...getHeroes99PaletteChoices(category, appearance).map(palette => applyHeroes99Choice(appearance, palette.change))]) {
          for (const path of getHeroes99LayerPaths(variant)) layerPaths.add(path)
        }
      }
    }
    expect(layerPaths.size).toBe(761)
    const pixels = Buffer.alloc(800 * 680 * 4)
    for (let frame = 0; frame < 6; frame++) {
      for (let y = 8; y < 26; y++) {
        for (let x = 47; x < 53; x++) pixels.set([0, 157, 174, 255], (y * 800 + frame * 100 + x) * 4)
      }
    }
    pixels.set([255, 230, 82, 255], (100 * 800 + 799) * 4)
    const sheet = await sharp(pixels, { raw: { width: 800, height: 680, channels: 4 } }).png().toBuffer()
    const transparent = await sharp({ create: { width: 800, height: 680, channels: 4, background: "transparent" } }).png().toBuffer()
    const sourceRoot = resolve(repositoryRoot, "vendor/heroes99/animated")
    await Promise.all([...layerPaths].map(async path => {
      const destination = resolve(sourceRoot, path)
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, path === "face/face_c7.png" ? transparent : sheet)
    }))
    await prepareHeroes99Assets(repositoryRoot)
    const outputRoots = ["web", "mobile"].map(platform => resolve(repositoryRoot, `apps/${platform}/generated/heroes99`))
    const modules = await Promise.all(outputRoots.map(root => readFile(resolve(root, "Heroes99Assets.ts"), "utf8")))
    for (const [index, root] of outputRoots.entries()) {
      expect(modules[index]).toContain('bounds: {"left":47,"top":8,"width":6,"height":18}')
      expect(modules[index]).toContain('bounds: {"left":0,"top":0,"width":0,"height":0}')
      expect(modules[index]).toContain('"Hair-m4":["#009dae"')
      expect(modules[index]).toContain('"Clothing-14":["#009dae"')
      expect(modules[index]).toContain('"Weapon-dagger":["#009dae"')
      expect(modules[index]).toContain(index === 0 ? "satisfies Heroes99RuntimeAssets<StaticImageData>" : "satisfies Heroes99RuntimeAssets<number>")
      expect(await readFile(resolve(root, "layers/skin/skin_c1.png"))).toEqual(sheet)
      const atlas = await sharp(resolve(root, "choices.png")).metadata()
      const choices = HEROES99_CATEGORIES.flatMap(category => HEROES99_CHOICES[category])
      expect([atlas.width, atlas.height]).toEqual([512, Math.ceil(choices.length / 8) * 80])
      const thumbnail = await sharp(resolve(root, "choices.png")).extract({ left: 32, top: 40, width: 1, height: 1 }).raw().toBuffer()
      expect([...thumbnail]).toEqual([0, 157, 174, 255])
      for (const [choiceIndex, choice] of choices.entries()) expect(modules[index]).toContain(`${JSON.stringify(choice.id)}:${choiceIndex}`)
    }
    const beforeCache = await Promise.all(outputRoots.map(root => stat(resolve(root, "Heroes99Assets.ts"), { bigint: true })))
    await prepareHeroes99Assets(repositoryRoot)
    const afterCache = await Promise.all(outputRoots.map(root => stat(resolve(root, "Heroes99Assets.ts"), { bigint: true })))
    expect(afterCache.map(file => file.mtimeNs)).toEqual(beforeCache.map(file => file.mtimeNs))
    const invalidSheet = await sharp({ create: { width: 1, height: 1, channels: 4, background: "white" } }).png().toBuffer()
    await writeFile(resolve(sourceRoot, "skin/skin_c1.png"), invalidSheet)
    await expect(prepareHeroes99Assets(repositoryRoot)).rejects.toThrow("Heroes99 animation geometry does not match the verified pack.")
    await rm(resolve(sourceRoot, "skin/skin_c1.png"))
    await expect(prepareHeroes99Assets(repositoryRoot)).rejects.toThrow("Heroes99 animation inventory is incomplete.")
    for (const [index, root] of outputRoots.entries()) {
      expect(await readFile(resolve(root, "Heroes99Assets.ts"), "utf8")).toBe(modules[index])
      expect(await readFile(resolve(root, "layers/skin/skin_c1.png"))).toEqual(sheet)
      expect(await readdir(dirname(root))).toEqual(["heroes99"])
    }
  }, 30_000)
})
