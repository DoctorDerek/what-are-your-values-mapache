import { randomUUID } from "node:crypto"
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import { dirname, resolve } from "node:path"
import {
  Uint8ArrayReader,
  Uint8ArrayWriter,
  ZipReader,
} from "@zip.js/zip.js/index-native.js"
import type { GhostAssetArchiveContract } from "./GhostAssetArchiveContract"
import { resolveGhostAssetArchiveOutputPath } from "./GhostAssetArchiveEntry"

type ExtractGhostAssetArchiveOptions = {
  contract: GhostAssetArchiveContract
  archivePath: string
  assetKey: string
  custodyDirectory: string
  vendorDirectory: string
}

async function pathExists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function replaceCustodyDirectory(
  stagedCustodyDirectory: string,
  custodyDirectory: string,
  vendorDirectory: string,
) {
  const backupDirectory = resolve(
    vendorDirectory,
    `.ghost-assets-backup-${randomUUID()}`,
  )
  const existingCustodyDirectory = await pathExists(custodyDirectory)

  if (existingCustodyDirectory) await rename(custodyDirectory, backupDirectory)

  try {
    await rename(stagedCustodyDirectory, custodyDirectory)
  } catch (error: unknown) {
    if (existingCustodyDirectory && !(await pathExists(custodyDirectory)))
      await rename(backupDirectory, custodyDirectory)
    throw error
  }

  if (existingCustodyDirectory)
    await rm(backupDirectory, { force: true, recursive: true })
}

export async function extractGhostAssetArchive({
  contract,
  archivePath,
  assetKey,
  custodyDirectory,
  vendorDirectory,
}: ExtractGhostAssetArchiveOptions) {
  const archiveData = await readFile(archivePath)
  await mkdir(vendorDirectory, { recursive: true })
  const extractionDirectory = await mkdtemp(
    resolve(vendorDirectory, ".ghost-assets-extract-"),
  )

  try {
    const zipReader = new ZipReader(new Uint8ArrayReader(archiveData), {
      filenameValidation: "strict",
      strictness: "strict",
      useWebWorkers: false,
    })

    try {
      const entries = await zipReader.getEntries({
        filenameValidation: "strict",
        strictness: "strict",
      })

      if (
        entries.length === 0 ||
        entries.length > contract.limits.maximumEntryCount
      )
        throw new Error("Archive contains an invalid custody entry count.")

      const normalizedEntryNames = new Set<string>()
      let totalUncompressedSize = 0

      for (const entry of entries) {
        if (
          entry.directory ||
          entry.symlink ||
          !entry.encrypted ||
          entry.zipCrypto
        )
          throw new Error("Archive contains an invalid custody entry type.")

        if (entry.uncompressedSize > contract.limits.maximumEntrySizeBytes)
          throw new Error("Archive custody entry exceeds its size limit.")

        totalUncompressedSize += entry.uncompressedSize
        if (totalUncompressedSize > contract.limits.maximumTotalSizeBytes)
          throw new Error("Archive custody payload exceeds its size limit.")

        const normalizedEntryName = entry.filename.toLowerCase()
        if (normalizedEntryNames.has(normalizedEntryName))
          throw new Error("Archive contains ambiguous custody entry names.")
        normalizedEntryNames.add(normalizedEntryName)

        const outputPath = resolveGhostAssetArchiveOutputPath(
          extractionDirectory,
          entry.filename,
          contract,
        )
        const entryData = await entry.getData(new Uint8ArrayWriter(), {
          checkAuthenticationCode: true,
          checkCrc32: true,
          password: assetKey,
          strictness: "strict",
          useWebWorkers: false,
        })

        await mkdir(dirname(outputPath), { recursive: true })
        await writeFile(outputPath, entryData, { flag: "wx" })
      }

      for (const requiredEntryName of contract.requiredEntryNames) {
        if (!normalizedEntryNames.has(requiredEntryName.toLowerCase()))
          throw new Error("Archive is missing required custody entries.")
      }

      await replaceCustodyDirectory(
        resolve(extractionDirectory, contract.entryRoot),
        custodyDirectory,
        vendorDirectory,
      )
    } finally {
      await zipReader.close()
    }
  } finally {
    await rm(extractionDirectory, { force: true, recursive: true })
  }
}
