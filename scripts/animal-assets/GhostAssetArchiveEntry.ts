import { relative, resolve, sep } from "node:path"
import type { GhostAssetArchiveContract } from "./GhostAssetArchiveContract"

const SAFE_ARCHIVE_ENTRY_NAME_PATTERN = /^[A-Za-z0-9._/-]+$/

export function validateGhostAssetArchiveEntryName(
  entryName: string,
  contract: GhostAssetArchiveContract,
) {
  const expectedPrefix = `${contract.entryRoot}/`
  const entryPathSegments = entryName.split("/")

  if (
    !entryName.startsWith(expectedPrefix) ||
    entryName.includes("\\") ||
    !SAFE_ARCHIVE_ENTRY_NAME_PATTERN.test(entryName) ||
    entryPathSegments.some(
      (entryPathSegment) =>
        entryPathSegment === "" ||
        entryPathSegment === "." ||
        entryPathSegment === "..",
    )
  )
    throw new Error("Archive contains an unsafe custody entry name.")

  return entryPathSegments
}

export function resolveGhostAssetArchiveOutputPath(
  extractionDirectory: string,
  entryName: string,
  contract: GhostAssetArchiveContract,
) {
  const entryPathSegments = validateGhostAssetArchiveEntryName(
    entryName,
    contract,
  )
  const resolvedExtractionDirectory = resolve(extractionDirectory)
  const outputPath = resolve(resolvedExtractionDirectory, ...entryPathSegments)
  const relativeOutputPath = relative(resolvedExtractionDirectory, outputPath)

  if (relativeOutputPath === ".." || relativeOutputPath.startsWith(`..${sep}`))
    throw new Error("Archive entry resolves outside its custody boundary.")

  return outputPath
}
