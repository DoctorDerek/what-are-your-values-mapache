import type { CustomValueDraft } from "@game/data/src/CustomValueDraft"
import type { CustomValueDraftValidation } from "@game/data/src/CustomValueValidation"
import type { ComponentType, ReactElement, ReactNode, RefCallback } from "react"

export type AuthoringInputHandle = Readonly<{ focus: () => void }>
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
export type AuthoringFieldControlProps = {
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
  FeedbackCounter: ComponentType<{ children: string }>
  FeedbackError: ComponentType<{ children: string }>
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
  }>
  Panel: ComponentType<AuthoringChildren>
  Editor: ComponentType<CustomValueDraftEditorProps>
  MatchingValues: ComponentType<AuthoringChildren & { label: string }>
  Section: ComponentType<AuthoringChildren & { label: string }>
  Heading: ComponentType<AuthoringChildren>
  DraftList: ComponentType<AuthoringChildren>
  Draft: ComponentType<AuthoringChildren & { name: string; definition: string }>
  ActionRow: ComponentType<AuthoringChildren>
  Action: ComponentType<AuthoringActionProps>
  NoticeList: ComponentType<AuthoringChildren>
  Notice: ComponentType<{ children: string }>
  Footer: ComponentType<AuthoringChildren>
  Status: ComponentType<{ children: string; isError?: boolean }>
  Confirmation: ComponentType<{
    open: boolean
    onKeepEditing: () => void
    onRestoreFocus: () => void
    title: string
    discard: ReactElement
    actions: ReactElement
  }>
}
