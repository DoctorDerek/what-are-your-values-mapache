import { projectAllValues } from "@game/data/src/AllValuesProjection"
import type { LocalizationCatalog } from "@game/data/src/LocalizationCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayName,
  type CustomValueId,
  type ValueId,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react"
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native"
import MapacheScreen from "@/components/MapacheScreen"
import NativeCustomValueDeleteConfirmation from "@/components/NativeCustomValueDeleteConfirmation"
import NativeCustomValueForm from "@/components/NativeCustomValueForm"
import NativeValueDetailsCard from "@/components/NativeValueDetailsCard"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeAllValues({
  initialValueId = null,
  backRequestId = 0,
  isPersistencePending = false,
  onAddCustomValue,
  onClose,
  onDeleteCustomValue,
  onUpdateCustomValue,
  persistenceIssue = null,
  rankedValues,
  localization: localizationOverride,
  onNavigationBlockedChange,
}: {
  readonly localization?: LocalizationCatalog
  readonly initialValueId?: ValueId | null
  readonly backRequestId?: number
  readonly isPersistencePending?: boolean
  readonly onAddCustomValue: (name: string) => void
  readonly onClose: () => void
  readonly onDeleteCustomValue: (valueId: CustomValueId) => void
  readonly onUpdateCustomValue: (
    valueId: CustomValueId,
    name: string,
    definition: string,
  ) => void
  readonly persistenceIssue?: string | null
  readonly rankedValues: readonly RankedValue[]
  readonly onNavigationBlockedChange?: (isBlocked: boolean) => void
}) {
  const localizedCopy = useLocaleCatalog(localizationOverride)
  const localization = localizedCopy

  const previousBackRequest = useRef(backRequestId)
  const listRef = useRef<FlatList<RankedValue>>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingValueId, setEditingValueId] = useState<CustomValueId | null>(
    null,
  )
  const [deletingValueId, setDeletingValueId] = useState<CustomValueId | null>(
    null,
  )
  const [highlightedValueId, setHighlightedValueId] = useState<ValueId | null>(
    initialValueId,
  )
  const isNavigationBlocked =
    isPersistencePending || editingValueId !== null || deletingValueId !== null
  const { existingCustomValues, hasComparisons, visibleValues } = useMemo(
    () =>
      projectAllValues({
        rankedValues,
        searchQuery,
        translations: localization.values,
      }),
    [rankedValues, searchQuery, localization],
  )

  useEffect(() => {
    onNavigationBlockedChange?.(isNavigationBlocked)
    return () => onNavigationBlockedChange?.(false)
  }, [isNavigationBlocked, onNavigationBlockedChange])

  useEffect(() => {
    if (!highlightedValueId || editingValueId !== null || deletingValueId !== null) return

    const highlightedIndex = visibleValues.findIndex(
      ({ definition }) => definition.id === highlightedValueId,
    )
    if (highlightedIndex >= 0)
      listRef.current?.scrollToIndex({
        animated: false,
        index: highlightedIndex,
        viewPosition: 0.25,
      })
  }, [highlightedValueId, visibleValues, editingValueId, deletingValueId])

  const handleDeleteBack = useEffectEvent(() => {
    if (deletingValueId !== null && !isPersistencePending)
      setDeletingValueId(null)
  })
  useEffect(() => {
    if (previousBackRequest.current === backRequestId) return
    previousBackRequest.current = backRequestId
    handleDeleteBack()
  }, [backRequestId])

  const openMatchingValue = (valueId: ValueId) => {
    setEditingValueId(null)
    setDeletingValueId(null)
    setSearchQuery("")
    setHighlightedValueId(valueId)
  }

  const activeDefinition = rankedValues.find(
    ({ definition }) => definition.id === (editingValueId ?? deletingValueId),
  )?.definition

  if (activeDefinition?.kind === "custom") {
    return (
      <MapacheScreen>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="min-h-0 flex-1 p-4"
        >
          {editingValueId !== null ? (
            <NativeCustomValueForm
              excludedCustomValueId={activeDefinition.id}
              existingCustomValues={existingCustomValues}
              initialDefinition={activeDefinition.definition}
              initialName={activeDefinition.name}
              isPersistencePending={isPersistencePending}
              persistenceIssue={persistenceIssue}
              backRequestId={backRequestId}
              onCancel={() => setEditingValueId(null)}
              onOpenMatchingValue={openMatchingValue}
              onSubmit={(name, definition) =>
                onUpdateCustomValue(activeDefinition.id, name, definition)
              }
              rankedValues={rankedValues}
            />
          ) : (
            <NativeCustomValueDeleteConfirmation
              displayName={getValueDisplayName(activeDefinition)}
              isPersistencePending={isPersistencePending}
              persistenceIssue={persistenceIssue}
              onCancel={() => setDeletingValueId(null)}
              onConfirm={() => onDeleteCustomValue(activeDefinition.id)}
            />
          )}
        </KeyboardAvoidingView>
      </MapacheScreen>
    )
  }

  return (
    <MapacheScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-4 pb-4"
      >
        <ScrollView
          className="max-h-1/2 shrink-0 grow-0 border-b-4 border-black"
          contentContainerClassName="gap-2 py-3"
          keyboardShouldPersistTaps="handled"
        >
          <View className="min-w-0">
            <Text
              variant="h1"
              className="text-mapache-vivid-primary-cyan text-left text-2xl font-black uppercase xl:text-4xl"
            >
              {localizedCopy.interfaceCopy.screen.allValues}
            </Text>
            <Text className="text-sm font-bold text-white">
              {localizedCopy.interfaceCopy.screen.activeValues(
                String(rankedValues.length),
              )}
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-between gap-x-3">
            <Text className="font-black text-white">
              {localizedCopy.interfaceCopy.screen.searchAllValues}
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="text-sm font-bold text-white"
            >
              {localizedCopy.interfaceCopy.screen.valuesShown(
                visibleValues.length,
                String(visibleValues.length),
              )}
            </Text>
          </View>
          <TextInput
            accessibilityLabel={
              localizedCopy.interfaceCopy.screen.searchAllValues
            }
            className="min-h-12 border-4 border-black bg-white p-2 text-lg font-bold text-black"
            onChangeText={setSearchQuery}
            placeholder={localizedCopy.interfaceCopy.screen.searchPlaceholder}
            returnKeyType="search"
            value={searchQuery}
          />
        </ScrollView>

        <FlatList
          ref={listRef}
          className="min-h-0 flex-1"
          contentContainerClassName="gap-4 py-5"
          data={visibleValues}
          keyboardShouldPersistTaps="handled"
          keyExtractor={({ definition }) => definition.id}
          ListEmptyComponent={
            <Text
              accessibilityLiveRegion="polite"
              className="border-4 border-black bg-white p-8 text-center text-2xl font-black text-black"
            >
              {localizedCopy.interfaceCopy.screen.noSearchResults}
            </Text>
          }
          ListHeaderComponent={
            <View className="gap-4">
              {persistenceIssue ? (
                <View
                  accessibilityLabel={
                    localizedCopy.interfaceCopy.screen.customSaveFailed
                  }
                  accessibilityRole="alert"
                  className="bg-mapache-vivid-primary-orange gap-2 border-4 border-black p-4"
                >
                  <Text className="text-2xl font-black text-black uppercase">
                    {localizedCopy.interfaceCopy.screen.changeNotSaved}
                  </Text>
                  <Text className="text-base leading-6 font-bold text-black">
                    {localizedCopy.interfaceCopy.screen.draftUnchanged}
                  </Text>
                </View>
              ) : null}
            </View>
          }
          onScrollToIndexFailed={({ averageItemLength, index }) =>
            listRef.current?.scrollToOffset({
              animated: false,
              offset: averageItemLength * index,
            })
          }
          renderItem={({ index, item }) => {
            const priorItem = visibleValues[index - 1]
            const startsTopFive =
              hasComparisons &&
              item.rank <= 5 &&
              (!priorItem || priorItem.rank > 5)
            const startsAllOtherValues =
              hasComparisons &&
              item.rank > 5 &&
              (!priorItem || priorItem.rank <= 5)
            const customDefinition =
              item.definition.kind === "custom" ? item.definition : null

            return (
              <View className="gap-4">
                {startsTopFive ? (
                  <Text
                    accessibilityRole="header"
                    className="border-b-4 border-black py-2 text-lg font-black text-white uppercase"
                  >
                    {localizedCopy.interfaceCopy.screen.topFive}
                  </Text>
                ) : null}
                {startsAllOtherValues ? (
                  <Text
                    accessibilityRole="header"
                    className="border-b-4 border-black py-2 text-lg font-black text-white uppercase"
                  >
                    {localizedCopy.interfaceCopy.screen.remainingValues}
                  </Text>
                ) : null}
                <NativeValueDetailsCard
                  localization={localization}
                  isHighlighted={item.definition.id === highlightedValueId}
                  isPersistencePending={isPersistencePending}
                  onDelete={() => {
                    if (!customDefinition) return
                    setEditingValueId(null)
                    setDeletingValueId(customDefinition.id)
                    setHighlightedValueId(customDefinition.id)
                  }}
                  onEdit={() => {
                    if (!customDefinition) return
                    setDeletingValueId(null)
                    setEditingValueId(customDefinition.id)
                    setHighlightedValueId(customDefinition.id)
                  }}
                  rankedValue={item}
                  showRank={hasComparisons}
                />
              </View>
            )
          }}
        />
        <ScrollView
          className="max-h-1/3 shrink-0 grow-0 border-t-4 border-black"
          contentContainerClassName="flex-row flex-wrap gap-3 pt-3 pb-2"
          keyboardShouldPersistTaps="handled"
        >
          <Button
            size="compact"
            className="basis-readable-action min-w-0 shrink grow"
            disabled={isNavigationBlocked}
            variant="outline"
            onPress={onClose}
          >
            <Text>{localizedCopy.interfaceCopy.dressingRoom.back}</Text>
          </Button>
          <Button
            size="compact"
            className="basis-readable-action min-w-0 shrink grow"
            disabled={isNavigationBlocked}
            onPress={() =>
              onAddCustomValue(
                visibleValues.length === 0 ? searchQuery.trim() : "",
              )
            }
          >
            <Text>{localizedCopy.hub.add}</Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </MapacheScreen>
  )
}
