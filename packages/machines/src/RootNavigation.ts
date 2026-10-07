import type { EventFromLogic, SnapshotFrom } from "xstate"
import type { rootMachine } from "./RootMachine"

export type RootBackDisposition =
  | Readonly<{ kind: "root" }>
  | Readonly<{ kind: "blocked" }>
  | Readonly<{ kind: "event"; event: EventFromLogic<typeof rootMachine> }>

export function projectRootBackDisposition(
  snapshot: SnapshotFrom<typeof rootMachine>,
): RootBackDisposition {
  if (snapshot.matches("Hub")) return { kind: "root" }
  const candidates = [
    { type: "AVATAR.BACK_REQUESTED" },
    { type: "RECOVERY.IMPORT_CANCEL_REQUESTED" },
    { type: "RECOVERY.DELETE_ALL_CANCEL_REQUESTED" },
    { type: "DATA_MANAGEMENT.IMPORT_CANCEL_REQUESTED" },
    { type: "DATA_MANAGEMENT.RESET_CANCEL_REQUESTED" },
    { type: "SETTINGS.CLOSE_REQUESTED" },
    { type: "ACHIEVEMENTS.CLOSE_REQUESTED" },
    { type: "ALL_VALUES.CLOSE_REQUESTED" },
    { type: "RESULTS.CLOSE_REQUESTED" },
    { type: "DATA_MANAGEMENT.CLOSE_REQUESTED" },
    { type: "BATTLE.EXIT_REQUESTED" },
  ] as const satisfies readonly EventFromLogic<typeof rootMachine>[]
  const event = candidates.find((candidate) => snapshot.can(candidate))
  return event ? { kind: "event", event } : { kind: "blocked" }
}
