"use client"

import {
  CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES,
  CUSTOM_VALUE_NAME_MAX_GRAPHEMES,
} from "@game/data/src/CustomValueValidation"
import type { LocalizationCatalog } from "@game/data/src/LocalizationCatalog"
import useCustomValueEdit from "@game/data/src/useCustomValueEdit"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { CustomValueDefinition } from "@game/data/src/Value"
import { useEffect, useEffectEvent, useRef } from "react"
import CustomValueFieldFeedback from "@/components/CustomValueFieldFeedback"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useWebControllerActions } from "@/components/WebControlsProvider"

export default function CustomValueEditor({
  value,
  action,
  existingCustomValues,
  localization: localizationOverride,
  isPersistencePending,
  isMenuOpen,
  persistenceIssue,
  onCancel,
  onUpdate,
  onDelete,
  backRequestId,
}: {
  readonly value: CustomValueDefinition
  readonly action: "edit" | "delete"
  readonly existingCustomValues: readonly CustomValueDefinition[]
  readonly localization: LocalizationCatalog
  readonly isPersistencePending: boolean
  readonly isMenuOpen: boolean
  readonly persistenceIssue: string | null
  readonly onCancel: () => void
  readonly onUpdate: (name: string, definition: string) => void
  readonly onDelete: () => void
  readonly backRequestId: number
}) {
  const localization = useLocaleCatalog(localizationOverride)
  const copy = localization.interfaceCopy.screen
  const editor = useCustomValueEdit({
    initialName: value.name,
    initialDefinition: value.definition,
    existingCustomValues,
    excludedCustomValueId: value.id,
    isPersistencePending,
    onCancel,
    onSubmit: onUpdate,
    backRequestId,
  })
  const headingRef = useRef<HTMLHeadingElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const isDeleting = action === "delete"
  const isReview = isDeleting || editor.isReviewing

  useEffect(() => {
    if (isReview) headingRef.current?.focus({ preventScroll: true })
    else nameRef.current?.focus({ preventScroll: true })
  }, [isReview])

  const handleBack = () => {
    if (isPersistencePending) return
    if (isDeleting) onCancel()
    else editor.back()
  }
  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented || isMenuOpen) return
    event.preventDefault()
    handleBack()
  })
  useEffect(() => {
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [])
  useWebControllerActions(1, (command) => {
    if (isMenuOpen || (command !== "back" && command !== "cancel")) return false
    handleBack()
    return true
  })

  return (
    <MapacheScreen
      viewport="fixed"
      spacing="compact"
      className="flex justify-center"
    >
      <form
        aria-labelledby="custom-value-editor-title"
        className="flex min-h-0 w-full max-w-3xl flex-col border-4 border-black bg-white text-black shadow-[8px_8px_0px_0px_#000000]"
        onSubmit={(event) => {
          event.preventDefault()
          if (isDeleting) {
            if (!isPersistencePending) onDelete()
          } else editor.submit()
        }}
      >
        <section
          data-controller-scroll
          tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 xl:p-6"
        >
          <h1
            id="custom-value-editor-title"
            ref={headingRef}
            tabIndex={-1}
            className="mb-5 text-2xl font-black break-words uppercase xl:text-3xl"
          >
            {isDeleting
              ? copy.removeValue(value.name)
              : editor.isReviewing
                ? copy.updateValue(editor.validation.name.value)
                : copy.editValue(value.name)}
          </h1>
          {persistenceIssue && (
            <div
              role="alert"
              className="bg-mapache-vivid-primary-orange mb-4 border-4 border-black p-3 font-bold"
            >
              <p>{copy.changeNotSaved}</p>
              <p>{copy.draftUnchanged}</p>
            </div>
          )}
          {isReview ? (
            <div className="space-y-4 [overflow-wrap:anywhere]">
              <h2 className="text-xl font-black">
                {isDeleting ? value.name : editor.validation.name.value}
              </h2>
              <p className="text-lg font-bold whitespace-pre-wrap">
                “
                {isDeleting
                  ? value.definition
                  : editor.validation.definition.value}
                ”
              </p>
              <p className="border-mapache-vivid-primary-orange bg-mapache-vivid-primary-orange/15 border-4 p-4 text-lg font-bold">
                {isDeleting
                  ? copy.customDeleteConsequences
                  : copy.customUpdateConsequences}
              </p>
            </div>
          ) : (
            <>
              <label
                htmlFor="custom-value-edit-name"
                className="mb-3 block text-xl font-black uppercase"
              >
                {copy.valueName}
              </label>
              <Input
                ref={nameRef}
                id="custom-value-edit-name"
                value={editor.name}
                disabled={isPersistencePending}
                onChange={(event) => editor.setName(event.target.value)}
                onBlur={() => editor.setIsNameTouched(true)}
                aria-invalid={
                  editor.isNameTouched &&
                  editor.validation.name.validationCode !== null
                }
                aria-describedby="custom-value-edit-name-feedback"
                variant="emphasized"
                className="mb-3"
              />
              <CustomValueFieldFeedback
                id="custom-value-edit-name-feedback"
                field="name"
                validation={editor.validation.name}
                maximumGraphemeCount={CUSTOM_VALUE_NAME_MAX_GRAPHEMES}
                showValidationMessage={
                  editor.isNameTouched ||
                  editor.validation.name.validationCode === "duplicate_name"
                }
              />
              <label
                htmlFor="custom-value-edit-definition"
                className="mt-4 mb-3 block text-xl font-black uppercase"
              >
                {copy.definition}
              </label>
              <Textarea
                id="custom-value-edit-definition"
                value={editor.definition}
                disabled={isPersistencePending}
                onChange={(event) => editor.setDefinition(event.target.value)}
                onBlur={() => editor.setIsDefinitionTouched(true)}
                aria-invalid={
                  editor.isDefinitionTouched &&
                  editor.validation.definition.validationCode !== null
                }
                aria-describedby="custom-value-edit-definition-feedback"
                rows={4}
                variant="emphasized"
              />
              <CustomValueFieldFeedback
                id="custom-value-edit-definition-feedback"
                field="definition"
                validation={editor.validation.definition}
                maximumGraphemeCount={CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES}
                showValidationMessage={editor.isDefinitionTouched}
              />
            </>
          )}
        </section>
        <footer className="flex shrink-0 flex-wrap gap-3 border-t-4 border-black p-[16px] pb-[20px] hyphens-manual">
          <Button
            type="button"
            size="sm"
            wrap
            variant="outline"
            typographyClassName="text-base leading-tight"
            className="min-w-0 basis-[min-content] grow wrap-break-word"
            disabled={isPersistencePending}
            onClick={handleBack}
          >
            <span className="min-w-0">
              {editor.isReviewing && !isDeleting
                ? localization.interfaceCopy.dressingRoom.back
                : copy.cancel}
            </span>
          </Button>
          <Button
            type="submit"
            size="sm"
            wrap
            variant={isDeleting ? "destructive" : "default"}
            typographyClassName="text-base leading-tight"
            className="min-w-0 basis-[min-content] grow wrap-break-word"
            disabled={isDeleting ? isPersistencePending : !editor.canSubmit}
          >
            <span className="min-w-0">
              {isPersistencePending
                ? isDeleting
                  ? copy.deleting
                  : copy.saving
                : isDeleting
                  ? copy.deleteValue
                  : editor.isReviewing
                    ? copy.updateValueAction
                    : copy.reviewUpdate}
            </span>
          </Button>
        </footer>
      </form>
    </MapacheScreen>
  )
}
