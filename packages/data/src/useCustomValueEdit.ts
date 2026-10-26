"use client"

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react"
import { validateCustomValueDraft } from "./CustomValueValidation"
import type { CustomValueDefinition, CustomValueId } from "./Value"

export default function useCustomValueEdit({
  initialName,
  initialDefinition,
  existingCustomValues,
  excludedCustomValueId,
  isPersistencePending,
  backRequestId = 0,
  onCancel,
  onSubmit,
}: {
  readonly initialName: string
  readonly initialDefinition: string
  readonly existingCustomValues: readonly CustomValueDefinition[]
  readonly excludedCustomValueId: CustomValueId | null
  readonly isPersistencePending: boolean
  readonly backRequestId?: number
  readonly onCancel: () => void
  readonly onSubmit: (name: string, definition: string) => void
}) {
  const [name, setName] = useState(initialName)
  const [definition, setDefinition] = useState(initialDefinition)
  const [isNameTouched, setIsNameTouched] = useState(false)
  const [isDefinitionTouched, setIsDefinitionTouched] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const previousBackRequest = useRef(backRequestId)
  const validation = useMemo(
    () =>
      validateCustomValueDraft({
        name,
        definition,
        existingCustomValues,
        excludedCustomValueId,
      }),
    [name, definition, existingCustomValues, excludedCustomValueId],
  )
  const canSubmit =
    validation.isValid &&
    !isPersistencePending &&
    (validation.name.value !== initialName ||
      validation.definition.value !== initialDefinition)

  function back() {
    if (isPersistencePending) return
    if (isReviewing) setIsReviewing(false)
    else onCancel()
  }

  function submit() {
    setIsNameTouched(true)
    setIsDefinitionTouched(true)
    if (!canSubmit) return
    if (isReviewing)
      onSubmit(validation.name.value, validation.definition.value)
    else setIsReviewing(true)
  }

  const handleBackRequest = useEffectEvent(back)
  useEffect(() => {
    if (previousBackRequest.current === backRequestId) return
    previousBackRequest.current = backRequestId
    handleBackRequest()
  }, [backRequestId])

  return {
    name,
    definition,
    setName,
    setDefinition,
    isNameTouched,
    isDefinitionTouched,
    setIsNameTouched,
    setIsDefinitionTouched,
    validation,
    canSubmit,
    isReviewing,
    back,
    submit,
  }
}
