"use client"

import useCustomValueAuthoring, { type CustomValueAuthoringOptions } from "@game/data/src/useCustomValueAuthoring"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { findRankedValueNameMatches } from "@game/data/src/ValueSearch"
import { useEffect } from "react"
import CustomValueDraftEditor from "@/components/CustomValueDraftEditor"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useWebControllerActions } from "@/components/WebControlsProvider"

export default function CustomValueInvitation({
  saveIssue, rankedValues = [], ...options
}: CustomValueAuthoringOptions & {saveIssue: string | null; rankedValues?: readonly RankedValue[]}) {
  const localization = useLocaleCatalog()
  const copy = localization.interfaceCopy.customValues
  const leaveCopy = localization.interfaceCopy.dressingRoom
  const authoring = useCustomValueAuthoring(options)
  const matchingValues = findRankedValueNameMatches(rankedValues, authoring.editorDraft.name, localization.values)
  useEffect(() => {
    if (authoring.isOpen) document.getElementById("hub-custom-value-name")?.focus()
  }, [options.editorRequestId, authoring.isOpen])
  useWebControllerActions(1, command => {
    if (!authoring.isActive || (command !== "back" && command !== "cancel")) return false
    if (authoring.leaveTarget) authoring.keepEditing()
    else authoring.requestExit()
    return true
  })
  if (!authoring.isActive) return null
  return (
    <aside aria-label={localization.interfaceCopy.screen.addOwnValues}
      className="text-mapache-vivid-dark flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col border-4 border-black bg-white [&_button]:max-w-full">
      <fieldset disabled={authoring.isBusy} className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 xl:p-5" data-controller-scroll>
          <CustomValueDraftEditor draft={authoring.editorDraft} validation={authoring.editorValidation}
            onChange={authoring.setEditorDraft} onSubmit={authoring.saveAdditions} />
          {matchingValues.length > 0 && <section className="mt-3 space-y-2" aria-label={localization.interfaceCopy.screen.matchingValues}>
            {matchingValues.map(({definition}) => <Button key={definition.id} variant="link" wrap
              onClick={() => authoring.requestExit({valueId: definition.id})}>
              {localization.interfaceCopy.screen.openValue(getValueDisplayName(definition, localization.values))}
            </Button>)}
          </section>}
          {authoring.drafts.length > 0 && (
            <section className="mt-4 space-y-3 border-t-2 border-black pt-3" aria-labelledby="custom-drafts-heading">
              <h2 id="custom-drafts-heading" className="font-bold">{copy.drafts}</h2>
              <ul className="divide-y divide-black/20">
                {authoring.drafts.map(draft => (
                  <li key={draft.key} className="py-2">
                    <h3 className="font-bold wrap-anywhere">{draft.name}</h3>
                    <p className="wrap-anywhere">{draft.definition}</p>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="link" wrap disabled={authoring.hasUnfinishedDraft} aria-label={localization.interfaceCopy.screen.editValue(draft.name)} onClick={() => authoring.editDraft(draft)}>{copy.edit}</Button>
                      <Button variant="link" wrap disabled={authoring.editingKey === draft.key} aria-label={localization.interfaceCopy.screen.removeDraft(draft.name)} onClick={() => authoring.removeDraft(draft.key)}>{copy.remove}</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="mt-4 space-y-3 border-t-2 border-black pt-3" aria-label={localization.interfaceCopy.screen.saveCustomValues}>
            <p className="text-sm">{copy.consequences}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" variant="outline" wrap disabled={!authoring.editorValidation.isValid} onClick={() => {
                authoring.queueDraft()
                document.getElementById("hub-custom-value-name")?.focus()
              }}>{copy.another}</Button>
              <Button variant="link" wrap onClick={authoring.exportData}>{authoring.isExporting ? copy.exporting : copy.export}</Button>
              {authoring.hasUnfinishedDraft && authoring.drafts.length > 0 && <Button variant="link" wrap onClick={authoring.discardUnfinished}>{copy.discardUnfinished}</Button>}
              {authoring.hasChanges && <Button variant="link" wrap onClick={() => authoring.requestExit()}>{leaveCopy.discard}</Button>}
            </div>
            {authoring.hasChanges && <p className="text-sm">{copy.unsaved}</p>}
          </section>
        </div>
        <footer className="max-h-1/2 shrink-0 overflow-y-auto border-t-4 border-black p-[12px] pb-[20px] xl:px-5">
          {options.isSaving && <p role="status">{copy.saving}</p>}
          {(saveIssue || authoring.exportIssue) && <p role="alert" className="mb-3 font-bold">{saveIssue || authoring.exportIssue}</p>}
          <div className="flex flex-wrap gap-3">
            <Button size="sm" wrap variant="outline" className="min-w-0 flex-[1_1_7rem] wrap-anywhere" onClick={() => authoring.requestExit()}>{copy.back}</Button>
            <Button size="sm" wrap className="min-w-0 flex-[1_1_7rem] wrap-anywhere" disabled={!authoring.canApply} onClick={authoring.saveAdditions}>{copy.apply}</Button>
          </div>
        </footer>
      </fieldset>
      <Dialog open={authoring.leaveTarget !== null} onOpenChange={open => { if (!open) authoring.keepEditing() }}>
        <DialogContent aria-describedby={undefined} className="max-h-[90dvh] overflow-y-auto p-5"
          onCloseAutoFocus={event => {
            event.preventDefault()
            document.getElementById("hub-custom-value-name")?.focus()
          }}>
          <DialogTitle>{leaveCopy.keepTitle}</DialogTitle>
          <Button wrap disabled={!authoring.canApply || authoring.isBusy} onClick={authoring.saveAdditions}>{leaveCopy.saveReturn}</Button>
          <Button wrap variant="outline" disabled={authoring.isBusy} onClick={() => authoring.discardAndExit(authoring.leaveTarget ?? "home")}>{leaveCopy.discard}</Button>
          <Button wrap variant="secondary" onClick={authoring.keepEditing}>{leaveCopy.keepEditing}</Button>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
