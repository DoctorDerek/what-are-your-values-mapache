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
  presentation?: "standard" | "introduction" | "reference"
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
  const isReference = presentation === "reference"
  const titleClassName = cx(
    "relative z-20 text-mapache-vivid-primary-cyan",
    isIntroduction
      ? "font-arrival-title text-[calc(clamp(21px,6.85vw,36px)*1.3)] leading-[calc(1.25/1.3)] font-normal tracking-normal xl:text-[calc(clamp(2.625rem,4vw,4rem)*1.3)]"
      : isReference
        ? "min-w-0 flex-[1_1_10rem] text-2xl leading-tight font-black [overflow-wrap:anywhere] hyphens-auto uppercase xl:text-3xl"
        : "min-w-0 flex-[1_1_10rem] text-left text-xl leading-tight font-black [overflow-wrap:anywhere] hyphens-auto",
    accessibleCloseLabel && isIntroduction && "px-12",
  )

  return (
    <section
      aria-label={dialogTitle ? title : undefined}
      aria-labelledby={dialogTitle ? undefined : titleId}
      className={cx(
        "relative isolate min-h-0 w-full min-w-0 bg-white",
        !isIntroduction &&
          "max-w-4xl overflow-hidden border-4 border-black shadow-[12px_12px_0px_0px_#000000]",
        isIntroduction
          ? "flex h-full flex-col"
          : isReference
            ? "grid grid-rows-[auto_minmax(0,1fr)_auto]"
            : "flex flex-col",
      )}
    >
      {decoration}
      <header
        tabIndex={isIntroduction ? 0 : undefined}
        className={cx(
          "relative z-20 border-black",
          isIntroduction
            ? "flex max-h-[40%] min-h-[min(6rem,20dvh)] shrink items-center-safe justify-center overflow-y-auto border-b-6 px-4 py-[clamp(4px,calc(100dvh-430px),20px)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black xl:px-8 xl:py-[24px]"
            : isReference
              ? "flex min-w-0 flex-wrap items-start gap-3 border-b-4 px-[16px] py-[20px]"
              : "flex max-h-[40%] min-w-0 shrink-0 flex-wrap items-start gap-3 overflow-auto overscroll-contain border-b-4 p-[16px]",
        )}
      >
        {titleDecoration}
        {dialogTitle ? (
          <DialogTitle className={titleClassName}>{titleContent}</DialogTitle>
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
            className={
              isIntroduction ? "absolute top-4 right-4" : "ml-auto shrink-0"
            }
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
          "relative z-20 min-w-0 overflow-y-auto overscroll-contain [overflow-wrap:anywhere] hyphens-auto",
          isIntroduction
            ? "mx-auto min-h-[min(10rem,25dvh)] w-full max-w-4xl flex-1 [scrollbar-gutter:stable] px-5 py-[min(1.25rem,3dvh)] text-left xl:px-10 xl:py-7"
            : "min-h-0 flex-1 px-[20px] py-[16px] xl:px-8",
        )}
      >
        {children}
      </div>

      <footer
        className={cx(
          "relative z-20 border-black",
          isIntroduction
            ? "flex max-h-[35%] min-w-0 shrink-0 scroll-py-[12px] flex-wrap content-start items-center justify-center gap-[12px] overflow-y-auto border-t-6 px-[24px] pt-[clamp(8px,calc(100dvh-430px),16px)] pb-[clamp(12px,calc(100dvh-430px),20px)] xl:flex-col xl:flex-nowrap [&>*]:max-w-xl [&>*]:flex-[1_1_16.25rem] [&>*]:scroll-my-[12px] xl:[&>*]:w-full xl:[&>*]:flex-auto"
            : isReference
              ? "min-w-0 border-t-4 bg-white px-[16px] pt-[12px] pb-[20px]"
              : "min-w-0 shrink-0 border-t-4 bg-white px-[16px] pt-[12px] pr-[20px] pb-[20px]",
        )}
      >
        {beforePrimaryAction}
        <Button
          type="button"
          size={isIntroduction ? "arrival" : isReference ? "sm" : "default"}
          wrap
          onClick={onPrimaryAction}
          onFocus={
            isIntroduction
              ? (event) =>
                  event.currentTarget.scrollIntoView({
                    block: "nearest",
                    inline: "nearest",
                  })
              : undefined
          }
          disabled={isPrimaryActionPending}
          aria-busy={isPrimaryActionPending}
          className={cx(
            "w-full min-w-0",
            !isIntroduction && "px-[12px] py-[8px]",
          )}
          typographyClassName={
            isIntroduction
              ? "text-3xl leading-none [overflow-wrap:anywhere] hyphens-auto"
              : "text-xl leading-tight [overflow-wrap:anywhere]"
          }
        >
          {primaryActionLabel}
        </Button>
      </footer>
      {afterActions && (
        <div
          className={cx(
            "relative z-20 overflow-y-auto",
            isIntroduction
              ? "max-h-[40%] min-h-[min(8rem,20dvh)] shrink"
              : "min-h-0",
          )}
        >
          {afterActions}
        </div>
      )}
    </section>
  )
}

export default function InformationPanel(props: InformationPanelFrameProps) {
  return (
    <MapacheScreen
      spacing={
        props.presentation === "introduction" ? "safe-area-only" : "compact"
      }
      viewport="fixed"
      className="flex items-stretch justify-center text-center"
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
        className="grid h-[calc(100dvh-2rem)] max-w-4xl grid-cols-1 grid-rows-1"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <InformationPanelFrame {...frameProps} dialogTitle />
      </DialogContent>
    </Dialog>
  )
}
