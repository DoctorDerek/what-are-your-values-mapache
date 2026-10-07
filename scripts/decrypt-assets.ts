import { decryptHeroes99Assets } from "./animal-assets/Heroes99AssetCustody"
import { runSeethingSwarmAssetDecryption } from "./animal-assets/SeethingSwarmAssetDecryption"

try {
  await runSeethingSwarmAssetDecryption()
  await decryptHeroes99Assets()
} catch (error: unknown) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Protected asset extraction failed."}\n`,
  )
  process.exitCode = 1
}
