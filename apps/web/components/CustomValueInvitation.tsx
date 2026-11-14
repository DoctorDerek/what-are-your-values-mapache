"use client"

import type { CustomValueInvitationParts } from "@game/ui/src/CustomValueInvitationParts"
import CustomValueInvitationView, {
  type CustomValueInvitationProps,
} from "@game/ui/src/CustomValueInvitationView"
import { cx } from "classix"
import CustomValueDraftEditor from "@/components/CustomValueDraftEditor"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useWebControllerActions } from "@/components/WebControlsProvider"

const parts: CustomValueInvitationParts = {
  Surface: function AuthoringSurface({
    children,
    footer,
    confirmation,
    title,
    disabled,
    onBack,
  }) {
    useWebControllerActions(1, (command) => {
      if (command !== "back" && command !== "cancel") return false
      onBack()
      return true
    })
    return (
      <aside
        aria-label={title}
        className="text-mapache-vivid-dark flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col [&_button]:max-w-full"
      >
        <fieldset
          disabled={disabled}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <div
            className="min-h-0 flex-1 snap-y snap-proximity scroll-py-[12px] overflow-y-auto overscroll-contain"
            data-controller-scroll
          >
            <div className="flex min-h-full flex-col gap-[16px]">
              {children}
            </div>
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
    <section
      className={cx(
        "mt-3 grid max-h-[min(12rem,35dvh)] overflow-y-auto overscroll-contain",
        className,
      )}
      aria-label={label}
      data-controller-scroll
      tabIndex={0}
    >
      {children}
    </section>
  ),
  Section: ({ children, className, label }) => (
    <section aria-label={label} className={className}>
      {children}
    </section>
  ),
  Heading: ({ children, className }) => (
    <h2 className={className}>{children}</h2>
  ),
  DraftList: ({ children }) => (
    <ul className="divide-y divide-black/20">{children}</ul>
  ),
  Draft: ({ children, name, definition }) => (
    <li className="py-2">
      <h3 className="font-bold wrap-anywhere">{name}</h3>
      <p className="wrap-anywhere">{definition}</p>
      {children}
    </li>
  ),
  ActionRow: ({ children, className }) => (
    <div className={className}>{children}</div>
  ),
  Action: ({
    children,
    variant,
    location,
    disabled,
    accessibilityLabel,
    onActivate,
  }) => (
    <Button
      type="button"
      variant={variant}
      size={
        location === "discard"
          ? "confirmation"
          : location === "decision"
            ? "default"
            : "sm"
      }
      align={location === "matching" ? "start" : "center"}
      wrap
      disabled={disabled}
      aria-label={accessibilityLabel}
      onClick={onActivate}
      typographyClassName={
        location === "decision"
          ? "text-base leading-tight xl:text-lg"
          : undefined
      }
      className={cx(
        location === "footer" && "min-w-0 flex-[1_1_7rem] wrap-anywhere",
        location === "discard" && "w-full",
        location === "decision" && "min-w-0 flex-1 basis-[8em]",
      )}
    >
      {children}
    </Button>
  ),
  NoticeList: ({ children }) => (
    <ul className="list-disc space-y-3 pl-[20px] text-sm leading-relaxed">
      {children}
    </ul>
  ),
  Notice: ({ children }) => <li>{children}</li>,
  Footer: ({ children }) => (
    <footer className="max-h-1/2 shrink-0 scroll-py-[12px] overflow-y-auto border-4 border-black bg-white p-[12px] pb-[20px] xl:px-5 [&_button]:scroll-my-[12px]">
      {children}
    </footer>
  ),
  Status: ({ children, isError }) => (
    <p
      role={isError ? "alert" : "status"}
      className={isError ? "mb-3 font-bold" : undefined}
    >
      {children}
    </p>
  ),
  Confirmation: ({
    open,
    onKeepEditing,
    onRestoreFocus,
    title,
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
        placement="reachable"
        aria-describedby={undefined}
        className="grid-rows-[minmax(0,1fr)_auto]"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus()
        }}
      >
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-[16px]">
          <DialogTitle>{title}</DialogTitle>
          {discard}
        </div>
        <footer className="flex shrink-0 flex-wrap gap-[12px] border-t-4 border-black p-[12px] pb-[20px]">
          {actions}
        </footer>
      </DialogContent>
    </Dialog>
  ),
}

export default function CustomValueInvitation(
  props: CustomValueInvitationProps,
) {
  return <CustomValueInvitationView {...props} parts={parts} />
}
