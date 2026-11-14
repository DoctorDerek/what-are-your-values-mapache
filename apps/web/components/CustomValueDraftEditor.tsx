"use client"

import CustomValueDraftEditorView from "@game/ui/src/CustomValueDraftEditorView"
import type {
  CustomValueDraftEditorParts,
  CustomValueDraftEditorProps,
} from "@game/ui/src/CustomValueInvitationParts"
import { cx } from "classix"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const parts: CustomValueDraftEditorParts = {
  Form: ({ children, className, label, onSubmit }) => (
    <form
      id="hub-custom-value-editor"
      aria-label={label}
      className={className}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      {children}
    </form>
  ),
  Heading: ({ children, className }) => (
    <h2 className={className}>{children}</h2>
  ),
  Example: ({ children, className }) => (
    <p id="hub-custom-value-example" className={className}>
      {children}
    </p>
  ),
  FieldGroup: ({ children, className }) => (
    <div className={cx("focus-within:snap-center", className)}>{children}</div>
  ),
  Label: ({ children, className, field }) => (
    <label htmlFor={`hub-custom-value-${field}`} className={className}>
      {children}
    </label>
  ),
  Control: ({
    field,
    value,
    invalid,
    disabled,
    describedBy,
    inputRef,
    onChange,
  }) => {
    const Component = field === "name" ? Input : Textarea
    return (
      <Component
        ref={inputRef}
        id={`hub-custom-value-${field}`}
        variant="compact"
        className="scroll-my-[12px]"
        value={value}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        {...(field === "definition" && { rows: 2 })}
      />
    )
  },
  Feedback: ({ children, className, field }) => (
    <div id={`hub-${field}-feedback`} className={className}>
      {children}
    </div>
  ),
  FeedbackCounter: ({ children }) => (
    <span className="text-sm font-bold">{children}</span>
  ),
  FeedbackError: ({ children }) => (
    <span role="alert" className="text-sm font-black text-black">
      {children}
    </span>
  ),
}

export default function CustomValueDraftEditor(
  props: CustomValueDraftEditorProps,
) {
  return <CustomValueDraftEditorView {...props} parts={parts} />
}
