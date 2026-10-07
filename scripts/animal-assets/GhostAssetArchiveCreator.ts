import { randomUUID } from "node:crypto"
import {
  access,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, relative, resolve, sep } from "node:path"
import {
  Uint8ArrayReader,
  Uint8ArrayWriter,
  ZipWriter,
} from "@zip.js/zip.js/index-native.js"
import type { GhostAssetArchiveContract } from "./GhostAssetArchiveContract"
import { validateGhostAssetArchiveEntryName } from "./GhostAssetArchiveEntry"
import { extractGhostAssetArchive } from "./GhostAssetArchiveExtractor"

const STABLE_ARCHIVE_ENTRY_DATE = new Date("2026-01-01T00:00:00.000Z")

type CreateGhostAssetArchiveOptions = {
  contract: GhostAssetArchiveContract
  archivePath: string
  assetKey: string
  custodyDirectory: string
}

type CustodySourceFile = Readonly<{
  archiveEntryName: string
  absolutePath: string
  size: number
}>

async function pathExists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function collectCustodySourceFiles(
  custodyDirectory: string,
  contract: GhostAssetArchiveContract,
  currentDirectory = custodyDirectory,
): Promise<readonly CustodySourceFile[]> {
  const directoryEntries = await readdir(currentDirectory, {
    withFileTypes: true,
  })
  const sourceFiles: CustodySourceFile[] = []

  for (const directoryEntry of directoryEntries) {
    const absolutePath = resolve(currentDirectory, directoryEntry.name)
    if (directoryEntry.isSymbolicLink())
      throw new Error("Licensed custody cannot contain symbolic links.")

    if (directoryEntry.isDirectory()) {
      sourceFiles.push(
        ...(await collectCustodySourceFiles(
          custodyDirectory,
          contract,
          absolutePath,
        )),
      )
      continue
    }

    if (!directoryEntry.isFile())
      throw new Error("Licensed custody contains an unsupported entry type.")

    const relativePath = relative(custodyDirectory, absolutePath)
    if (
      relativePath === ".." ||
      relativePath.startsWith(`..${sep}`) ||
      resolve(custodyDirectory, relativePath) !== absolutePath
    )
      throw new Error("Licensed custody file resolves outside its boundary.")

    const archiveEntryName = `${contract.entryRoot}/${relativePath.replaceAll("\\", "/")}`
    validateGhostAssetArchiveEntryName(archiveEntryName, contract)
    sourceFiles.push(
      Object.freeze({
        absolutePath,
        archiveEntryName,
        size: (await readFile(absolutePath)).byteLength,
      }),
    )
  }

  return sourceFiles.sort((left, right) =>
    left.archiveEntryName < right.archiveEntryName
      ? -1
      : left.archiveEntryName > right.archiveEntryName
        ? 1
        : 0,
  )
}

function validateCustodySourceFiles(
  sourceFiles: readonly CustodySourceFile[],
  contract: GhostAssetArchiveContract,
) {
  if (
    sourceFiles.length === 0 ||
    sourceFiles.length > contract.limits.maximumEntryCount
  )
    throw new Error("Licensed custody contains an invalid file count.")

  const sourceEntryNames = new Set(
    sourceFiles.map((sourceFile) => sourceFile.archiveEntryName.toLowerCase()),
  )
  if (sourceEntryNames.size !== sourceFiles.length)
    throw new Error("Licensed custody contains ambiguous file names.")
  let totalSize = 0

  for (const sourceFile of sourceFiles) {
    if (sourceFile.size > contract.limits.maximumEntrySizeBytes)
      throw new Error("Licensed custody file exceeds its size limit.")

    totalSize += sourceFile.size
    if (totalSize > contract.limits.maximumTotalSizeBytes)
      throw new Error("Licensed custody payload exceeds its size limit.")
  }

  for (const requiredEntryName of contract.requiredEntryNames) {
    if (!sourceEntryNames.has(requiredEntryName.toLowerCase()))
      throw new Error("Licensed custody is missing required files.")
  }

  return totalSize
}

