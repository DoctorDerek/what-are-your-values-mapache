"use client"

import { projectAllValues } from "@game/data/src/AllValuesProjection"
import type { LocalizationCatalog } from "@game/data/src/LocalizationCatalog"
import type { SeethingSwarmRuntimeClipCatalog } from "@game/data/src/SeethingSwarmRuntimeClipCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
  type CustomValueDefinition,
  type CustomValueId,
  type ValueId,
} from "@game/data/src/Value"
import { getWrappableValueDisplayName } from "@game/data/src/ValueNameTypography"
import type { RankedValue } from "@game/data/src/ValueRanking"
import type { StaticImageData } from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import AllValuesValueRow from "@/components/AllValuesValueRow"
import CustomValueEditor from "@/components/CustomValueEditor"
import MapacheScreen from "@/components/MapacheScreen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AllValues({
  rankedValues,
  localization: localizationOverride,
  runtimeClipCatalog,
  shouldReduceMotion,
  initialValueId,
  isPersistencePending = false,
  isMenuOpen,
  persistenceIssue = null,
  onClose,
  onOpenMenu,
  onAddCustomValue,
  onUpdateCustomValue,
  onDeleteCustomValue,
  onNavigationBlockedChange,
  backRequestId = 0,
}: {
  readonly localization?: LocalizationCatalog
  rankedValues: readonly RankedValue[]
  runtimeClipCatalog: SeethingSwarmRuntimeClipCatalog<StaticImageData>
  shouldReduceMotion: boolean
  initialValueId?: ValueId | null
  isPersistencePending?: boolean
  isMenuOpen: boolean
  persistenceIssue?: string | null
  onClose: () => void
  onOpenMenu: () => void
  onAddCustomValue: (name: string) => void
  onUpdateCustomValue: (
    valueId: CustomValueId,
    name: string,
    definition: string,
  ) => void
  onDeleteCustomValue: (valueId: CustomValueId) => void
  onNavigationBlockedChange?: (isBlocked: boolean) => void
  readonly backRequestId?: number
}) {
  const localizedCopy = useLocaleCatalog(localizationOverride)
  const localization = localizedCopy

  const [searchQuery, setSearchQuery] = useState("")
  const customValueActionRef = useRef<string | null>(null)
  const [activeTask, setActiveTask] = useState<{
    kind: "edit" | "delete"
    value: CustomValueDefinition
  } | null>(null)
  const [highlightedValueId] = useState<ValueId | null>(initialValueId ?? null)

  const { existingCustomValues, hasComparisons, visibleValues } = useMemo(
    () =>
      projectAllValues({
        rankedValues,
        searchQuery,
        translations: localization.values,
      }),
    [rankedValues, searchQuery, localization],
  )
  const isNavigationBlocked = isPersistencePending || activeTask !== null

  useEffect(() => {
    if (activeTask === null && customValueActionRef.current !== null) {
      document.getElementById(customValueActionRef.current)?.focus()
      customValueActionRef.current = null
    }
  }, [activeTask])

  useEffect(() => {
    onNavigationBlockedChange?.(isNavigationBlocked)
    return () => onNavigationBlockedChange?.(false)
  }, [isNavigationBlocked, onNavigationBlockedChange])

  useEffect(() => {
    if (!highlightedValueId) {
      return
    }

    const valueRow = document.getElementById(
      `all-values-row-${highlightedValueId}`,
    )
    if (valueRow instanceof HTMLElement) {
      valueRow.focus()
      valueRow.scrollIntoView({ block: "center" })
    }
  }, [highlightedValueId, searchQuery, visibleValues.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !event.defaultPrevented &&
        event.key === "Escape" &&
        !isMenuOpen &&
        !isNavigationBlocked
      ) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMenuOpen, isNavigationBlocked, onClose])

  const renderRows = (values: readonly RankedValue[]) =>
    values.map((rankedValue) => {
      const { definition } = rankedValue
      const displayName = getValueDisplayName(definition, localization.values)
      const customValueId = definition.kind === "custom" ? definition.id : null

      return (
        <AllValuesValueRow
          key={definition.id}
          rankedValue={rankedValue}
          hasComparisons={hasComparisons}
          isHighlighted={highlightedValueId === definition.id}
          runtimeClipCatalog={runtimeClipCatalog}
          shouldReduceMotion={shouldReduceMotion}
          heading={
            <>
              <h3
                aria-label={displayName}
                lang={
                  definition.kind === "canonical"
                    ? localization.metadata.languageTag
                    : undefined
                }
                className="min-w-0 flex-[1_1_16rem] text-3xl font-black break-words hyphens-auto uppercase [hyphenate-limit-chars:6_3_3] xl:text-4xl"
              >
                {getWrappableValueDisplayName(
                  definition,
                  localization.values,
                  localization.metadata.languageTag,
                )}
              </h3>
              {customValueId ? (
                <span className="bg-mapache-vivid-primary-cyan border-4 border-black px-3 py-2 text-lg font-black text-black uppercase">
                  {localizedCopy.interfaceCopy.screen.yours}
                </span>
              ) : null}
            </>
          }
          actions={
            definition.kind === "custom" ? (
              <div className="flex flex-wrap gap-3">
                <button
                  id={`edit-${definition.id}`}
                  type="button"
                  disabled={isPersistencePending}
                  onClick={(event) => {
                    customValueActionRef.current = event.currentTarget.id
                    setActiveTask({ kind: "edit", value: definition })
                  }}
                  className="bg-mapache-vivid-secondary-purple border-4 border-black px-3 py-2 text-lg font-black text-white uppercase focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-black"
                >
                  {localizedCopy.interfaceCopy.screen.edit}
                </button>
                <button
                  id={`delete-${definition.id}`}
                  type="button"
                  disabled={isPersistencePending}
                  onClick={(event) => {
                    customValueActionRef.current = event.currentTarget.id
                    setActiveTask({ kind: "delete", value: definition })
                  }}
                  className="bg-mapache-vivid-secondary-red border-4 border-black px-3 py-2 text-lg font-black text-black uppercase focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-black"
                >
                  {localizedCopy.interfaceCopy.screen.delete}
                </button>
              </div>
            ) : null
          }
        >
          <p className="mt-5 overflow-x-auto overflow-y-auto border-t-4 border-black pt-4 text-xl leading-relaxed font-bold [overflow-wrap:anywhere] break-words whitespace-pre-wrap">
            “{getValueDisplayDefinition(definition, localization.values)}”
          </p>
        </AllValuesValueRow>
      )
    })

  if (activeTask !== null) {
    return (
      <CustomValueEditor
        value={activeTask.value}
        action={activeTask.kind}
        backRequestId={backRequestId}
        existingCustomValues={existingCustomValues}
        localization={localization}
        isPersistencePending={isPersistencePending}
        isMenuOpen={isMenuOpen}
        persistenceIssue={persistenceIssue}
        onCancel={() => setActiveTask(null)}
        onUpdate={(name, definition) =>
          onUpdateCustomValue(activeTask.value.id, name, definition)
        }
        onDelete={() => onDeleteCustomValue(activeTask.value.id)}
      />
    )
  }

  return (
    <MapacheScreen
      spacing="safe-area-only"
      viewport="fixed"
      className="grid grid-rows-[auto_minmax(0,1fr)_auto] text-white"
    >
      <header className="bg-mapache-vivid-dark max-h-[40dvh] overflow-y-auto border-b-4 border-black px-4 py-3 xl:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-[1_1_12rem]">
            <h1 className="text-mapache-vivid-primary-cyan text-2xl font-black break-words uppercase xl:text-4xl">
              {localizedCopy.interfaceCopy.screen.allValues}
            </h1>
            <p className="text-sm font-bold xl:text-base">
              {localizedCopy.interfaceCopy.screen.activeValues(
                String(rankedValues.length),
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            wrap
            disabled={isNavigationBlocked}
            onClick={onOpenMenu}
          >
            {localizedCopy.interfaceCopy.menu.openAction}
          </Button>
        </div>
        <div className="mx-auto mt-3 w-full max-w-6xl">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
            <label htmlFor="all-values-search" className="font-black">
              {localizedCopy.interfaceCopy.screen.searchAllValues}
            </label>
            <p role="status" aria-live="polite" className="text-sm font-bold">
              {localizedCopy.interfaceCopy.screen.valuesShown(
                visibleValues.length,
                String(visibleValues.length),
              )}
            </p>
          </div>
          <Input
            id="all-values-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={localizedCopy.interfaceCopy.screen.searchPlaceholder}
            variant="default"
          />
        </div>
      </header>
      <section
        aria-label={localizedCopy.interfaceCopy.screen.values}
        tabIndex={0}
        data-controller-scroll
        className="mx-auto min-h-0 w-full max-w-6xl overflow-y-auto overscroll-contain px-4 py-4 xl:px-8"
      >
        {persistenceIssue ? (
          <div
            role="alert"
            aria-label={localizedCopy.interfaceCopy.screen.customSaveFailed}
            className="bg-mapache-vivid-primary-orange mt-6 border-4 border-black p-5 text-black shadow-[8px_8px_0px_0px_#000000]"
          >
            <h2 className="text-2xl font-black uppercase">
              {localizedCopy.interfaceCopy.screen.changeNotSaved}
            </h2>
            <p className="mt-2 text-lg font-bold">
              {localizedCopy.interfaceCopy.screen.draftUnchanged}
            </p>
          </div>
        ) : null}

        {hasComparisons && visibleValues.some(({ rank }) => rank <= 5) ? (
          <section
            aria-labelledby="all-values-top-five-heading"
            className="mb-4"
          >
            <h2
              id="all-values-top-five-heading"
              className="border-b-4 border-black py-2 text-lg font-black uppercase"
            >
              {localizedCopy.interfaceCopy.screen.topFive}
            </h2>
            <ol className="mt-5 flex flex-col gap-5">
              {renderRows(visibleValues.filter(({ rank }) => rank <= 5))}
            </ol>
          </section>
        ) : null}
        {hasComparisons && visibleValues.some(({ rank }) => rank > 5) ? (
          <section aria-labelledby="all-values-other-heading" className="mt-8">
            <h2
              id="all-values-other-heading"
              className="border-b-4 border-black py-2 text-lg font-black uppercase"
            >
              {localizedCopy.interfaceCopy.screen.remainingValues}
            </h2>
            <ol className="mt-5 flex flex-col gap-5">
              {renderRows(visibleValues.filter(({ rank }) => rank > 5))}
            </ol>
          </section>
        ) : null}
        {!hasComparisons ? (
          <section aria-labelledby="included-values-heading">
            <h2 id="included-values-heading" className="sr-only">
              {localizedCopy.interfaceCopy.screen.includedValues}
            </h2>
            <ol className="flex flex-col gap-5">{renderRows(visibleValues)}</ol>
          </section>
        ) : null}
        {visibleValues.length === 0 ? (
          <p className="mt-8 border-4 border-black bg-white p-8 text-center text-2xl font-black text-black shadow-[8px_8px_0px_0px_#000000]">
            {localizedCopy.interfaceCopy.screen.noSearchResults}
          </p>
        ) : null}
      </section>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap gap-3 border-t-4 border-black px-4 pt-3 pb-5 xl:px-8">
        <Button
          size="sm"
          wrap
          variant="outline"
          className="min-w-0 flex-[1_1_7rem]"
          disabled={isNavigationBlocked}
          onClick={onClose}
        >
          {localizedCopy.interfaceCopy.dressingRoom.back}
        </Button>
        <Button
          size="sm"
          wrap
          className="min-w-0 flex-[1_1_7rem]"
          disabled={isNavigationBlocked}
          onClick={() =>
            onAddCustomValue(
              visibleValues.length === 0 ? searchQuery.trim() : "",
            )
          }
        >
          {localizedCopy.hub.add}
        </Button>
      </footer>
    </MapacheScreen>
  )
}
