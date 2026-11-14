import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
import type { CustomValueDraftValidation } from "@game/data/src/CustomValueValidation"
import type { ComponentType, ReactElement, ReactNode, RefCallback } from "react"

export type AuthoringInputHandle = Readonly<{
  focus: () => void
  isFocused: () => boolean
}>
export type AuthoringField = "name" | "definition"
export type AuthoringChildren = { children: ReactNode; className?: string }
export type AuthoringActionProps = {
  children: string
  accessibilityLabel?: string
  disabled: boolean
  onActivate: () => void
  variant: "default" | "secondary" | "outline" | "link"
  location: "matching" | "inline" | "footer" | "discard" | "decision"
}
export type AuthoringActionControlProps = Omit<
  AuthoringActionProps,
  "location"
> & {
  size: "confirmation" | "default" | "sm"
  className: string
  textClassName: string
}
export type AuthoringFieldControlProps = {
  className: string
  field: AuthoringField
  label: string
  hint: string
  value: string
  disabled: boolean
  invalid: boolean
  describedBy: string
  inputRef: RefCallback<AuthoringInputHandle>
  onChange: (value: string) => void
  onNext: () => void
}
export type CustomValueDraftEditorParts = {
  Form: ComponentType<
    AuthoringChildren & { label: string; onSubmit: () => void }
  >
  Heading: ComponentType<AuthoringChildren>
  Example: ComponentType<AuthoringChildren>
  FieldGroup: ComponentType<AuthoringChildren>
  Label: ComponentType<AuthoringChildren & { field: AuthoringField }>
  Control: ComponentType<AuthoringFieldControlProps>
  Feedback: ComponentType<AuthoringChildren & { field: AuthoringField }>
  FeedbackCounter: ComponentType<AuthoringChildren>
  FeedbackError: ComponentType<AuthoringChildren>
}
export type CustomValueDraftEditorProps = {
  draft: CustomValueDraft
  validation: CustomValueDraftValidation
  disabled: boolean
  nameInputRef: RefCallback<AuthoringInputHandle>
  definitionInputRef: RefCallback<AuthoringInputHandle>
  onChange: (draft: CustomValueDraft) => void
  onSubmit: () => void
  onNext: () => void
}
export type CustomValueInvitationParts = {
  Surface: ComponentType<{
    children: ReactNode
    footer: ReactNode
    confirmation: ReactNode
    title: string
    disabled: boolean
    isConfirming: boolean
    onBack: () => void
    className: string
    contentClassName: string
  }>
  Panel: ComponentType<AuthoringChildren>
  Editor: ComponentType<CustomValueDraftEditorProps>
  MatchingValues: ComponentType<
    AuthoringChildren & { label: string; contentClassName: string }
  >
  Section: ComponentType<AuthoringChildren & { label: string }>
  Heading: ComponentType<AuthoringChildren>
  DraftList: ComponentType<AuthoringChildren>
  Draft: ComponentType<AuthoringChildren>
  DraftTitle: ComponentType<AuthoringChildren>
  DraftDefinition: ComponentType<AuthoringChildren>
  ActionRow: ComponentType<AuthoringChildren>
  Action: ComponentType<AuthoringActionControlProps>
  NoticeList: ComponentType<AuthoringChildren>
  Notice: ComponentType<AuthoringChildren>
  Footer: ComponentType<AuthoringChildren & { contentClassName: string }>
  Status: ComponentType<AuthoringChildren & { isError?: boolean }>
  Confirmation: ComponentType<{
    open: boolean
    onKeepEditing: () => void
    onRestoreFocus: () => void
    title: string
    frameClassName: string
    titleClassName: string
    readingClassName: string
    footerClassName: string
    discard: ReactElement
    actions: ReactElement
  }>
}
