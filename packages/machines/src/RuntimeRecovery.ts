import {
  assign,
  fromPromise,
  setup,
  type ActorRefFrom,
  type SnapshotFrom,
} from "xstate"
import { createBattleProfileRecoveryBundle } from "./BattleProfileRecoveryBundle"
import { createPlayerData } from "./PlayerData"
import {
  preparePendingPlayerDataDownload,
  type PreparedWayvmDownload,
} from "./PlayerDataPortabilityActors"
import type { rootMachine } from "./RootMachine"

export type RootActor = ActorRefFrom<typeof rootMachine>

export async function prepareRuntimePlayerBackup(
  snapshot: SnapshotFrom<typeof rootMachine>,
): Promise<PreparedWayvmDownload> {
  const { context, children } = snapshot
  if (!context.playerData)
    throw new Error("No player profile is available for export")
  const appearance = children.avatar?.getSnapshot().context.draft
  const pendingCommit = context.pendingBattleProfileCommit
  if (
    pendingCommit &&
    (!context.battleProfileStoreState ||
      !context.pendingBattleProfileCommittedAt)
  )
    throw new Error("The pending change cannot be exported safely")

  return preparePendingPlayerDataDownload({
    exportedAt: new Date().toISOString(),
    sourceAppVersion: context.appVersion,
    sourceBuild: context.sourceBuild,
    playerData: createPlayerData({
      ...context.playerData,
      appearance: appearance ?? context.playerData.appearance,
      settings: context.pendingPlayerSettings ?? context.playerData.settings,
    }),
    pendingCommit:
      pendingCommit &&
      context.battleProfileStoreState &&
      context.pendingBattleProfileCommittedAt
        ? {
            state: context.battleProfileStoreState,
            event: pendingCommit.event,
            committedAt: context.pendingBattleProfileCommittedAt,
          }
        : null,
  })
}

export async function prepareRuntimeStoredBackup(
  snapshot: SnapshotFrom<typeof rootMachine>,
): Promise<PreparedWayvmDownload> {
  const { context } = snapshot
  return createBattleProfileRecoveryBundle({
    entries: context.recoveryEntries ?? (await context.durableStore.readAll()),
    exportedAt: new Date().toISOString(),
    issue: "Unexpected application failure",
    sourceAppVersion: context.appVersion,
    sourceBuild: context.sourceBuild,
  })
}

type RuntimeRecoveryInput = {
  readonly gameActor: RootActor
  readonly deliverDownload: (
    download: PreparedWayvmDownload,
  ) => void | Promise<void>
}

export const runtimeRecoveryMachine = setup({
  types: {
    context: {} as RuntimeRecoveryInput & {
      readonly backupKind: "player" | "stored"
    },
    input: {} as RuntimeRecoveryInput,
    events: {} as {
      readonly type: "RECOVERY.EXPORT"
      readonly backupKind: "player" | "stored"
    },
  },
  actors: {
    exportBackup: fromPromise(
      async ({
        input,
      }: {
        input: RuntimeRecoveryInput & {
          readonly backupKind: "player" | "stored"
        }
      }) => {
        const snapshot = input.gameActor.getSnapshot()
        const download = await (input.backupKind === "player"
          ? prepareRuntimePlayerBackup(snapshot)
          : prepareRuntimeStoredBackup(snapshot))
        await input.deliverDownload(download)
      },
    ),
  },
}).createMachine({
  id: "runtimeRecovery",
  context: ({ input }) => ({ ...input, backupKind: "player" }),
  initial: "Ready",
  states: {
    Ready: {},
    Exported: {},
    Failed: {},
    Exporting: {
      on: { "RECOVERY.EXPORT": {} },
      invoke: {
        src: "exportBackup",
        input: ({ context }) => context,
        onDone: "Exported",
        onError: "Failed",
      },
    },
  },
  on: {
    "RECOVERY.EXPORT": {
      target: ".Exporting",
      actions: assign({ backupKind: ({ event }) => event.backupKind }),
    },
  },
})
