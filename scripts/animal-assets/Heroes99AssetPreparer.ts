import { createHash, randomUUID } from "node:crypto"
import {
  access,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises"
import { dirname, resolve } from "node:path"
import {
  DEFAULT_HEROES99_APPEARANCE,
  getHeroes99LayerPaths,
} from "#game/data/src/Heroes99Appearance"
import {
  applyHeroes99Choice,
  HEROES99_CHOICES,
} from "#game/data/src/Heroes99DressingRoom"
import {
  HEROES99_THUMBNAIL,
  unionHeroes99Bounds,
  type Heroes99Bounds,
} from "#game/data/src/Heroes99RuntimeAssets"
import {
  HEROES99_IDLE_FRAME_COUNT,
  HEROES99_REPRESENTATIVE_FRAME,
  HEROES99_SPATIAL_ARCHITECTURE,
} from "#game/data/src/Heroes99SpatialArchitecture"
import sharp from "sharp"
import { publishSeethingSwarmPreparedAssetTree } from "./SeethingSwarmAssetStager"

type PreparedLayer = {
  path: string
  bytes: Buffer
  bounds: Heroes99Bounds
  color: string
}
const {
  frame_width_px: frameWidth,
  frame_height_px: frameHeight,
  sheet_width_px: sheetWidth,
  sheet_height_px: sheetHeight,
} = HEROES99_SPATIAL_ARCHITECTURE.grid_metrics

async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function listPngPaths(root: string, prefix = ""): Promise<string[]> {
  const paths: string[] = []
  for (const entry of await readdir(resolve(root, prefix), {
    withFileTypes: true,
  })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isSymbolicLink())
      throw new Error("Heroes99 custody cannot contain symbolic links.")
    if (entry.isDirectory()) paths.push(...(await listPngPaths(root, path)))
    else if (entry.isFile() && entry.name.endsWith(".png")) paths.push(path)
  }
  return paths.sort()
}

