"use client"

import {
  CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES,
  CUSTOM_VALUE_NAME_MAX_GRAPHEMES,
} from "@game/data/src/CustomValueValidation"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type {
  CustomValueDraftEditorParts,
  CustomValueDraftEditorProps,
} from "@game/ui/src/CustomValueInvitationParts"
import { cx } from "classix"

export default function CustomValueDraftEditorView({
  parts,
  draft,
  validation,
  disabled,
  nameInputRef,
  definitionInputRef,
  onChange,
  onSubmit,
  onNext,
}: CustomValueDraftEditorProps & { parts: CustomValueDraftEditorParts }) {
  const localization = useLocaleCatalog()
  const copy = localization.interfaceCopy.customValues
  const {
    Form,
    Heading,
    Example,
    FieldGroup,
    Label,
    Control,
    Feedback,
    FeedbackCounter,
    FeedbackError,
  } = parts
  return (
    <Form
      label={copy.editorTitle}
      className="flex flex-col gap-3 xl:flex-row xl:flex-wrap"
      onSubmit={() => {
        if (validation.isValid) onSubmit()
      }}
    >
      <Heading className="w-full text-xl font-black uppercase">
        {copy.editorTitle}
      </Heading>
      <Example className="w-full text-sm leading-5">{copy.example}</Example>
      {(["name", "definition"] as const).map((field) => {
        const fieldValidation = validation[field]
        const validationMessage = fieldValidation.validationCode
          ? localization.interfaceCopy.customValueValidation[field][
              fieldValidation.validationCode
            ]
          : null
        return (
          <FieldGroup
            key={field}
            className={cx(
              "flex min-w-0 flex-col gap-2",
              field === "name" ? "xl:flex-1" : "xl:flex-[2]",
            )}
          >
            <Label field={field} className="font-bold">
              {copy[field]}
            </Label>
            <Control
              field={field}
              label={copy[field]}
              hint={copy.example}
              value={draft[field]}
              disabled={disabled}
              invalid={
                draft[field].length > 0 &&
                fieldValidation.validationCode !== null
              }
              describedBy={cx(
                field === "name" && "hub-custom-value-example",
                `hub-${field}-feedback`,
              )}
              inputRef={field === "name" ? nameInputRef : definitionInputRef}
              onChange={(value) => onChange({ ...draft, [field]: value })}
              onNext={onNext}
            />
            <Feedback
              field={field}
              className="flex flex-row flex-wrap items-start justify-between gap-2"
            >
              <FeedbackCounter>
                {localization.interfaceCopy.screen.characterCount(
                  String(fieldValidation.graphemeCount),
                  String(
                    field === "name"
                      ? CUSTOM_VALUE_NAME_MAX_GRAPHEMES
                      : CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES,
                  ),
                )}
              </FeedbackCounter>
              {draft[field].length > 0 && validationMessage && (
                <FeedbackError>{validationMessage}</FeedbackError>
              )}
            </Feedback>
          </FieldGroup>
        )
      })}
    </Form>
  )
}
