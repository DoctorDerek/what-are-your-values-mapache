import { projectAllValues } from "@game/data/src/AllValuesProjection"
import type { LocalizationCatalog } from "@game/data/src/LocalizationCatalog"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayName,
  type CustomValueId,
  type ValueId,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
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
  readonly isPersistencePending?: boolean
  readonly onAddCustomValue: (name: string) => void
  readonly onClose: () => void
  readonly onDeleteCustomValue: (valueId: CustomValueId) => void
  readonly onOpenMenu: () => void
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
    isPersistencePending ||
    editingValueId !== null ||
    deletingValueId !== null
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
    if (!highlightedValueId) return

    const highlightedIndex = visibleValues.findIndex(
      ({ definition }) => definition.id === highlightedValueId,
    )
    if (highlightedIndex >= 0)
      listRef.current?.scrollToIndex({
        animated: false,
        index: highlightedIndex,
        viewPosition: 0.25,
      })
  }, [highlightedValueId, visibleValues])

  const openMatchingValue = (valueId: ValueId) => {
    setEditingValueId(null)
    setDeletingValueId(null)
    setSearchQuery("")
    setHighlightedValueId(valueId)
  }

  return (
    <MapacheScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-4 pb-4"
      >
        <View className="gap-2 border-b-4 border-black py-3">
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
            <Text className="font-black text-white">{localizedCopy.interfaceCopy.screen.searchAllValues}</Text>
            <Text accessibilityLiveRegion="polite" className="text-sm font-bold text-white">
              {localizedCopy.interfaceCopy.screen.valuesShown(visibleValues.length, String(visibleValues.length))}
            </Text>
          </View>
          <TextInput
            accessibilityLabel={localizedCopy.interfaceCopy.screen.searchAllValues}
            className="min-h-12 border-4 border-black bg-white p-2 text-lg font-bold text-black"
            onChangeText={setSearchQuery}
            placeholder={localizedCopy.interfaceCopy.screen.searchPlaceholder}
            returnKeyType="search"
            value={searchQuery}
          />
        </View>

        <FlatList
          ref={listRef}
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
            const isEditing = customDefinition?.id === editingValueId
            const isDeleting = customDefinition?.id === deletingValueId

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
                {isEditing && customDefinition ? (
                  <NativeCustomValueForm
                    excludedCustomValueId={customDefinition.id}
                    existingCustomValues={existingCustomValues}
                    initialDefinition={customDefinition.definition}
                    initialName={customDefinition.name}
                    isPersistencePending={isPersistencePending}
                    mode="edit"
                    onCancel={() => setEditingValueId(null)}
                    onOpenMatchingValue={openMatchingValue}
                    onSubmit={(name, definition) =>
                      onUpdateCustomValue(customDefinition.id, name, definition)
                    }
                    rankedValues={rankedValues}
                  />
                ) : null}
                {isDeleting && customDefinition ? (
                  <NativeCustomValueDeleteConfirmation
                    displayName={getValueDisplayName(customDefinition)}
                    isPersistencePending={isPersistencePending}
                    onCancel={() => setDeletingValueId(null)}
                    onConfirm={() => onDeleteCustomValue(customDefinition.id)}
                  />
                ) : null}
              </View>
            )
          }}
        />
        <View className="flex-row flex-wrap gap-3 border-t-4 border-black pt-3 pb-2">
          <Button size="compact" className="basis-readable-action min-w-0 grow shrink" disabled={isNavigationBlocked} variant="outline" onPress={onClose}>
            <Text>{localizedCopy.interfaceCopy.dressingRoom.back}</Text>
          </Button>
          <Button size="compact" className="basis-readable-action min-w-0 grow shrink" disabled={isNavigationBlocked} onPress={() => onAddCustomValue(visibleValues.length === 0 ? searchQuery.trim() : "")}>
            <Text>{localizedCopy.hub.add}</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </MapacheScreen>
  )
}
