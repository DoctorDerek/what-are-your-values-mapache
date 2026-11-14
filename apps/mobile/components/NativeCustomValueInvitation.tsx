import CustomValueDraftEditorView from "@game/ui/src/CustomValueDraftEditorView"
import type {
  CustomValueDraftEditorParts,
  CustomValueInvitationParts,
} from "@game/ui/src/CustomValueInvitationParts"
import CustomValueInvitationView, {
  type CustomValueInvitationProps,
} from "@game/ui/src/CustomValueInvitationView"
import { cx } from "classix"
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native"
import NativeUnsavedChangesDialog from "@/components/NativeUnsavedChangesDialog"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"

const editorParts: CustomValueDraftEditorParts = {
  Form: ({ children, className }) => (
    <View className={className}>{children}</View>
  ),
  Heading: ({ children, className }) => (
    <Text accessibilityRole="header" className={cx("text-black", className)}>
      {children}
    </Text>
  ),
  Example: ({ children, className }) => (
    <Text className={cx("text-black", className)}>{children}</Text>
  ),
  FieldGroup: ({ children, className }) => (
    <View className={className}>{children}</View>
  ),
  Label: ({ children, className }) => (
    <Text className={cx("text-black", className)}>{children}</Text>
  ),
  Control: ({
    field,
    label,
    hint,
    value,
    invalid,
    disabled,
    inputRef,
    onChange,
    onNext,
  }) => (
    <TextInput
      ref={inputRef}
      accessibilityLabel={label}
      accessibilityHint={field === "name" ? hint : undefined}
      aria-invalid={invalid}
      className={cx(
        "border-4 border-black bg-white p-2 text-base font-bold text-black",
        field === "name" ? "min-h-12" : "min-h-24",
      )}
      editable={!disabled}
      autoCapitalize={field === "name" ? "words" : "sentences"}
      returnKeyType={field === "name" ? "next" : undefined}
      onSubmitEditing={field === "name" ? onNext : undefined}
      multiline={field === "definition"}
      textAlignVertical="top"
      value={value}
      onChangeText={onChange}
    />
  ),
  Feedback: ({ children, className }) => (
    <View className={className}>{children}</View>
  ),
  FeedbackCounter: ({ children }) => (
    <Text className="text-sm font-bold text-black">{children}</Text>
  ),
  FeedbackError: ({ children }) => (
    <Text
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="min-w-0 flex-1 text-right text-sm font-black text-red-700"
    >
      {children}
    </Text>
  ),
}

const parts: CustomValueInvitationParts = {
  Surface: ({ children, footer, confirmation, isConfirming }) => (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        accessibilityElementsHidden={isConfirming}
        importantForAccessibility={
          isConfirming ? "no-hide-descendants" : "auto"
        }
        className="min-h-0 w-full max-w-7xl flex-1 self-center"
      >
        <ScrollView
          className="min-h-0 flex-1"
          contentContainerClassName="grow gap-4"
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
      {confirmation}
    </>
  ),
  Panel: ({ children, className }) => (
    <View className={className}>{children}</View>
  ),
  Editor: (props) => (
    <CustomValueDraftEditorView {...props} parts={editorParts} />
  ),
  MatchingValues: ({ children, className, label }) => (
    <ScrollView
      accessibilityLabel={label}
      className="mt-3 max-h-[min(12rem,35vh)] shrink-0 grow-0"
      contentContainerClassName={className}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      {children}
    </ScrollView>
  ),
  Section: ({ children, className, label }) => (
    <View accessibilityLabel={label} className={className}>
      {children}
    </View>
  ),
  Heading: ({ children, className }) => (
    <Text accessibilityRole="header" className={cx("text-black", className)}>
      {children}
    </Text>
  ),
  DraftList: ({ children }) => <View className="gap-3">{children}</View>,
  Draft: ({ children, name, definition }) => (
    <View className="gap-2 py-2">
      <Text className="font-bold text-black">{name}</Text>
      <Text className="text-black">{definition}</Text>
      {children}
    </View>
  ),
  ActionRow: ({ children, className }) => (
    <View className={className}>{children}</View>
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
      variant={variant === "link" ? "outline" : variant}
      size="compact"
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onPress={onActivate}
      className={cx(
        location === "footer" && "basis-readable-action min-w-0 shrink grow",
        location === "decision" && "basis-readable-action min-w-0 flex-1",
      )}
    >
      <Text>{children}</Text>
    </Button>
  ),
  NoticeList: ({ children }) => (
    <View role="list" className="gap-3">
      {children}
    </View>
  ),
  Notice: ({ children }) => (
    <View role="listitem" accessible className="flex-row items-start gap-2">
      <Text accessible={false} className="text-sm leading-relaxed text-black">
        •
      </Text>
      <Text className="min-w-0 flex-1 text-sm leading-relaxed text-black">
        {children}
      </Text>
    </View>
  ),
  Footer: ({ children }) => (
    <ScrollView
      className="max-h-1/2 shrink-0 grow-0 border-4 border-black bg-white"
      contentContainerClassName="gap-3 p-3 pb-5"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ),
  Status: ({ children, isError }) => (
    <Text
      accessibilityRole={isError ? "alert" : undefined}
      accessibilityLiveRegion={isError ? undefined : "polite"}
      className={cx("text-black", isError && "font-bold")}
    >
      {children}
    </Text>
  ),
  Confirmation: ({ open, onKeepEditing, onRestoreFocus, discard, actions }) => (
    <NativeUnsavedChangesDialog
      visible={open}
      onShow={Keyboard.dismiss}
      onKeepEditing={onKeepEditing}
      titleClassName="text-xl"
      discardAction={discard}
      primaryActions={actions}
      onRestoreFocus={onRestoreFocus}
    />
  ),
}

export default function NativeCustomValueInvitation(
  props: CustomValueInvitationProps,
) {
  return <CustomValueInvitationView {...props} parts={parts} />
}
