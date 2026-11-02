import { getErrorMessage } from "@game/utils/src/Errors"

export const WEB_EXCLUSIVE_WRITER_LOCK_NAME =
  "what-are-your-values-mapache:player-data-writer" as const

const WRITER_HANDOFF_TIMEOUT_MS = 500

export type WebExclusiveWriterLockManager = {
  readonly request: (
    name: string,
    options: {
      readonly mode: "exclusive"
      readonly signal?: AbortSignal
      readonly ifAvailable?: true
    },
    callback: (lock: Lock | null) => Promise<void>,
  ) => Promise<void>
}

export type WebExclusiveWriterLeaseResult =
  | {
      readonly status: "writer"
      readonly release: () => void
    }
  | {
      readonly status: "read-only"
      readonly reason:
        "lock-api-unavailable" | "lock-unavailable" | "lock-request-failed"
      readonly issue?: string
    }

function getBrowserLockManager(): WebExclusiveWriterLockManager | null {
  if (typeof navigator === "undefined" || !navigator.locks) return null
  return navigator.locks
}

export async function acquireWebExclusiveWriterLease(
  lockManager: WebExclusiveWriterLockManager | null = getBrowserLockManager(),
): Promise<WebExclusiveWriterLeaseResult> {
  if (!lockManager)
    return Object.freeze({
      status: "read-only",
      reason: "lock-api-unavailable",
    })

  const acquisition = Promise.withResolvers<WebExclusiveWriterLeaseResult>()
  const released = Promise.withResolvers<void>()
  const lifetime = new AbortController()
  const queued = new AbortController()
  const deadline = setTimeout(() => queued.abort(), WRITER_HANDOFF_TIMEOUT_MS)
  const release = () => lifetime.abort()
  lifetime.signal.addEventListener(
    "abort",
    () => {
      clearTimeout(deadline)
      queued.abort()
      released.resolve()
    },
    { once: true },
  )
  globalThis.window?.addEventListener(
    "pagehide",
    (event) => {
      if (!event.persisted) release()
    },
    { signal: lifetime.signal },
  )

  const hold = (lock: Lock | null) => {
    clearTimeout(deadline)
    if (!lock || lifetime.signal.aborted) {
      acquisition.resolve(
        Object.freeze({ status: "read-only", reason: "lock-unavailable" }),
      )
      release()
      return Promise.resolve()
    }
    acquisition.resolve(Object.freeze({ status: "writer", release }))
    return released.promise
  }

  async function requestWriter(manager: WebExclusiveWriterLockManager) {
    try {
      await manager.request(
        WEB_EXCLUSIVE_WRITER_LOCK_NAME,
        { mode: "exclusive", signal: queued.signal },
        hold,
      )
    } catch (error: unknown) {
      if (!queued.signal.aborted) throw error
      if (lifetime.signal.aborted) {
        hold(null)
        return
      }
      // A delayed browser may exceed the queue deadline even when the lock is free.
      // Let its lock manager distinguish that case from a live competing writer.
      await manager.request(
        WEB_EXCLUSIVE_WRITER_LOCK_NAME,
        { mode: "exclusive", ifAvailable: true },
        hold,
      )
    }
  }

  void requestWriter(lockManager).catch((error: unknown) => {
    acquisition.resolve(
      Object.freeze({
        status: "read-only",
        reason: "lock-request-failed",
        issue: getErrorMessage(error),
      }),
    )
    release()
  })
  return acquisition.promise
}
