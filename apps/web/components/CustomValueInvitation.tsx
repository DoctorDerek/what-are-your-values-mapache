"use client"

import {
  validateCustomValueBatch,
  type CustomValueDraft,
} from "@game/data/src/CustomValueDraft"
import { CUSTOM_VALUE_INVITATION_COPY as copy } from "@game/data/src/CustomValueInvitationCopy"
import { CUSTOM_VALUE_STARTER_EXAMPLES } from "@game/data/src/CustomValueStarterExamples"
import { validateCustomValueDraft } from "@game/data/src/CustomValueValidation"
import { customValueValidationMessages } from "@game/data/src/CustomValueValidationMessages"
import {
  normalizeValueNameForComparison,
  type CustomValueDefinition,
} from "@game/data/src/Value"
import { getErrorMessage } from "@game/utils/src/Errors"
import { useEffect, useRef, useState } from "react"
import CustomValueDraftEditor from "@/components/CustomValueDraftEditor"
import { Button } from "@/components/ui/button"

type DraftEntry = CustomValueDraft &
  Readonly<{ key: string; exampleName: string | null }>
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
  const [reviewing, setReviewing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportIssue, setExportIssue] = useState<string | null>(null)
  const [handledEditorRequestId, setHandledEditorRequestId] = useState(0)
  if (editorRequestId !== handledEditorRequestId) {
    setHandledEditorRequestId(editorRequestId)
    if (editorRequestId !== 0) {
      setWriting(true)
      setReviewing(false)
      if (!editorDraft.name && !editorDraft.definition) {
        setEditorDraft({ name: initialName, definition: "" })
      }
    }
  }
  useEffect(() => {
    if (editorRequestId === 0) return
    document.getElementById("hub-custom-value-name")?.focus()
  }, [editorRequestId])
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null)
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
  useEffect(() => {
    if (reviewing) reviewHeadingRef.current?.focus()
  }, [reviewing])
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
  const examplesAlreadyDrafted = CUSTOM_VALUE_STARTER_EXAMPLES.filter(
    (example) =>
      drafts.some(
        (draft) =>
          draft.exampleName !== example.name &&
          normalizeValueNameForComparison(draft.name) ===
            normalizeValueNameForComparison(example.name),
      ),
  )
  const availableExamples = CUSTOM_VALUE_STARTER_EXAMPLES.filter(
    (example) =>
      validateCustomValueDraft({ ...example, existingCustomValues }).isValid &&
      !examplesAlreadyDrafted.includes(example),
  )
  const canApply =
    drafts.length > 0 && validations.every((validation) => validation.isValid)

  function backToSelection() {
    setWriting(false)
    setReviewing(false)
    document.getElementById("hub-add-custom-value-button")?.focus()
  }
  function queueDraft(review = true) {
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
            { ...nextDraft, key: crypto.randomUUID(), exampleName: null },
          ],
    )
    setEditorDraft(EMPTY_DRAFT)
    setEditingKey(null)
    setWriting(!review)
    setReviewing(review)
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

  return (
    <aside
      aria-label="Add your own values"
      className="text-mapache-vivid-dark mb-4 w-full max-w-7xl min-w-0 border-2 border-black bg-white p-3 xl:p-4 [&_button]:max-w-full [&_button]:whitespace-normal"
    >
      <fieldset
        disabled={isSaving || isExporting}
        className="min-w-0 space-y-3"
      >
        {writing && !reviewing ? (
          <CustomValueDraftEditor
            draft={editorDraft}
            validation={editorValidation}
            editing={editingKey !== null}
            onChange={setEditorDraft}
            onSubmit={() => queueDraft()}
            onAnother={() => queueDraft(false)}
            onBack={backToSelection}
          />
        ) : hasUnfinishedDraft && drafts.length === 0 ? (
          <Button
            variant="link"
            className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
            onClick={() => setWriting(true)}
          >
            {copy.continueDraft}
          </Button>
        ) : null}
        <details hidden={reviewing}>
          <summary className="min-h-11 cursor-pointer py-2 font-bold focus-visible:outline-4 focus-visible:outline-offset-4">
            {copy.invitation}
          </summary>
          <p className="py-2 text-sm">{copy.guidance}</p>
          <div className="flex flex-wrap gap-3">
            {CUSTOM_VALUE_STARTER_EXAMPLES.map((example) => (
              <Button
                key={example.name}
                variant="outline"
                size="sm"
                disabled={
                  hasUnfinishedDraft ||
                  !availableExamples.includes(example) ||
                  drafts.some((draft) => draft.exampleName === example.name)
                }
                aria-label={
                  example.label
                    ? `${example.name} — ${example.label}`
                    : example.name
                }
                onClick={() => {
                  setEditorDraft({
                    name: example.name,
                    definition: example.definition,
                  })
                  setEditingKey(null)
                  setWriting(true)
                }}
              >
                {example.name}
              </Button>
            ))}
            <Button
              variant="link"
              className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
              disabled={availableExamples.every((example) =>
                drafts.some((draft) => draft.exampleName === example.name),
              )}
              onClick={() =>
                setDrafts([
                  ...drafts,
                  ...availableExamples
                    .filter(
                      (example) =>
                        !drafts.some(
                          (draft) => draft.exampleName === example.name,
                        ),
                    )
                    .map((example) => ({
                      name: example.name,
                      definition: example.definition,
                      key: `example:${example.name}`,
                      exampleName: example.name,
                    })),
                ])
              }
            >
              {copy.selectAll}
            </Button>
          </div>
        </details>
        {drafts.length > 0 && (
          <section
            className="space-y-3 border-t-2 border-black pt-3"
            aria-labelledby="custom-drafts-heading"
          >
            <h2
              id="custom-drafts-heading"
              ref={reviewHeadingRef}
              tabIndex={-1}
              className="font-bold"
            >
              {reviewing
                ? copy.reviewTitle
                : `${drafts.length} ${copy.draftCount}`}
            </h2>
            <ul className="divide-y divide-black/20">
              {drafts.map((draft, index) => (
                <li key={draft.key} className="py-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="min-w-0 flex-1 font-bold">{draft.name}</h3>
                    {!reviewing && (
                      <>
                        <Button
                          variant="link"
                          className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
                          disabled={hasUnfinishedDraft}
                          aria-label={`${copy.edit} ${draft.name}`}
                          onClick={() => {
                            setEditingKey(draft.key)
                            setEditorDraft({
                              name: draft.name,
                              definition: draft.definition,
                            })
                            setWriting(true)
                            setReviewing(false)
                          }}
                        >
                          {copy.edit}
                        </Button>
                        <Button
                          variant="link"
                          className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
                          disabled={editingKey === draft.key}
                          aria-label={`${copy.remove} ${draft.name}`}
                          onClick={() => {
                            setDrafts(
                              drafts.filter((item) => item.key !== draft.key),
                            )
                            setReviewing(false)
                          }}
                        >
                          {copy.remove}
                        </Button>
                      </>
                    )}
                  </div>
                  {reviewing && <p>{draft.definition}</p>}
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
            {reviewing ? (
              <>
                <p className="text-sm">{copy.consequences}</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={!canApply}
                    onClick={() =>
                      onApply(
                        drafts.map(({ name, definition }) => ({
                          name,
                          definition,
                        })),
                      )
                    }
                  >
                    {copy.apply}
                  </Button>
                  <Button variant="outline" onClick={() => setReviewing(false)}>
                    Keep editing
                  </Button>
                  <Button
                    variant="link"
                    className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
                    onClick={exportData}
                  >
                    {isExporting ? copy.exporting : copy.export}
                  </Button>
                </div>
              </>
            ) : (
              !writing && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={!canApply || hasUnfinishedDraft}
                    onClick={() => setReviewing(true)}
                  >
                    {copy.review}
                  </Button>
                  <Button
                    variant="link"
                    className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
                    onClick={() => setWriting(true)}
                  >
                    {hasUnfinishedDraft ? copy.continueDraft : copy.another}
                  </Button>
                </div>
              )
            )}
          </section>
        )}
        {hasUnfinishedDraft && (
          <Button
            variant="link"
            className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
            onClick={() => {
              setEditorDraft(EMPTY_DRAFT)
              setEditingKey(null)
              backToSelection()
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
                className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
                onClick={() => {
                  setDrafts([])
                  setEditorDraft(EMPTY_DRAFT)
                  setEditingKey(null)
                  backToSelection()
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
