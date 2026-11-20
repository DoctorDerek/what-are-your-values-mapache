"use client"

import type { CustomValueInvitationParts } from "@game/ui/src/CustomValueInvitationParts"
import CustomValueInvitationView, {
  type CustomValueInvitationProps,
} from "@game/ui/src/CustomValueInvitationView"
import { cx } from "classix"
import type { StaticImageData } from "next/image"
import CustomValueDraftEditor from "@/components/CustomValueDraftEditor"
import PersonalValueRow from "@/components/PersonalValueRow"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useWebControllerActions } from "@/components/WebControlsProvider"

const parts: CustomValueInvitationParts<StaticImageData> = {
  Surface: function AuthoringSurface({
    children,
    footer,
    confirmation,
    title,
    disabled,
    onBack,
    className,
    contentClassName,
  }) {
    useWebControllerActions(1, (command) => {
      if (command !== "back" && command !== "cancel") return false
      onBack()
      return true
    })
    return (
      <aside
        aria-label={title}
        className={cx("[&_button]:max-w-full", className)}
      >
        <fieldset
          disabled={disabled}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <div
            className="min-h-0 flex-1 snap-y snap-proximity scroll-py-[12px] overflow-y-auto overscroll-contain"
            data-controller-scroll
          >
            <div className={cx("min-h-full", contentClassName)}>{children}</div>
          </div>
          {footer}
        </fieldset>
        {confirmation}
      </aside>
    )
  },
  Panel: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  Editor: CustomValueDraftEditor,
  MatchingValues: ({ children, className, label }) => (
    <section className={className} aria-label={label}>
      {children}
    </section>
  ),
  MatchingRow: ({ value, runtimeClipCatalog, shouldReduceMotion }) => (
    <PersonalValueRow
      value={value}
      hasComparisons={false}
      catalog={runtimeClipCatalog}
      shouldReduceMotion={shouldReduceMotion}
      presentation="matching"
    />
  ),
  Section: ({ children, className, label }) => (
    <section aria-label={label} className={className}>
      {children}
    </section>
  ),
  Heading: ({ children, className }) => (
    <h2 className={className}>{children}</h2>
  ),
  DraftList: ({ children, className }) => (
    <ul className={className}>{children}</ul>
  ),
  Draft: ({ children, className }) => <li className={className}>{children}</li>,
  DraftTitle: ({ children, className, accessibilityLabel }) => (
    <h3 className={className} aria-label={accessibilityLabel}>
      {children}
    </h3>
  ),
  DraftDefinition: ({ children, className }) => (
    <p className={className}>{children}</p>
  ),
  ActionRow: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  Action: ({
    children,
    variant,
    size,
    className,
    textClassName,
    disabled,
    accessibilityLabel,
    onActivate,
  }) => (
    <button
      type="button"
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      aria-label={accessibilityLabel}
      onClick={onActivate}
      className={cx(className, textClassName)}
    >
      {children}
    </button>
  ),
  NoticeList: ({ children, className }) => (
    <ul className={cx("list-disc pl-[20px]", className)}>{children}</ul>
  ),
  Notice: ({ children, className }) => (
    <li className={className}>{children}</li>
  ),
  Footer: ({ children, className, contentClassName }) => (
    <footer
      className={cx(
        "scroll-py-[12px] overflow-y-auto [&_button]:scroll-my-[12px]",
        className,
        contentClassName,
      )}
    >
      {children}
    </footer>
  ),
  Status: ({ children, className, isError }) => (
    <p role={isError ? "alert" : "status"} className={className}>
      {children}
    </p>
  ),
  Confirmation: ({
    open,
    onKeepEditing,
    onRestoreFocus,
    title,
    frameClassName,
    titleClassName,
    readingClassName,
    footerClassName,
    discard,
    actions,
  }) => (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onKeepEditing()
      }}
    >
      <DialogContent
        variant="panel"
        placement="reachable"
        aria-describedby={undefined}
        className={cx("grid grid-rows-[minmax(0,1fr)_auto]", frameClassName)}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus()
        }}
      >
        <div
          className={cx(
            "min-h-0 overflow-y-auto overscroll-contain max-xl:px-reflow-inset",
            readingClassName,
          )}
        >
          <DialogTitle className={titleClassName}>{title}</DialogTitle>
          {discard}
        </div>
        <footer className={footerClassName}>{actions}</footer>
      </DialogContent>
    </Dialog>
  ),
}

export default function CustomValueInvitation(
  props: CustomValueInvitationProps<StaticImageData>,
) {
  return <CustomValueInvitationView {...props} parts={parts} />
}
