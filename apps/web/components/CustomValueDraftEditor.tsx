"use client"

import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
import { CUSTOM_VALUE_INVITATION_COPY as copy } from "@game/data/src/CustomValueInvitationCopy"
import {
  CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES,
  CUSTOM_VALUE_NAME_MAX_GRAPHEMES,
  type CustomValueDraftValidation,
} from "@game/data/src/CustomValueValidation"
import { useEffect, useRef } from "react"
import CustomValueFieldFeedback from "@/components/CustomValueFieldFeedback"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function CustomValueDraftEditor({
  draft,
  validation,
  editing,
  onChange,
  onSubmit,
  onBack,
}: {
  draft: CustomValueDraft
  validation: CustomValueDraftValidation
  editing: boolean
  onChange: (draft: CustomValueDraft) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const nameRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    nameRef.current?.focus()
  }, [])
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (validation.isValid) onSubmit()
      }}
    >
      <h2 className="text-xl font-black uppercase">{copy.editorTitle}</h2>
      <div className="space-y-2">
        <label htmlFor="hub-custom-value-name" className="font-bold">
          {copy.name}
        </label>
        <Input
          ref={nameRef}
          id="hub-custom-value-name"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          aria-describedby="hub-name-feedback"
          aria-invalid={
            draft.name.length > 0 && validation.name.validationCode !== null
          }
        />
        <CustomValueFieldFeedback
          id="hub-name-feedback"
          field="name"
          validation={validation.name}
          maximumGraphemeCount={CUSTOM_VALUE_NAME_MAX_GRAPHEMES}
          showValidationMessage={draft.name.length > 0}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="hub-custom-value-definition" className="font-bold">
          {copy.definition}
        </label>
        <Textarea
          id="hub-custom-value-definition"
          value={draft.definition}
          onChange={(event) =>
            onChange({ ...draft, definition: event.target.value })
          }
          aria-describedby="hub-definition-feedback"
          aria-invalid={
            draft.definition.length > 0 &&
            validation.definition.validationCode !== null
          }
        />
        <CustomValueFieldFeedback
          id="hub-definition-feedback"
          field="definition"
          validation={validation.definition}
          maximumGraphemeCount={CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES}
          showValidationMessage={draft.definition.length > 0}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!validation.isValid}>
          {editing ? copy.updateDraft : copy.addDraft}
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          {copy.back}
        </Button>
      </div>
    </form>
  )
}
