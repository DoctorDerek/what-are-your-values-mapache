"use client"

import { getErrorMessage } from "@game/utils/src/Errors"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import {
  validateCustomValueBatch,
  type CustomValueDraft,
} from "./CustomValueDraft"
import type { CustomValueDefinition, ValueId } from "./Value"

type DraftEntry = CustomValueDraft & Readonly<{ key: number }>
type ExitTarget = "home" | "menu" | Readonly<{ valueId: ValueId }>
const EMPTY_DRAFT: CustomValueDraft = Object.freeze({
  name: "",
  definition: "",
})

export type CustomValueAuthoringOptions = {
  editorRequestId?: number
  backRequestId?: number
  menuRequestId?: number
  initialName?: string
  deckRevision: number
  existingCustomValues: readonly CustomValueDefinition[]
  isSaving: boolean
  onApply: (drafts: readonly CustomValueDraft[]) => void
  onExport: () => Promise<void>
  onExit: (target: ExitTarget) => void
  onNavigationBlockedChange: (blocked: boolean) => void
}

export default function useCustomValueAuthoring({
  editorRequestId = 0,
  backRequestId = 0,
  menuRequestId = 0,
  initialName = "",
  deckRevision,
  existingCustomValues,
  isSaving,
  onApply,
  onExport,
  onExit,
  onNavigationBlockedChange,
}: CustomValueAuthoringOptions) {
  const [drafts, setDrafts] = useState<readonly DraftEntry[]>([])
  const [editorDraft, setEditorDraft] = useState<CustomValueDraft>(() =>
    editorRequestId === 0 ? EMPTY_DRAFT : { name: initialName, definition: "" },
  )
  const [editingKey, setEditingKey] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(editorRequestId !== 0)
  const [leaveTarget, setLeaveTarget] = useState<ExitTarget | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportIssue, setExportIssue] = useState<string | null>(null)
  const nextDraftKey = useRef(0)
  const pendingSaveExit = useRef<ExitTarget | null>(null)
  const previousRevision = useRef(deckRevision)
  const previousBackRequest = useRef(backRequestId)
  const previousMenuRequest = useRef(menuRequestId)
  const [handledRequestId, setHandledRequestId] = useState(editorRequestId)
  if (handledRequestId !== editorRequestId) {
    setHandledRequestId(editorRequestId)
    if (editorRequestId !== 0) {
      setIsOpen(true)
      if (!editorDraft.name && !editorDraft.definition)
        setEditorDraft({ name: initialName, definition: "" })
    }
  }
  const hasUnfinishedDraft =
    editingKey !== null ||
    editorDraft.name.length > 0 ||
    editorDraft.definition.length > 0
  const hasChanges = hasUnfinishedDraft || drafts.length > 0
  const additions = hasUnfinishedDraft
    ? editingKey !== null
      ? drafts.map((draft) => (draft.key === editingKey ? editorDraft : draft))
      : [...drafts, editorDraft]
    : drafts
  const editorValidation = validateCustomValueBatch(
    [editorDraft, ...drafts.filter((draft) => draft.key !== editingKey)],
    existingCustomValues,
  )[0]!
  const canApply =
    additions.length > 0 &&
    validateCustomValueBatch(additions, existingCustomValues).every(
      (validation) => validation.isValid,
    )
  const isBusy = isSaving || isExporting
  const isActive = isOpen || hasChanges || isBusy

  function discardAndExit(target: ExitTarget = "home") {
    if (isBusy) return
    setDrafts([])
    setEditorDraft(EMPTY_DRAFT)
    setEditingKey(null)
    setIsOpen(false)
    setLeaveTarget(null)
    pendingSaveExit.current = null
    onExit(target)
  }
  function requestExit(target: ExitTarget = "home") {
    if (isBusy) return
    if (hasChanges) setLeaveTarget(target)
    else discardAndExit(target)
  }
  const handleBackRequest = useEffectEvent(() => {
    if (leaveTarget !== null) setLeaveTarget(null)
    else requestExit()
  })
  const handleMenuRequest = useEffectEvent(() => requestExit("menu"))
  useEffect(() => {
    if (previousBackRequest.current === backRequestId) return
    previousBackRequest.current = backRequestId
    handleBackRequest()
  }, [backRequestId])
  useEffect(() => {
    if (previousMenuRequest.current === menuRequestId) return
    previousMenuRequest.current = menuRequestId
    handleMenuRequest()
  }, [menuRequestId])
  const acceptSavedRevision = useEffectEvent(() => {
    setDrafts([])
    setEditorDraft(EMPTY_DRAFT)
    setEditingKey(null)
    setIsOpen(false)
    setLeaveTarget(null)
    onExit(pendingSaveExit.current ?? "home")
    pendingSaveExit.current = null
  })
  useEffect(() => {
    if (previousRevision.current === deckRevision) return
    previousRevision.current = deckRevision
    acceptSavedRevision()
  }, [deckRevision])
  useEffect(() => {
    onNavigationBlockedChange(isActive)
    return () => onNavigationBlockedChange(false)
  }, [isActive, onNavigationBlockedChange])

  function saveAdditions() {
    if (!canApply || isBusy) return
    pendingSaveExit.current = leaveTarget
    setLeaveTarget(null)
    onApply(
      additions.map(({ name, definition }) => ({
        name: name.trim(),
        definition: definition.trim(),
      })),
    )
  }
  function queueDraft() {
    if (isBusy || !editorValidation.isValid) return
    const nextDraft = {
      name: editorValidation.name.value,
      definition: editorValidation.definition.value,
    }
    setDrafts(
      editingKey !== null
        ? drafts.map((draft) =>
            draft.key === editingKey ? { ...draft, ...nextDraft } : draft,
          )
        : [...drafts, { ...nextDraft, key: nextDraftKey.current++ }],
    )
    setEditorDraft(EMPTY_DRAFT)
    setEditingKey(null)
  }
  async function exportData() {
    if (isBusy) return
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
  return {
    drafts,
    editorDraft,
    editorValidation,
    isOpen,
    isActive,
    isBusy,
    isExporting,
    exportIssue,
    hasChanges,
    hasUnfinishedDraft,
    editingKey,
    canApply,
    leaveTarget,
    setEditorDraft,
    requestExit,
    discardAndExit,
    saveAdditions,
    queueDraft,
    exportData,
    keepEditing: () => setLeaveTarget(null),
    discardUnfinished: () => {
      setEditingKey(null)
      setEditorDraft(EMPTY_DRAFT)
    },
    editDraft: (draft: DraftEntry) => {
      setEditingKey(draft.key)
      setEditorDraft({ name: draft.name, definition: draft.definition })
    },
    removeDraft: (key: number) =>
      setDrafts(drafts.filter((draft) => draft.key !== key)),
  }
}
