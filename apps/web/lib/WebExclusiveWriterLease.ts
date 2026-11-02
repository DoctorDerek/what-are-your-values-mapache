import { getErrorMessage } from "@game/utils/src/Errors"

export const WEB_EXCLUSIVE_WRITER_LOCK_NAME =
  "what-are-your-values-mapache:player-data-writer" as const

const WRITER_HANDOFF_TIMEOUT_MS = 500

export type WebExclusiveWriterLockManager = {
  readonly request: (
    name: string,
    options: {
      readonly mode: "exclusive"
      readonly signal: AbortSignal
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

  return new Promise((resolve) => {
    const controller = new AbortController()
    const deadline = setTimeout(
      () => controller.abort(),
      WRITER_HANDOFF_TIMEOUT_MS,
    )
    let acquisitionHasSettled = false
    const settleAcquisition = (result: WebExclusiveWriterLeaseResult) => {
      if (acquisitionHasSettled) return
      acquisitionHasSettled = true
      clearTimeout(deadline)
      resolve(Object.freeze(result))
    }

    try {
      const lockRequest = lockManager.request(
        WEB_EXCLUSIVE_WRITER_LOCK_NAME,
        { mode: "exclusive", signal: controller.signal },
        async (lock) => {
          if (!lock) {
            settleAcquisition({
              status: "read-only",
              reason: "lock-unavailable",
            })
            return
          }

          let releaseLock = () => undefined
          const releaseRequested = new Promise<void>((release) => {
            let hasReleased = false
            releaseLock = () => {
              if (hasReleased) return
              hasReleased = true
              release()
            }
          })

          settleAcquisition({ status: "writer", release: releaseLock })
          await releaseRequested
        },
      )

      void lockRequest.catch((error: unknown) => {
        if (controller.signal.aborted) {
          settleAcquisition({ status: "read-only", reason: "lock-unavailable" })
          return
        }
        settleAcquisition({
          status: "read-only",
          reason: "lock-request-failed",
          issue: getErrorMessage(error),
        })
      })
    } catch (error: unknown) {
      settleAcquisition({
        status: "read-only",
        reason: "lock-request-failed",
        issue: getErrorMessage(error),
      })
    }
  })
}
