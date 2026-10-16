import {
  CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES,
  CUSTOM_VALUE_NAME_MAX_GRAPHEMES,
  validateCustomValueDraft,
} from "@game/data/src/CustomValueValidation"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import {
  getValueDisplayName,
  type CustomValueDefinition,
  type CustomValueId,
  type ValueId,
} from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { findRankedValueNameMatches } from "@game/data/src/ValueSearch"
import { useMemo, useRef, useState } from "react"
import { TextInput, View } from "react-native"
import NativeCustomValueFieldFeedback from "@/components/NativeCustomValueFieldFeedback"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeCustomValueForm({
  existingCustomValues,
  excludedCustomValueId = null,
  initialDefinition = "",
  initialName = "",
  isPersistencePending,
  mode,
  onCancel,
  onOpenMatchingValue,
  onSubmit,
  rankedValues,
}: {
  readonly existingCustomValues: readonly CustomValueDefinition[]
  readonly excludedCustomValueId?: CustomValueId | null
  readonly initialDefinition?: string
  readonly initialName?: string
  readonly isPersistencePending: boolean
  readonly mode: "add" | "edit"
  readonly onCancel: () => void
  readonly onOpenMatchingValue: (valueId: ValueId) => void
  readonly onSubmit: (name: string, definition: string) => void
  readonly rankedValues: readonly RankedValue[]
}) {
  const localizedCopy = useLocaleCatalog()
  const copy = localizedCopy.interfaceCopy.customValues

  const definitionInputRef = useRef<TextInput>(null)
  const [name, setName] = useState(initialName)
  const [definition, setDefinition] = useState(initialDefinition)
  const [isNameTouched, setIsNameTouched] = useState(false)
  const [isDefinitionTouched, setIsDefinitionTouched] = useState(false)
  const [isConfirmingEdit, setIsConfirmingEdit] = useState(false)
  const validation = useMemo(
    () =>
      validateCustomValueDraft({
        name,
        definition,
        existingCustomValues,
        excludedCustomValueId,
      }),
    [definition, excludedCustomValueId, existingCustomValues, name],
  )
  const matchingValues = useMemo(
    () =>
      findRankedValueNameMatches(rankedValues, validation.name.value).filter(
        ({ definition: matchingDefinition }) =>
          matchingDefinition.id !== excludedCustomValueId,
      ),
    [excludedCustomValueId, rankedValues, validation.name.value],
  )
  const hasChanged =
    validation.name.value !== initialName ||
    validation.definition.value !== initialDefinition
  const canSubmit =
    validation.isValid &&
    !isPersistencePending &&
    (mode === "add" || hasChanged)

  const submitDraft = () => {
    if (!canSubmit) {
      setIsNameTouched(true)
      setIsDefinitionTouched(true)
      return
    }

    if (mode === "edit" && !isConfirmingEdit) {
      setIsConfirmingEdit(true)
      return
    }

    onSubmit(validation.name.value, validation.definition.value)
  }

  return (
    <View
      accessibilityLabel={
        mode === "add"
          ? localizedCopy.interfaceCopy.screen.addCustomValue
          : localizedCopy.interfaceCopy.screen.editValue(initialName)
      }
      className="gap-4 border-4 border-black bg-white p-4 shadow-[6px_6px_0px_0px_#000000]"
    >
      {mode === "add" && (
        <Text className="text-sm leading-5 text-black">{copy.example}</Text>
      )}
      <Text className="text-lg font-black text-black uppercase">
        {localizedCopy.interfaceCopy.screen.valueName}
      </Text>
      <TextInput
        accessibilityLabel={localizedCopy.interfaceCopy.screen.valueName}
        accessibilityHint={mode === "add" ? copy.example : undefined}
        aria-invalid={isNameTouched && validation.name.validationCode !== null}
        autoCapitalize="words"
        className="min-h-14 border-4 border-black bg-white p-3 text-xl font-bold text-black"
        editable={!isPersistencePending}
        onBlur={() => setIsNameTouched(true)}
        onChangeText={(value) => {
          setName(value)
          setIsConfirmingEdit(false)
        }}
        onSubmitEditing={() => definitionInputRef.current?.focus()}
        placeholder={localizedCopy.interfaceCopy.screen.valueNamePlaceholder}
        returnKeyType="next"
        value={name}
      />
      <NativeCustomValueFieldFeedback
        field="name"
        maximumGraphemeCount={CUSTOM_VALUE_NAME_MAX_GRAPHEMES}
        showValidationMessage={
          isNameTouched || validation.name.validationCode === "duplicate_name"
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
          isDefinitionTouched && validation.definition.validationCode !== null
        }
        className="min-h-32 border-4 border-black bg-white p-3 text-xl font-bold text-black"
        editable={!isPersistencePending}
        multiline
        onBlur={() => setIsDefinitionTouched(true)}
        onChangeText={(value) => {
          setDefinition(value)
          setIsConfirmingEdit(false)
        }}
        placeholder={localizedCopy.interfaceCopy.screen.definitionPlaceholder}
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
                  getValueDisplayName(matchingDefinition, localizedCopy.values),
                )}
              </Text>
            </Button>
          ))}
        </View>
      ) : null}

      {isConfirmingEdit ? (
        <View
          accessibilityRole="alert"
          className="bg-mapache-vivid-primary-orange gap-4 border-4 border-black p-4"
        >
          <Text className="text-base leading-6 font-black text-black">
            {localizedCopy.interfaceCopy.screen.customUpdateConsequences}
          </Text>
          <View className="flex-row gap-3">
            <Button
              className="min-w-0 flex-1"
              disabled={isPersistencePending}
              variant="secondary"
              onPress={() => setIsConfirmingEdit(false)}
            >
              <Text>{localizedCopy.interfaceCopy.screen.cancel}</Text>
            </Button>
            <Button
              className="min-w-0 flex-1"
              disabled={!canSubmit}
              onPress={submitDraft}
            >
              <Text>
                {isPersistencePending
                  ? localizedCopy.interfaceCopy.screen.saving
                  : localizedCopy.interfaceCopy.screen.updateValueAction}
              </Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="flex-row gap-3">
          <Button
            className="min-w-0 flex-1"
            disabled={!canSubmit}
            onPress={submitDraft}
          >
            <Text>
              {isPersistencePending
                ? localizedCopy.interfaceCopy.screen.saving
                : mode === "edit"
                  ? localizedCopy.interfaceCopy.screen.reviewUpdate
                  : localizedCopy.interfaceCopy.screen.saveValue}
            </Text>
          </Button>
          <Button
            className="min-w-0 flex-1"
            disabled={isPersistencePending}
            variant="destructive"
            onPress={onCancel}
          >
            <Text>{localizedCopy.interfaceCopy.screen.cancel}</Text>
          </Button>
        </View>
      )}
    </View>
  )
}
