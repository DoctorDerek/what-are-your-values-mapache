"use client"

import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

export const playerDataRecoveryActionIds = Object.freeze({
  restoreLastKnownGoodSave:
    "player-data-recovery-restore-last-known-good-save-button",
  importBackup: "player-data-recovery-import-backup-button",
  deleteAllData: "player-data-recovery-delete-all-data-button",
} as const)

type SharedRecoveryActions = {
  readonly children?: ReactNode
  readonly isBusy: boolean
  readonly onTryAgain: () => void
}

type UnreadableDataRecoveryActions = SharedRecoveryActions & {
  readonly mode: "unreadable-data"
  readonly hasLastKnownGoodSave: boolean
  readonly onDeleteAllData: () => void
  readonly onExportUnreadableData: () => void
  readonly onImportBackup: () => void
  readonly onRestoreLastKnownGoodSave: () => void
}

type StorageUnavailableRecoveryActions = SharedRecoveryActions & {
  readonly mode: "storage-unavailable"
  readonly hasPendingSave?: boolean
  readonly canExportCurrentData: boolean
  readonly canReturnWithoutNewChanges: boolean
  readonly onExportCurrentData: () => void
  readonly onReturnWithoutNewChanges: () => void
}

type PlayerDataRecoveryActionsProps =
  UnreadableDataRecoveryActions | StorageUnavailableRecoveryActions

export default function PlayerDataRecoveryActions(
  props: PlayerDataRecoveryActionsProps,
) {
  const localizedCopy = useLocaleCatalog()
  const playerDataRecoveryCopy = localizedCopy.interfaceCopy.recovery

  const { actions } = playerDataRecoveryCopy

  if (props.mode === "unreadable-data") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-1 pr-3 pb-5"
          data-controller-scroll
          tabIndex={0}
        >
          {props.children}

          <Button
            id={playerDataRecoveryActionIds.importBackup}
            type="button"
            variant="secondary"
            size="default"
            disabled={props.isBusy}
            onClick={props.onImportBackup}
            wrap
            className="w-full"
          >
            {actions.importBackup}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={props.isBusy}
            onClick={props.onExportUnreadableData}
            wrap
            className="w-full"
          >
            {actions.exportUnreadableData}
          </Button>

          <Button
            id={playerDataRecoveryActionIds.deleteAllData}
            type="button"
            variant="destructive"
            size="default"
            disabled={props.isBusy}
            onClick={props.onDeleteAllData}
            wrap
            className="w-full xl:col-span-2"
          >
            {actions.deleteAllData}
          </Button>
        </div>
        <div className="grid shrink-0 grid-cols-1 gap-3 pt-3 pb-2 xl:grid-cols-2">
          {props.hasLastKnownGoodSave ? (
            <Button
              id={playerDataRecoveryActionIds.restoreLastKnownGoodSave}
              aria-label={actions.restoreLastKnownGoodSave}
              type="button"
              size="default"
              disabled={props.isBusy}
              onClick={props.onRestoreLastKnownGoodSave}
              wrap
              className="w-full"
            >
              {playerDataRecoveryCopy.unreadableData.restoreReviewAction}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={props.isBusy}
            onClick={props.onTryAgain}
            wrap
            className="w-full"
          >
            {actions.tryAgain}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-1 pr-3 pb-5"
        data-controller-scroll
        tabIndex={0}
      >
        {props.children}
        {props.canExportCurrentData && !props.hasPendingSave && (
          <Button
            type="button"
            variant="secondary"
            disabled={props.isBusy}
            onClick={props.onExportCurrentData}
            wrap
            className="w-full"
          >
            {actions.exportCurrentData}
          </Button>
        )}
      </div>
      <div className="grid shrink-0 grid-cols-1 gap-3 pt-3 pb-2 xl:grid-cols-2">
        {props.canExportCurrentData && props.hasPendingSave ? (
          <Button
            type="button"
            variant="secondary"
            size="default"
            disabled={props.isBusy}
            onClick={props.onExportCurrentData}
            wrap
            className="w-full"
          >
            {props.hasPendingSave
              ? playerDataRecoveryCopy.pendingSave.export
              : actions.exportCurrentData}
          </Button>
        ) : null}
        <Button
          type="button"
          size="default"
          disabled={props.isBusy}
          onClick={props.onTryAgain}
          wrap
          className="w-full"
        >
          {props.hasPendingSave
            ? playerDataRecoveryCopy.pendingSave.retry
            : actions.tryAgain}
        </Button>
        {props.canReturnWithoutNewChanges ? (
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={props.isBusy}
            onClick={props.onReturnWithoutNewChanges}
            wrap
            className="w-full xl:col-span-2"
          >
            {actions.returnWithoutNewChanges}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
