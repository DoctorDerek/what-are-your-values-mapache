import { fromPromise } from "xstate"
import type { BattleProfileEvent } from "./BattleProfileEvent"
import { createBattleProfileJournalCommit } from "./BattleProfileJournal"
import type { BattleProfileStoreState } from "./BattleProfileStore"
import { replaceBattleProfileStorePlayerData } from "./BattleProfileStore"
import type { DurableStoreAdapter } from "./DurableStoreAdapter"
import type { PlayerData } from "./PlayerData"
import {
  createWayvmExport,
  createWayvmExportFilename,
  serializeWayvmExport,
} from "./WayvmExport"
import { prepareWayvmImport } from "./WayvmImportPreview"

export type PreparedWayvmDownload = {
  readonly filename: string
  readonly serialized: string
}

export type PrepareWayvmDownloadInput = {
  readonly exportedAt: string
  readonly sourceAppVersion: string
  readonly sourceBuild: string
  readonly playerData: PlayerData
}

type PrepareWayvmImportInput = {
  readonly serialized: string
}

type ReplacePlayerDataInput = {
  readonly store: DurableStoreAdapter
  readonly state: BattleProfileStoreState
  readonly playerData: PlayerData
  readonly preImportBackupBytes: string
  readonly replacedAt: string
}

export async function prepareWayvmDownload(input: PrepareWayvmDownloadInput) {
  const wayvmExport = await createWayvmExport(input)

  return Object.freeze({
    filename: createWayvmExportFilename(wayvmExport.exportedAt),
    serialized: serializeWayvmExport(wayvmExport),
  }) satisfies PreparedWayvmDownload
}

export const createWayvmExportActor = fromPromise(
  async ({ input }: { input: PrepareWayvmDownloadInput }) =>
    prepareWayvmDownload(input),
)

export const createPendingBattleProfileExportActor = fromPromise(
  async ({
    input,
  }: {
    input: PrepareWayvmDownloadInput & {
      readonly pendingCommit: {
        readonly state: BattleProfileStoreState
        readonly event: BattleProfileEvent
        readonly committedAt: string
      } | null
    }
  }) => {
    const playerData =
      input.pendingCommit === null
        ? input.playerData
        : (
            await createBattleProfileJournalCommit({
              head: input.pendingCommit.state.head,
              event: input.pendingCommit.event,
              committedAt: input.pendingCommit.committedAt,
            })
          ).head.playerData
    return prepareWayvmDownload({ ...input, playerData })
  },
)

export const prepareWayvmImportActor = fromPromise(
  async ({ input }: { input: PrepareWayvmImportInput }) =>
    prepareWayvmImport(input.serialized),
)

export const replacePlayerDataActor = fromPromise(
  async ({ input }: { input: ReplacePlayerDataInput }) =>
    replaceBattleProfileStorePlayerData(input),
)