async function writeEncryptedArchive(
  archivePath: string,
  assetKey: string,
  sourceFiles: readonly CustodySourceFile[],
) {
  const zipWriter = new ZipWriter(new Uint8ArrayWriter(), {
    encryptionStrength: 3,
    extendedTimestamp: false,
    keepOrder: true,
    password: assetKey,
    useWebWorkers: false,
  })

  for (const sourceFile of sourceFiles) {
    await zipWriter.add(
      sourceFile.archiveEntryName,
      new Uint8ArrayReader(await readFile(sourceFile.absolutePath)),
      {
        encryptionStrength: 3,
        extendedTimestamp: false,
        lastModDate: STABLE_ARCHIVE_ENTRY_DATE,
        level: 9,
        password: assetKey,
        useWebWorkers: false,
      },
    )
  }

  await writeFile(archivePath, await zipWriter.close(), { flag: "wx" })
}

async function verifyArchiveRoundTrip(
  archivePath: string,
  assetKey: string,
  sourceFiles: readonly CustodySourceFile[],
  contract: GhostAssetArchiveContract,
) {
  const verificationRoot = await mkdtemp(
    resolve(tmpdir(), "wayvm-archive-verification-"),
  )
  const verificationVendorDirectory = resolve(verificationRoot, "vendor")
  const verificationCustodyDirectory = resolve(
    verificationVendorDirectory,
    contract.entryRoot,
  )

  try {
    await extractGhostAssetArchive({
      contract,
      archivePath,
      assetKey,
      custodyDirectory: verificationCustodyDirectory,
      vendorDirectory: verificationVendorDirectory,
    })
    const verifiedFiles = await collectCustodySourceFiles(
      verificationCustodyDirectory,
      contract,
    )

    if (verifiedFiles.length !== sourceFiles.length)
      throw new Error("Encrypted archive verification changed its file set.")

    for (let index = 0; index < sourceFiles.length; index += 1) {
      const sourceFile = sourceFiles[index]
      const verifiedFile = verifiedFiles[index]
      if (
        !sourceFile ||
        !verifiedFile ||
        sourceFile.archiveEntryName !== verifiedFile.archiveEntryName ||
        !(await readFile(sourceFile.absolutePath)).equals(
          await readFile(verifiedFile.absolutePath),
        )
      )
        throw new Error("Encrypted archive verification changed custody data.")
    }
  } finally {
    await rm(verificationRoot, { force: true, recursive: true })
  }
}

async function replaceArchiveFile(
  temporaryArchivePath: string,
  archivePath: string,
) {
  const backupArchivePath = `${archivePath}.${randomUUID()}.backup`
  const existingArchive = await pathExists(archivePath)

  if (existingArchive) await rename(archivePath, backupArchivePath)

  try {
    await rename(temporaryArchivePath, archivePath)
  } catch (error: unknown) {
    if (existingArchive && !(await pathExists(archivePath)))
      await rename(backupArchivePath, archivePath)
    throw error
  }

  if (existingArchive) await rm(backupArchivePath, { force: true })
}

export async function createGhostAssetArchive({
  contract,
  archivePath,
  assetKey,
  custodyDirectory,
}: CreateGhostAssetArchiveOptions) {
  if (assetKey.length === 0)
    throw new Error("The protected asset key must not be empty.")

  const relativeArchivePath = relative(custodyDirectory, archivePath)
  if (
    relativeArchivePath === "" ||
    (!relativeArchivePath.startsWith(`..${sep}`) &&
      relativeArchivePath !== "..")
  )
    throw new Error(
      "The encrypted archive must remain outside licensed custody.",
    )

  const sourceFiles = await collectCustodySourceFiles(
    custodyDirectory,
    contract,
  )
  const totalSize = validateCustodySourceFiles(sourceFiles, contract)
  await mkdir(dirname(archivePath), { recursive: true })
  const temporaryArchivePath = `${archivePath}.${randomUUID()}.temporary`

  try {
    await writeEncryptedArchive(temporaryArchivePath, assetKey, sourceFiles)
    await verifyArchiveRoundTrip(
      temporaryArchivePath,
      assetKey,
      sourceFiles,
      contract,
    )
    await replaceArchiveFile(temporaryArchivePath, archivePath)
  } finally {
    await rm(temporaryArchivePath, { force: true })
  }

  return Object.freeze({
    fileCount: sourceFiles.length,
    totalSize,
  })
}
