"use client"

import {
  validateCustomValueBatch,
  type CustomValueDraft,
} from "@game/data/src/CustomValueDraft"
import { CUSTOM_VALUE_INVITATION_COPY as copy } from "@game/data/src/CustomValueInvitationCopy"
import { customValueValidationMessages } from "@game/data/src/CustomValueValidationMessages"
import type { CustomValueDefinition } from "@game/data/src/Value"
import { getErrorMessage } from "@game/utils/src/Errors"
import { useEffect, useState } from "react"
import CustomValueDraftEditor from "@/components/CustomValueDraftEditor"
import { Button } from "@/components/ui/button"

type DraftEntry = CustomValueDraft &
  Readonly<{ key: string }>
const EMPTY_DRAFT: CustomValueDraft = Object.freeze({
  name: "",
  definition: "",
})

export default function CustomValueInvitation({
  editorRequestId = 0,
  initialName = "",
  existingCustomValues,
  isSaving,
  saveIssue,
  onApply,
  onExport,
  onNavigationBlockedChange,
}: {
  editorRequestId?: number
  initialName?: string
  existingCustomValues: readonly CustomValueDefinition[]
  isSaving: boolean
  saveIssue: string | null
  onApply: (drafts: readonly CustomValueDraft[]) => void
  onExport: () => Promise<void>
  onNavigationBlockedChange: (blocked: boolean) => void
}) {
  const [drafts, setDrafts] = useState<readonly DraftEntry[]>([])
  const [editorDraft, setEditorDraft] = useState<CustomValueDraft>(EMPTY_DRAFT)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [writing, setWriting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportIssue, setExportIssue] = useState<string | null>(null)
  const [handledEditorRequestId, setHandledEditorRequestId] = useState(0)
  if (editorRequestId !== handledEditorRequestId) {
    setHandledEditorRequestId(editorRequestId)
    if (editorRequestId !== 0) {
      setWriting(true)
      if (!editorDraft.name && !editorDraft.definition) {
        setEditorDraft({ name: initialName, definition: "" })
      }
    }
  }
  useEffect(() => {
    if (editorRequestId === 0) return
    document.getElementById("hub-custom-value-name")?.focus()
  }, [editorRequestId])
  const isNavigationBlocked =
    isSaving ||
    isExporting ||
    writing ||
    drafts.length > 0 ||
    editorDraft.name.length > 0 ||
    editorDraft.definition.length > 0
  useEffect(() => {
    onNavigationBlockedChange(isNavigationBlocked)
  }, [isNavigationBlocked, onNavigationBlockedChange])
  useEffect(
    () => () => onNavigationBlockedChange(false),
    [onNavigationBlockedChange],
  )
  const validations = validateCustomValueBatch(drafts, existingCustomValues)
  const editorValidation = validateCustomValueBatch(
    [editorDraft, ...drafts.filter((draft) => draft.key !== editingKey)],
    existingCustomValues,
  )[0]
  if (!editorValidation)
    throw new Error("Expected validation for the current value draft")
  const hasUnfinishedDraft =
    editingKey !== null ||
    editorDraft.name.length > 0 ||
    editorDraft.definition.length > 0
  const additions = hasUnfinishedDraft
    ? editingKey
      ? drafts.map((draft) => (draft.key === editingKey ? editorDraft : draft))
      : [...drafts, editorDraft]
    : drafts
  const canApply =
    additions.length > 0 &&
    validateCustomValueBatch(additions, existingCustomValues).every(
      (validation) => validation.isValid,
    )
  function saveAdditions() {
    if (canApply)
      onApply(
        additions.map(({ name, definition }) => ({
          name: name.trim(),
          definition: definition.trim(),
        })),
      )
  }

  function closeEditor() {
    setWriting(false)
    document.getElementById("hub-add-custom-value-button")?.focus()
  }
  function queueDraft() {
    const nextDraft = {
      name: editorValidation.name.value,
      definition: editorValidation.definition.value,
    }
    setDrafts(
      editingKey
        ? drafts.map((draft) =>
            draft.key === editingKey ? { ...draft, ...nextDraft } : draft,
          )
        : [
            ...drafts,
            { ...nextDraft, key: crypto.randomUUID() },
          ],
    )
    setEditorDraft(EMPTY_DRAFT)
    setEditingKey(null)
    setWriting(true)
    document.getElementById("hub-custom-value-name")?.focus()
  }
  async function exportData() {
    setIsExporting(true)
    setExportIssue(null)
    try {
      await onExport()
    } catch (error) {
      setExportIssue(getErrorMessage(error))
    } finally {
      setIsExporting(false)
    }
  }

  if (!isNavigationBlocked) return null

  return (
    <aside
      aria-label="Add your own values"
      className="text-mapache-vivid-dark mb-4 w-full max-w-7xl min-w-0 border-2 border-black bg-white p-3 xl:p-4 [&_button]:max-w-full [&_button]:whitespace-normal"
    >
      <fieldset
        disabled={isSaving || isExporting}
        className="min-w-0 space-y-3"
      >
        {writing ? (
          <CustomValueDraftEditor
            draft={editorDraft}
            validation={editorValidation}
            onChange={setEditorDraft}
            onSubmit={saveAdditions}
            onBack={closeEditor}
          />
        ) : hasUnfinishedDraft && drafts.length === 0 ? (
          <Button variant="link" onClick={() => setWriting(true)}>
            {copy.continueDraft}
          </Button>
        ) : null}
        {drafts.length > 0 && (
          <section
            className="space-y-3 border-t-2 border-black pt-3"
            aria-labelledby="custom-drafts-heading"
          >
            <h2 id="custom-drafts-heading" tabIndex={-1} className="font-bold">
              {copy.drafts}
            </h2>
            <ul className="divide-y divide-black/20">
              {drafts.map((draft, index) => (
                <li key={draft.key} className="py-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="min-w-0 flex-1 font-bold">{draft.name}</h3>
                    <Button
                      variant="link"
                      disabled={hasUnfinishedDraft}
                      aria-label={`${copy.edit} ${draft.name}`}
                      onClick={() => {
                        setEditingKey(draft.key)
                        setEditorDraft({
                          name: draft.name,
                          definition: draft.definition,
                        })
                        setWriting(true)
                      }}
                    >
                      {copy.edit}
                    </Button>
                    <Button
                      variant="link"
                      disabled={editingKey === draft.key}
                      aria-label={`${copy.remove} ${draft.name}`}
                      onClick={() => {
                        setDrafts(
                          drafts.filter((item) => item.key !== draft.key),
                        )
                      }}
                    >
                      {copy.remove}
                    </Button>
                  </div>
                  <p className="wrap-anywhere">{draft.definition}</p>
                  {validations[index]?.name.validationCode && (
                    <p role="alert">
                      {
                        customValueValidationMessages.name[
                          validations[index].name.validationCode
                        ]
                      }
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        {(writing || hasUnfinishedDraft || drafts.length > 0) && (
          <section
            className="space-y-3 border-t-2 border-black pt-3"
            aria-label="Save Custom Values"
          >
            <p className="text-sm">{copy.consequences}</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled={!canApply} onClick={saveAdditions}>
                {copy.apply}
              </Button>
              <Button
                variant="outline"
                disabled={hasUnfinishedDraft && !editorValidation.isValid}
                onClick={() =>
                  hasUnfinishedDraft ? queueDraft() : setWriting(true)
                }
              >
                {copy.another}
              </Button>
              <Button variant="link" onClick={exportData}>
                {isExporting ? copy.exporting : copy.export}
              </Button>
            </div>
          </section>
        )}
        {hasUnfinishedDraft && (
          <Button
            variant="link"
            onClick={() => {
              setEditorDraft(EMPTY_DRAFT)
              setEditingKey(null)
              closeEditor()
            }}
          >
            {copy.discardUnfinished}
          </Button>
        )}
        {(hasUnfinishedDraft || drafts.length > 0) && (
          <>
            <p className="text-sm">{copy.unsaved}</p>
            {drafts.length > 0 && (
              <Button
                variant="link"
                onClick={() => {
                  setDrafts([])
                  setEditorDraft(EMPTY_DRAFT)
                  setEditingKey(null)
                  closeEditor()
                }}
              >
                {copy.discard}
              </Button>
            )}
          </>
        )}
      </fieldset>
      {isSaving && <p role="status">{copy.saving}</p>}
      {(saveIssue || exportIssue) && (
        <p role="alert" className="mt-3 font-bold">
          {saveIssue || exportIssue}
        </p>
      )}
    </aside>
  )
}
