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
  onChange,
  onSubmit,
  onBack,
}: {
  draft: CustomValueDraft
  validation: CustomValueDraftValidation
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
      id="hub-custom-value-editor"
      aria-label={copy.editorTitle}
      className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_2fr]"
      onSubmit={(event) => {
        event.preventDefault()
        if (validation.isValid) onSubmit()
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 xl:col-span-2">
        <h2 className="text-xl font-black uppercase">{copy.editorTitle}</h2>
        <Button
          type="button"
          variant="link"
          className="text-mapache-vivid-dark min-h-11 p-0 text-base normal-case"
          onClick={onBack}
        >
          {copy.back}
        </Button>
      </div>
      <div className="space-y-2">
        <label htmlFor="hub-custom-value-name" className="font-bold">
          {copy.name}
        </label>
        <Input
          className="border-2 px-3 py-2 text-base font-normal"
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
          rows={2}
          className="min-h-16 border-2 px-3 py-2 text-base font-normal"
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
    </form>
  )
}
