import { useCallback, useSyncExternalStore } from "react"

type RecoverableActor<Snapshot> = {
  readonly getSnapshot: () => Snapshot
  readonly subscribe: (observer: {
    readonly next: () => void
    readonly error: () => void
  }) => { readonly unsubscribe: () => void }
}

export default function useRecoverableActorSnapshot<
  Snapshot extends { readonly status: string; readonly error?: unknown },
>(actor: RecoverableActor<Snapshot>): Snapshot {
  const subscribe = useCallback(
    (notify: () => void) => {
      const subscription = actor.subscribe({ next: notify, error: notify })
      return () => subscription.unsubscribe()
    },
    [actor],
  )
  const getSnapshot = useCallback(() => actor.getSnapshot(), [actor])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  if (snapshot.status === "error") throw snapshot.error
  return snapshot
}
