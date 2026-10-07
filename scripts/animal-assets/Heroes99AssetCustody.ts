import { resolve } from "node:path"
import type { GhostAssetArchiveContract } from "./GhostAssetArchiveContract"
import { extractGhostAssetArchive } from "./GhostAssetArchiveExtractor"
import {
  getSeethingSwarmAssetKey,
  type SeethingSwarmAssetEnvironment,
} from "./SeethingSwarmAssetCustody"

export const HEROES99_ARCHIVE_CONTRACT = Object.freeze({
  entryRoot: "heroes99",
  requiredEntryNames: [
    "heroes99/animated/skin/skin_c1.png",
    "heroes99/portrait/base/base_c1.png",
  ],
  limits: {
    maximumEntryCount: 2_048,
    maximumEntrySizeBytes: 16 * 1_024 * 1_024,
    maximumTotalSizeBytes: 64 * 1_024 * 1_024,
  },
}) satisfies GhostAssetArchiveContract

export function getHeroes99AssetCustodyPaths(repositoryRoot: string) {
  const vendorDirectory = resolve(repositoryRoot, "vendor")
  return {
    vendorDirectory,
    custodyDirectory: resolve(vendorDirectory, "heroes99"),
    archivePath: resolve(repositoryRoot, "ghost_assets/heroes99-assets.zip"),
  }
}

export async function decryptHeroes99Assets(
  repositoryRoot = process.cwd(),
  environment: SeethingSwarmAssetEnvironment = process.env,
) {
  const assetKey = getSeethingSwarmAssetKey(environment)
  if (!assetKey) return
  try {
    await extractGhostAssetArchive({
      ...getHeroes99AssetCustodyPaths(repositoryRoot),
      assetKey,
      contract: HEROES99_ARCHIVE_CONTRACT,
    })
  } catch {
    throw new Error(
      "Heroes99 asset extraction failed; verify the encrypted archive and its protected key.",
    )
  }
}
