"use client"

import {
  validateCustomValueBatch,
  type CustomValueDraft,
} from "@game/data/src/CustomValueDraft"
import { CUSTOM_VALUE_INVITATION_COPY as copy } from "@game/data/src/CustomValueInvitationCopy"
import { CUSTOM_VALUE_STARTER_EXAMPLES } from "@game/data/src/CustomValueStarterExamples"
import { validateCustomValueDraft } from "@game/data/src/CustomValueValidation"
import { customValueValidationMessages } from "@game/data/src/CustomValueValidationMessages"
import type { CustomValueDefinition } from "@game/data/src/Value"
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
  existingCustomValues,
  isSaving,
  saveIssue,
  onApply,
  onExport,
  onNavigationBlockedChange,
}: {
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
  const writeButtonRef = useRef<HTMLButtonElement>(null)
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
    editorDraft.name.length > 0 || editorDraft.definition.length > 0
  const availableExamples = CUSTOM_VALUE_STARTER_EXAMPLES.filter(
    (example) =>
      validateCustomValueDraft({ ...example, existingCustomValues }).isValid,
  )
  const canApply =
    drafts.length > 0 && validations.every((validation) => validation.isValid)

  function backToSelection() {
    setWriting(false)
    setReviewing(false)
    writeButtonRef.current?.focus()
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
            { ...nextDraft, key: crypto.randomUUID(), exampleName: null },
          ],
    )
    setEditorDraft(EMPTY_DRAFT)
    setEditingKey(null)
    backToSelection()
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
      className="text-mapache-vivid-dark mb-4 w-full max-w-7xl border-2 border-black bg-white p-4"
    >
      <fieldset
        disabled={isSaving || isExporting}
        className="min-w-0 space-y-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            ref={writeButtonRef}
            id="hub-write-custom-values"
            variant="outline"
            onClick={() => {
              setWriting(true)
              setReviewing(false)
            }}
          >
            {copy.write}
          </Button>
          {drafts.length > 0 && (
            <span>
              {drafts.length} {copy.draftCount}
            </span>
          )}
        </div>
        {writing ? (
          <CustomValueDraftEditor
            draft={editorDraft}
            validation={editorValidation}
            editing={editingKey !== null}
            onChange={setEditorDraft}
            onSubmit={queueDraft}
            onBack={backToSelection}
          />
        ) : null}
        <details hidden={writing || reviewing || hasUnfinishedDraft}>
          <summary className="cursor-pointer text-lg font-bold focus-visible:outline-4 focus-visible:outline-offset-4">
            {copy.invitation}
          </summary>
          <div className="mt-4 space-y-4">
            <p>{copy.guidance}</p>
            <Button
              variant="outline"
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
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              {CUSTOM_VALUE_STARTER_EXAMPLES.map((example) => {
                const available = availableExamples.some(
                  (item) => item.name === example.name,
                )
                return (
                  <label
                    key={example.name}
                    className="flex items-start gap-3 border-2 border-black p-3 focus-within:outline-4 focus-within:outline-offset-2"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 size-6 shrink-0 accent-black"
                      disabled={!available}
                      checked={drafts.some(
                        (draft) => draft.exampleName === example.name,
                      )}
                      onChange={(event) =>
                        setDrafts(
                          event.target.checked
                            ? [
                                ...drafts,
                                {
                                  name: example.name,
                                  definition: example.definition,
                                  key: `example:${example.name}`,
                                  exampleName: example.name,
                                },
                              ]
                            : drafts.filter(
                                (draft) => draft.exampleName !== example.name,
                              ),
                        )
                      }
                    />
                    <span className="min-w-0 space-y-2">
                      <span className="block text-xl font-black uppercase">
                        {example.name}
                      </span>
                      <span className="block">{example.definition}</span>
                      {example.label && (
                        <span className="block text-sm">{example.label}</span>
                      )}
                      {!available && (
                        <span className="block font-bold">
                          {copy.alreadyIncluded}
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </details>
        {!writing && drafts.length > 0 && (
          <section
            className="space-y-3"
            aria-labelledby="custom-drafts-heading"
          >
            <h2
              id="custom-drafts-heading"
              ref={reviewHeadingRef}
              tabIndex={-1}
              className="text-xl font-black uppercase"
            >
              {reviewing ? copy.reviewTitle : copy.drafts}
            </h2>
            <ul className="space-y-3">
              {drafts.map((draft, index) => (
                <li
                  key={draft.key}
                  className="space-y-2 border-2 border-black p-3"
                >
                  <h3 className="font-black">{draft.name}</h3>
                  <p>{draft.definition}</p>
                  {validations[index]?.name.validationCode && (
                    <p role="alert">
                      {
                        customValueValidationMessages.name[
                          validations[index].name.validationCode
                        ]
                      }
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
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
                      variant="outline"
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
                  </div>
                </li>
              ))}
            </ul>
            {reviewing ? (
              <>
                <p>{copy.consequences}</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={exportData}>
                    {isExporting ? copy.exporting : copy.export}
                  </Button>
                  <Button variant="outline" onClick={backToSelection}>
                    {copy.back}
                  </Button>
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
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setWriting(true)}>
                  {hasUnfinishedDraft ? copy.continueDraft : copy.another}
                </Button>
                <Button
                  disabled={!canApply || hasUnfinishedDraft}
                  onClick={() => setReviewing(true)}
                >
                  {copy.review}
                </Button>
              </div>
            )}
          </section>
        )}
        {hasUnfinishedDraft && (
          <Button
            variant="outline"
            onClick={() => {
              setEditorDraft(EMPTY_DRAFT)
              setEditingKey(null)
              backToSelection()
            }}
          >
            {copy.discardUnfinished}
          </Button>
        )}
        {isNavigationBlocked && (
          <>
            <p className="text-sm">{copy.unsaved}</p>
            <Button
              variant="outline"
              onClick={() => {
                setDrafts([])
                setEditorDraft(EMPTY_DRAFT)
                setEditingKey(null)
                backToSelection()
              }}
            >
              {copy.discard}
            </Button>
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
