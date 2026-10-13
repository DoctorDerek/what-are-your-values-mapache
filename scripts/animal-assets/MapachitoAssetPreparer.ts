import { copyFile, mkdir } from "node:fs/promises"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"

export async function prepareMapachitoAssets(repositoryRoot: string) {
  const outputRoot = resolve(
    repositoryRoot,
    "apps/web/public/generated/mapachito",
  )
  const webRequire = createRequire(
    resolve(repositoryRoot, "apps/web/package.json"),
  )
  const riveRequire = createRequire(
    webRequire.resolve("@rive-app/react-canvas-lite"),
  )
  const runtimeRoot = dirname(riveRequire.resolve("@rive-app/canvas-lite"))
  await mkdir(outputRoot, { recursive: true })
  for (const filename of ["ice-cream.riv", "ice-cream.png"]) {
    await copyFile(
      resolve(repositoryRoot, "packages/data/assets/mapachito", filename),
      resolve(outputRoot, filename),
    )
  }
  for (const filename of ["rive.wasm", "rive_fallback.wasm"]) {
    await copyFile(
      resolve(runtimeRoot, filename),
      resolve(outputRoot, filename),
    )
  }
}
