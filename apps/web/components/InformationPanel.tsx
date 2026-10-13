"use client"

import { cx } from "classix"
import type { ComponentProps, ReactNode } from "react"
import { useId } from "react"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type InformationPanelFrameProps = Readonly<{
  title: string
  children: ReactNode
  primaryActionLabel: string
  onPrimaryAction: () => void
  isPrimaryActionPending?: boolean
  accessibleCloseLabel?: string
  dialogTitle?: boolean
  presentation?: "standard" | "introduction"
  titleContent?: ReactNode
  titleDecoration?: ReactNode
  decoration?: ReactNode
  beforePrimaryAction?: ReactNode
  afterActions?: ReactNode
}>

function InformationPanelFrame({
  title,
  children,
  primaryActionLabel,
  onPrimaryAction,
  isPrimaryActionPending = false,
  accessibleCloseLabel,
  dialogTitle = false,
  presentation = "standard",
  titleContent = title,
  titleDecoration,
  decoration,
  beforePrimaryAction,
  afterActions,
}: InformationPanelFrameProps) {
  const titleId = useId()
  const isIntroduction = presentation === "introduction"
  const titleClassName = cx(
    "relative z-20 text-mapache-vivid-primary-cyan leading-tight font-black",
    isIntroduction
      ? "text-[clamp(21px,6.85vw,36px)] xl:text-[42px]"
      : "text-4xl [overflow-wrap:anywhere] uppercase sm:text-5xl lg:text-7xl",
    accessibleCloseLabel && "px-12",
  )

  return (
    <section
      aria-label={dialogTitle ? title : undefined}
      aria-labelledby={dialogTitle ? undefined : titleId}
      className={cx(
        "relative isolate grid min-h-0 w-full max-w-4xl border-4 border-black bg-white",
        isIntroduction
          ? "h-full max-h-184 grid-rows-[auto_minmax(0,1fr)_auto_auto] shadow-[8px_8px_0_#000] xl:max-w-5xl"
          : "grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden shadow-[12px_12px_0px_0px_#000000]",
      )}
    >
      {decoration}
      <header
        className={cx(
          "relative z-20 border-b-4 border-black",
          isIntroduction
            ? "px-2.5 py-4 xl:px-8 xl:py-6"
            : "px-5 py-5 sm:px-10 sm:py-7",
        )}
      >
        {titleDecoration}
        {dialogTitle ? (
          <DialogTitle className={cx(titleClassName, "xl:text-5xl")}>
            {titleContent}
          </DialogTitle>
        ) : (
          <h1 id={titleId} className={titleClassName}>
            {titleContent}
          </h1>
        )}
        {accessibleCloseLabel ? (
          <Button
            aria-label={accessibleCloseLabel}
            type="button"
            variant="outline"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onPrimaryAction}
          >
            ×
          </Button>
        ) : null}
      </header>

      <div
        data-testid="information-panel-body"
        data-controller-scroll
        tabIndex={0}
        className={cx(
          "relative z-20 min-h-0 overflow-y-auto overscroll-contain px-5",
          isIntroduction ? "py-4 xl:px-8 xl:py-6" : "py-6 sm:px-10 sm:py-8",
        )}
      >
        {children}
      </div>

      <footer
        className={cx(
          "relative z-20 border-t-4 border-black",
          isIntroduction
            ? "grid gap-3 px-4 pt-3 pb-5 xl:grid-cols-[minmax(16rem,1fr)_2fr] xl:items-center xl:gap-6 xl:px-8"
            : "bg-white px-5 py-5 sm:px-10 sm:py-6",
        )}
      >
        {beforePrimaryAction}
        <Button
          type="button"
          size="lg"
          onClick={onPrimaryAction}
          disabled={isPrimaryActionPending}
          aria-busy={isPrimaryActionPending}
          className="w-full"
          typographyClassName={
            isIntroduction
              ? "text-4xl leading-none xl:text-[42px]"
              : "text-4xl sm:text-5xl"
          }
        >
          {primaryActionLabel}
        </Button>
      </footer>
      {afterActions}
    </section>
  )
}

export default function InformationPanel(props: InformationPanelFrameProps) {
  return (
    <MapacheScreen
      spacing="compact"
      viewport="fixed"
      className={cx(
        "flex justify-center text-center",
        props.presentation === "introduction"
          ? "items-center"
          : "items-stretch",
      )}
    >
      <InformationPanelFrame {...props} />
    </MapacheScreen>
  )
}

export function ReopenedInformationPanel({
  open,
  onOpenChange,
  onCloseAutoFocus,
  ...frameProps
}: InformationPanelFrameProps &
  Readonly<{
    open: boolean
    onOpenChange: (open: boolean) => void
    onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"]
  }>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        variant="panel"
        className="grid-cols-1 grid-rows-1"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <InformationPanelFrame {...frameProps} dialogTitle />
      </DialogContent>
    </Dialog>
  )
}
