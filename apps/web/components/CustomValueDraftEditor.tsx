"use client"

import CustomValueDraftEditorView from "@game/ui/src/CustomValueDraftEditorView"
import type {
  CustomValueDraftEditorParts,
  CustomValueDraftEditorProps,
} from "@game/ui/src/CustomValueInvitationParts"
import { cx } from "classix"

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
    className,
    field,
    value,
    invalid,
    disabled,
    describedBy,
    inputRef,
    onChange,
  }) => {
    const Component = field === "name" ? "input" : "textarea"
    return (
      <Component
        ref={(input: HTMLInputElement | HTMLTextAreaElement | null) =>
          inputRef(
            input
              ? {
                  focus: () => input.focus(),
                  isFocused: () => document.activeElement === input,
                }
              : null,
          )
        }
        id={`hub-custom-value-${field}`}
        data-slot={field === "name" ? "input" : "textarea"}
        className={cx("scroll-my-[12px]", className)}
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
  FeedbackCounter: ({ children, className }) => (
    <span className={className}>{children}</span>
  ),
  FeedbackError: ({ children, className }) => (
    <span role="alert" className={className}>
      {children}
    </span>
  ),
}

export default function CustomValueDraftEditor(
  props: CustomValueDraftEditorProps,
) {
  return <CustomValueDraftEditorView {...props} parts={parts} />
}
