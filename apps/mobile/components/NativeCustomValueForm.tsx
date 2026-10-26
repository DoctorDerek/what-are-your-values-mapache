import {
  CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES,
  CUSTOM_VALUE_NAME_MAX_GRAPHEMES,
} from "@game/data/src/CustomValueValidation"
import useCustomValueEdit from "@game/data/src/useCustomValueEdit"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayName,
  type CustomValueDefinition,
  type CustomValueId,
  type ValueId,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { findRankedValueNameMatches } from "@game/data/src/ValueSearch"
import { useEffect, useMemo, useRef } from "react"
import { ScrollView, TextInput, View } from "react-native"
import NativeCustomValueFieldFeedback from "@/components/NativeCustomValueFieldFeedback"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeCustomValueForm({
  existingCustomValues,
  excludedCustomValueId = null,
  initialDefinition = "",
  initialName = "",
  isPersistencePending,
  onCancel,
  onOpenMatchingValue,
  onSubmit,
  rankedValues,
  backRequestId = 0,
  persistenceIssue = null,
}: {
  readonly existingCustomValues: readonly CustomValueDefinition[]
  readonly excludedCustomValueId?: CustomValueId | null
  readonly initialDefinition?: string
  readonly initialName?: string
  readonly isPersistencePending: boolean
  readonly onCancel: () => void
  readonly onOpenMatchingValue: (valueId: ValueId) => void
  readonly onSubmit: (name: string, definition: string) => void
  readonly backRequestId?: number
  readonly persistenceIssue?: string | null
  readonly rankedValues: readonly RankedValue[]
}) {
  const localizedCopy = useLocaleCatalog()

  const definitionInputRef = useRef<TextInput>(null)
  const nameInputRef = useRef<TextInput>(null)
  const editor = useCustomValueEdit({
    initialName,
    initialDefinition,
    existingCustomValues,
    excludedCustomValueId,
    isPersistencePending,
    backRequestId,
    onCancel,
    onSubmit,
  })
  const {
    name,
    definition,
    validation,
    isNameTouched,
    isDefinitionTouched,
    canSubmit,
  } = editor
  useEffect(() => {
    if (!editor.isReviewing) nameInputRef.current?.focus()
  }, [editor.isReviewing])
  const matchingValues = useMemo(
    () =>
      findRankedValueNameMatches(
        rankedValues,
        validation.name.value,
        localizedCopy.values,
      ).filter(
        ({ definition: matchingDefinition }) =>
          matchingDefinition.id !== excludedCustomValueId,
      ),
    [
      excludedCustomValueId,
      rankedValues,
      validation.name.value,
      localizedCopy.values,
    ],
  )
  return (
    <View
      accessibilityLabel={localizedCopy.interfaceCopy.screen.editValue(
        initialName,
      )}
      className="min-h-0 flex-1 border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000000]"
    >
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName="gap-4 p-4"
        keyboardShouldPersistTaps="handled"
      >
        {persistenceIssue && (
          <Text
            accessibilityRole="alert"
            className="bg-mapache-vivid-primary-orange p-3 font-bold text-black"
          >
            {localizedCopy.interfaceCopy.screen.changeNotSaved}{" "}
            {localizedCopy.interfaceCopy.screen.draftUnchanged}
          </Text>
        )}
        <Text
          accessibilityRole="header"
          className="text-2xl font-black text-black uppercase"
        >
          {editor.isReviewing
            ? localizedCopy.interfaceCopy.screen.updateValue(
                validation.name.value,
              )
            : localizedCopy.interfaceCopy.screen.editValue(initialName)}
        </Text>
        {editor.isReviewing ? (
          <View className="gap-4">
            <Text className="text-xl font-black text-black">
              {validation.name.value}
            </Text>
            <Text className="text-lg font-bold text-black">
              “{validation.definition.value}”
            </Text>
            <Text
              accessibilityRole="alert"
              className="bg-mapache-vivid-primary-orange border-4 border-black p-4 text-base font-black text-black"
            >
              {localizedCopy.interfaceCopy.screen.customUpdateConsequences}
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-lg font-black text-black uppercase">
              {localizedCopy.interfaceCopy.screen.valueName}
            </Text>
            <TextInput
              ref={nameInputRef}
              accessibilityLabel={localizedCopy.interfaceCopy.screen.valueName}
              aria-invalid={
                isNameTouched && validation.name.validationCode !== null
              }
              autoCapitalize="words"
              className="min-h-14 border-4 border-black bg-white p-3 text-xl font-bold text-black"
              editable={!isPersistencePending}
              onBlur={() => editor.setIsNameTouched(true)}
              onChangeText={editor.setName}
              onSubmitEditing={() => definitionInputRef.current?.focus()}
              placeholder={
                localizedCopy.interfaceCopy.screen.valueNamePlaceholder
              }
              returnKeyType="next"
              value={name}
            />
            <NativeCustomValueFieldFeedback
              field="name"
              maximumGraphemeCount={CUSTOM_VALUE_NAME_MAX_GRAPHEMES}
              showValidationMessage={
                isNameTouched ||
                validation.name.validationCode === "duplicate_name"
              }
              validation={validation.name}
            />

            <Text className="text-lg font-black text-black uppercase">
              {localizedCopy.interfaceCopy.screen.definition}
            </Text>
            <TextInput
              ref={definitionInputRef}
              accessibilityLabel={localizedCopy.interfaceCopy.screen.definition}
              aria-invalid={
                isDefinitionTouched &&
                validation.definition.validationCode !== null
              }
              className="min-h-32 border-4 border-black bg-white p-3 text-xl font-bold text-black"
              editable={!isPersistencePending}
              multiline
              onBlur={() => editor.setIsDefinitionTouched(true)}
              onChangeText={editor.setDefinition}
              placeholder={
                localizedCopy.interfaceCopy.screen.definitionPlaceholder
              }
              textAlignVertical="top"
              value={definition}
            />
            <NativeCustomValueFieldFeedback
              field="definition"
              maximumGraphemeCount={CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES}
              showValidationMessage={isDefinitionTouched}
              validation={validation.definition}
            />

            {matchingValues.length > 0 ? (
              <View className="bg-mapache-vivid-primary-cyan/20 gap-3 border-4 border-black p-4">
                <Text className="text-lg font-black text-black uppercase">
                  {validation.name.validationCode === "duplicate_name"
                    ? localizedCopy.interfaceCopy.screen.matchingValue
                    : localizedCopy.interfaceCopy.screen.matchingValues}
                </Text>
                {matchingValues.map(({ definition: matchingDefinition }) => (
                  <Button
                    key={matchingDefinition.id}
                    disabled={isPersistencePending}
                    variant="outline"
                    onPress={() => onOpenMatchingValue(matchingDefinition.id)}
                  >
                    <Text>
                      {localizedCopy.interfaceCopy.screen.openValue(
                        getValueDisplayName(
                          matchingDefinition,
                          localizedCopy.values,
                        ),
                      )}
                    </Text>
                  </Button>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      <View className="shrink-0 flex-row flex-wrap gap-3 border-t-4 border-black p-3 pb-5">
        <Button
          size="compact"
          className="basis-readable-action min-w-0 shrink grow"
          disabled={isPersistencePending}
          variant="outline"
          onPress={editor.back}
        >
          <Text>
            {editor.isReviewing
              ? localizedCopy.interfaceCopy.dressingRoom.back
              : localizedCopy.interfaceCopy.screen.cancel}
          </Text>
        </Button>
        <Button
          size="compact"
          className="basis-readable-action min-w-0 shrink grow"
          disabled={!canSubmit}
          onPress={editor.submit}
        >
          <Text>
            {isPersistencePending
              ? localizedCopy.interfaceCopy.screen.saving
              : editor.isReviewing
                ? localizedCopy.interfaceCopy.screen.updateValueAction
                : localizedCopy.interfaceCopy.screen.reviewUpdate}
          </Text>
        </Button>
      </View>
    </View>
  )
}
