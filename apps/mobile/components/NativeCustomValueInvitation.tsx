import {
  CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES,
  CUSTOM_VALUE_NAME_MAX_GRAPHEMES,
} from "@game/data/src/CustomValueValidation"
import useCustomValueAuthoring, {
  type CustomValueAuthoringOptions,
} from "@game/data/src/useCustomValueAuthoring"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { findRankedValueNameMatches } from "@game/data/src/ValueSearch"
import { useEffect, useRef } from "react"
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native"
import NativeCustomValueFieldFeedback from "@/components/NativeCustomValueFieldFeedback"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

export default function NativeCustomValueInvitation({
  saveIssue,
  rankedValues = [],
  ...options
}: CustomValueAuthoringOptions & {
  saveIssue: string | null
  rankedValues?: readonly RankedValue[]
}) {
  const localization = useLocaleCatalog()
  const copy = localization.interfaceCopy.customValues
  const leaveCopy = localization.interfaceCopy.dressingRoom
  const authoring = useCustomValueAuthoring(options)
  const matchingValues = findRankedValueNameMatches(
    rankedValues,
    authoring.editorDraft.name,
    localization.values,
  )
  const nameInput = useRef<TextInput>(null)
  const definitionInput = useRef<TextInput>(null)
  useEffect(() => {
    if (authoring.isOpen) nameInput.current?.focus()
  }, [options.editorRequestId, authoring.isOpen])
  if (!authoring.isActive) return null
  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        accessibilityElementsHidden={authoring.leaveTarget !== null}
        importantForAccessibility={
          authoring.leaveTarget !== null ? "no-hide-descendants" : "auto"
        }
        className="min-h-0 w-full max-w-7xl flex-1 self-center border-4 border-black bg-white"
      >
        <ScrollView
          className="min-h-0 flex-1"
          contentContainerClassName="gap-3 p-3 xl:p-5"
          keyboardShouldPersistTaps="handled"
        >
          <Text
            accessibilityRole="header"
            className="text-xl font-black text-black uppercase"
          >
            {copy.editorTitle}
          </Text>
          <Text className="text-sm text-black">{copy.example}</Text>
          <Text className="font-bold text-black">{copy.name}</Text>
          <TextInput
            ref={nameInput}
            accessibilityLabel={copy.name}
            accessibilityHint={copy.example}
            aria-invalid={
              authoring.editorDraft.name.length > 0 &&
              authoring.editorValidation.name.validationCode !== null
            }
            className="min-h-12 border-4 border-black bg-white p-2 text-base font-bold text-black"
            editable={!authoring.isBusy}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => definitionInput.current?.focus()}
            value={authoring.editorDraft.name}
            onChangeText={(name) =>
              authoring.setEditorDraft({ ...authoring.editorDraft, name })
            }
          />
          <NativeCustomValueFieldFeedback
            field="name"
            maximumGraphemeCount={CUSTOM_VALUE_NAME_MAX_GRAPHEMES}
            showValidationMessage={authoring.editorDraft.name.length > 0}
            validation={authoring.editorValidation.name}
          />
          <Text className="font-bold text-black">{copy.definition}</Text>
          <TextInput
            ref={definitionInput}
            accessibilityLabel={copy.definition}
            aria-invalid={
              authoring.editorDraft.definition.length > 0 &&
              authoring.editorValidation.definition.validationCode !== null
            }
            className="min-h-24 border-4 border-black bg-white p-2 text-base font-bold text-black"
            editable={!authoring.isBusy}
            multiline
            textAlignVertical="top"
            value={authoring.editorDraft.definition}
            onChangeText={(definition) =>
              authoring.setEditorDraft({ ...authoring.editorDraft, definition })
            }
          />
          <NativeCustomValueFieldFeedback
            field="definition"
            maximumGraphemeCount={CUSTOM_VALUE_DEFINITION_MAX_GRAPHEMES}
            showValidationMessage={authoring.editorDraft.definition.length > 0}
            validation={authoring.editorValidation.definition}
          />
          {matchingValues.map(({ definition }) => (
            <Button
              key={definition.id}
              variant="outline"
              size="compact"
              disabled={authoring.isBusy}
              onPress={() => authoring.requestExit({ valueId: definition.id })}
            >
              <Text>
                {localization.interfaceCopy.screen.openValue(
                  getValueDisplayName(definition, localization.values),
                )}
              </Text>
            </Button>
          ))}
          {authoring.drafts.length > 0 && (
            <View className="gap-3 border-t-2 border-black pt-3">
              <Text accessibilityRole="header" className="font-bold text-black">
                {copy.drafts}
              </Text>
              {authoring.drafts.map((draft) => (
                <View key={draft.key} className="gap-2">
                  <Text className="font-bold text-black">{draft.name}</Text>
                  <Text className="text-black">{draft.definition}</Text>
                  <View className="flex-row flex-wrap gap-3">
                    <Button
                      variant="outline"
                      size="compact"
                      disabled={
                        authoring.isBusy || authoring.hasUnfinishedDraft
                      }
                      accessibilityLabel={localization.interfaceCopy.screen.editValue(
                        draft.name,
                      )}
                      onPress={() => authoring.editDraft(draft)}
                    >
                      <Text>{copy.edit}</Text>
                    </Button>
                    <Button
                      variant="outline"
                      size="compact"
                      disabled={
                        authoring.isBusy || authoring.editingKey === draft.key
                      }
                      accessibilityLabel={localization.interfaceCopy.screen.removeDraft(
                        draft.name,
                      )}
                      onPress={() => authoring.removeDraft(draft.key)}
                    >
                      <Text>{copy.remove}</Text>
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View className="gap-3 border-t-2 border-black pt-3">
            <Text className="text-sm text-black">{copy.consequences}</Text>
            <View className="flex-row flex-wrap gap-3">
              <Button
                variant="outline"
                size="compact"
                disabled={
                  authoring.isBusy || !authoring.editorValidation.isValid
                }
                onPress={() => {
                  authoring.queueDraft()
                  nameInput.current?.focus()
                }}
              >
                <Text>{copy.another}</Text>
              </Button>
              <Button
                variant="outline"
                size="compact"
                disabled={authoring.isBusy}
                onPress={authoring.exportData}
              >
                <Text>
                  {authoring.isExporting ? copy.exporting : copy.export}
                </Text>
              </Button>
              {authoring.hasUnfinishedDraft && authoring.drafts.length > 0 && (
                <Button
                  variant="outline"
                  size="compact"
                  disabled={authoring.isBusy}
                  onPress={authoring.discardUnfinished}
                >
                  <Text>{copy.discardUnfinished}</Text>
                </Button>
              )}
              {authoring.hasChanges && (
                <Button
                  variant="outline"
                  size="compact"
                  disabled={authoring.isBusy}
                  onPress={() => authoring.requestExit()}
                >
                  <Text>{leaveCopy.discard}</Text>
                </Button>
              )}
            </View>
            {authoring.hasChanges && (
              <Text className="text-sm text-black">{copy.unsaved}</Text>
            )}
          </View>
        </ScrollView>
        <ScrollView
          className="max-h-1/2 shrink-0 grow-0 border-t-4 border-black"
          contentContainerClassName="gap-3 p-3 pb-5"
          keyboardShouldPersistTaps="handled"
        >
          {options.isSaving && (
            <Text accessibilityLiveRegion="polite" className="text-black">
              {copy.saving}
            </Text>
          )}
          {(saveIssue || authoring.exportIssue) && (
            <Text accessibilityRole="alert" className="font-bold text-black">
              {saveIssue || authoring.exportIssue}
            </Text>
          )}
          <View className="flex-row flex-wrap gap-3">
            <Button
              className="basis-readable-action min-w-0 shrink grow"
              size="compact"
              variant="outline"
              disabled={authoring.isBusy}
              onPress={() => authoring.requestExit()}
            >
              <Text>{copy.back}</Text>
            </Button>
            <Button
              className="basis-readable-action min-w-0 shrink grow"
              size="compact"
              disabled={authoring.isBusy || !authoring.canApply}
              onPress={authoring.saveAdditions}
            >
              <Text>{copy.apply}</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={authoring.leaveTarget !== null}
        transparent
        onShow={Keyboard.dismiss}
        onRequestClose={authoring.keepEditing}
      >
        <View
          accessibilityViewIsModal
          className="flex-1 justify-center bg-black/70 p-4"
        >
          <View className="max-h-full border-4 border-black bg-white">
            <ScrollView
              className="shrink"
              contentContainerClassName="gap-4 p-4"
              keyboardShouldPersistTaps="handled"
            >
              <Text
                accessibilityRole="header"
                className="text-xl font-black text-black"
              >
                {leaveCopy.keepTitle}
              </Text>
              <Button
                size="compact"
                variant="outline"
                disabled={authoring.isBusy}
                onPress={() =>
                  authoring.discardAndExit(authoring.leaveTarget ?? "home")
                }
              >
                <Text>{leaveCopy.discard}</Text>
              </Button>
            </ScrollView>
            <View className="shrink-0 flex-row flex-wrap gap-3 border-t-4 border-black p-3 pb-5">
              <Button
                size="compact"
                className="basis-readable-action min-w-0 flex-1"
                variant="secondary"
                onPress={authoring.keepEditing}
              >
                <Text>{leaveCopy.keepEditing}</Text>
              </Button>
              <Button
                size="compact"
                className="basis-readable-action min-w-0 flex-1"
                disabled={!authoring.canApply || authoring.isBusy}
                onPress={authoring.saveAdditions}
              >
                <Text>{leaveCopy.saveReturn}</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}