async function inspectLayer(
  path: string,
  bytes: Buffer,
): Promise<PreparedLayer> {
  const metadata = await sharp(bytes).metadata()
  if (metadata.width !== sheetWidth || metadata.height !== sheetHeight)
    throw new Error(
      "Heroes99 animation geometry does not match the verified pack.",
    )
  const pixels = await sharp(bytes)
    .extract({
      left: 0,
      top: 0,
      width: frameWidth * HEROES99_IDLE_FRAME_COUNT,
      height: frameHeight,
    })
    .ensureAlpha()
    .raw()
    .toBuffer()
  let left = frameWidth,
    top = frameHeight,
    right = -1,
    bottom = -1
  const colors = new Map<string, number>()
  for (let pixel = 0; pixel < pixels.length / 4; pixel++) {
    const red = pixels[pixel * 4]!,
      green = pixels[pixel * 4 + 1]!,
      blue = pixels[pixel * 4 + 2]!,
      alpha = pixels[pixel * 4 + 3]!
    if (!alpha) continue
    const x = pixel % frameWidth,
      y = Math.floor(pixel / (frameWidth * HEROES99_IDLE_FRAME_COUNT))
    left = Math.min(left, x)
    right = Math.max(right, x)
    top = Math.min(top, y)
    bottom = Math.max(bottom, y)
    if (
      Math.max(red, green, blue) < 60 ||
      Math.max(red, green, blue) - Math.min(red, green, blue) < 15
    )
      continue
    const color = `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
    colors.set(color, (colors.get(color) ?? 0) + 1)
  }
  return {
    path,
    bytes,
    bounds:
      right < 0
        ? { left: 0, top: 0, width: 0, height: 0 }
        : { left, top, width: right - left + 1, height: bottom - top + 1 },
    color:
      [...colors.entries()].sort(
        (first, second) => second[1] - first[1],
      )[0]?.[0] ?? "#D9D9D9",
  }
}

async function createThumbnailAtlas(layers: readonly PreparedLayer[]) {
  const byPath = new Map(layers.map((layer) => [layer.path, layer]))
  const choices = Object.entries(HEROES99_CHOICES).flatMap(
    ([category, items]) => items.map((choice) => ({ category, choice })),
  )
  const indices: Record<string, number> = {}
  const tiles: sharp.OverlayOptions[] = []
  for (const [index, { category, choice }] of choices.entries()) {
    const appearance = applyHeroes99Choice(
      DEFAULT_HEROES99_APPEARANCE,
      choice.change,
    )
    const selected = getHeroes99LayerPaths(appearance).map((path) => {
      const layer = byPath.get(path)
      if (!layer)
        throw new Error("Heroes99 appearance references a missing layer.")
      return layer
    })
    const bounds = unionHeroes99Bounds(
      selected
        .filter((layer) => layer.bounds.width > 0)
        .map((layer) => layer.bounds),
    )
    const cropHeight =
      category === "Skin" || category === "Face" || category === "Hair"
        ? Math.min(17, bounds.height)
        : bounds.height
    const scale = Math.max(
      1,
      Math.floor(
        Math.min(
          (HEROES99_THUMBNAIL.width - 4) / bounds.width,
          (HEROES99_THUMBNAIL.height - 8) / cropHeight,
        ),
      ),
    )
    const composite = await sharp({
      create: {
        width: sheetWidth,
        height: sheetHeight,
        channels: 4,
        background: "transparent",
      },
    })
      .composite(selected.map(({ bytes }) => ({ input: bytes })))
      .png()
      .toBuffer()
    const thumbnail = await sharp(composite)
      .extract({
        left: frameWidth * HEROES99_REPRESENTATIVE_FRAME + bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: cropHeight,
      })
      .resize(bounds.width * scale, cropHeight * scale, { kernel: "nearest" })
      .png()
      .toBuffer()
    indices[choice.id] = index
    tiles.push({
      input: thumbnail,
      left:
        (index % HEROES99_THUMBNAIL.columns) * HEROES99_THUMBNAIL.width +
        Math.floor((HEROES99_THUMBNAIL.width - bounds.width * scale) / 2),
      top:
        Math.floor(index / HEROES99_THUMBNAIL.columns) *
          HEROES99_THUMBNAIL.height +
        Math.floor((HEROES99_THUMBNAIL.height - cropHeight * scale) / 2),
    })
  }
  return {
    indices,
    bytes: await sharp({
      create: {
        width: HEROES99_THUMBNAIL.width * HEROES99_THUMBNAIL.columns,
        height:
          Math.ceil(choices.length / HEROES99_THUMBNAIL.columns) *
          HEROES99_THUMBNAIL.height,
        channels: 4,
        background: "transparent",
      },
    })
      .composite(tiles)
      .png()
      .toBuffer(),
  }
}

function createPalettes(layers: readonly PreparedLayer[]) {
  const palettes: Record<string, string[]> = {}
  for (const { path, color } of layers) {
    const match = path.match(
      /(?:hair\/([^/]+)\/.*_c(\d+)_top|cloth\/(cloth\d+)\/.*_c(\d+)_bot|weapon\/weapon5\/.*_c(\d+)_bot)\.png$/u,
    )
    if (!match) continue
    const id = match[1]
      ? `Hair-${match[1]}`
      : match[3]
        ? `Clothing-${match[3].slice(5)}`
        : "Weapon-dagger"
    const palette = Number(match[2] ?? match[4] ?? match[5])
    ;(palettes[id] ??= [])[palette - 1] = color
  }
  return palettes
}

export async function prepareHeroes99Assets(repositoryRoot: string) {
  const sourceRoot = resolve(repositoryRoot, "vendor/heroes99/animated")
  const hasSource = await exists(sourceRoot)
  const paths = hasSource ? await listPngPaths(sourceRoot) : []
  if (hasSource && paths.length !== 761)
    throw new Error("Heroes99 animation inventory is incomplete.")
  const sources = await Promise.all(
    paths.map(async (path) => ({
      path,
      bytes: await readFile(resolve(sourceRoot, path)),
    })),
  )
  const fingerprint = createHash("sha256").update("heroes99-runtime-v1")
  for (const source of sources)
    fingerprint.update(source.path).update(source.bytes)
  for (const path of [
    "scripts/animal-assets/Heroes99AssetPreparer.ts",
    "packages/data/src/Heroes99Appearance.ts",
    "packages/data/src/Heroes99DressingRoom.ts",
    "packages/data/src/Heroes99RuntimeAssets.ts",
    "packages/data/src/Heroes99SpatialArchitecture.ts",
  ])
    fingerprint.update(await readFile(resolve(repositoryRoot, path)))
  const identity = fingerprint.digest("hex")
  const outputRoots = ["apps/web", "apps/mobile"].map((app) =>
    resolve(repositoryRoot, app, "generated/heroes99"),
  )
  const isCurrent = await Promise.all(
    outputRoots.map(
      async (root) =>
        (await exists(resolve(root, "identity.txt"))) &&
        (await readFile(resolve(root, "identity.txt"), "utf8")) === identity &&
        (await exists(resolve(root, "Heroes99Assets.ts"))),
    ),
  )
  if (isCurrent.every(Boolean)) return
  const layers: PreparedLayer[] = []
  for (const source of sources)
    layers.push(await inspectLayer(source.path, source.bytes))
  const atlas = hasSource ? await createThumbnailAtlas(layers) : null
  const palettes = createPalettes(layers)
  for (const [platform, outputRoot] of outputRoots.entries()) {
    const preparedRoot = `${outputRoot}.${randomUUID()}.temporary`
    await mkdir(preparedRoot, { recursive: true })
    try {
      const imports = [
        'import type { Heroes99RuntimeAssets } from "@game/data/src/Heroes99RuntimeAssets"',
      ]
      const entries: string[] = []
      if (platform === 0)
        imports.push('import type { StaticImageData } from "next/image"')
      for (const [index, layer] of layers.entries()) {
        const destination = resolve(preparedRoot, "layers", layer.path)
        await mkdir(dirname(destination), { recursive: true })
        await copyFile(resolve(sourceRoot, layer.path), destination)
        const relativePath = `./layers/${layer.path}`
        if (platform === 0)
          imports.push(
            `import layer${index} from ${JSON.stringify(relativePath)}`,
          )
        entries.push(
          `${JSON.stringify(layer.path)}: { source: ${platform === 0 ? `layer${index}` : `require(${JSON.stringify(relativePath)}) as number`}, bounds: ${JSON.stringify(layer.bounds)} }`,
        )
      }
      if (atlas) {
        await writeFile(resolve(preparedRoot, "choices.png"), atlas.bytes)
        if (platform === 0)
          imports.push('import thumbnailAtlas from "./choices.png"')
      }
      const thumbnail = atlas
        ? platform === 0
          ? "thumbnailAtlas"
          : 'require("./choices.png") as number'
        : "null"
      await writeFile(
        resolve(preparedRoot, "Heroes99Assets.ts"),
        `${imports.join("\n")}\nexport const HEROES99_ASSETS = { layers: {${entries.join(",\n")}}, thumbnailAtlas: ${thumbnail}, thumbnailIndexByChoiceId: ${JSON.stringify(atlas?.indices ?? {})}, palettes: ${JSON.stringify(palettes)} } satisfies Heroes99RuntimeAssets<${platform === 0 ? "StaticImageData" : "number"}>\n`,
      )
      await writeFile(resolve(preparedRoot, "identity.txt"), identity)
      await publishSeethingSwarmPreparedAssetTree(preparedRoot, outputRoot)
    } finally {
      await rm(preparedRoot, { recursive: true, force: true })
    }
  }
}
