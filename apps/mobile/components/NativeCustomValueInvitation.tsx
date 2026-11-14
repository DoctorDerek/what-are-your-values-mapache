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
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native"
import NativeSeethingSwarmAnimal from "@/components/NativeSeethingSwarmAnimal"
import NativeUnsavedChangesDialog from "@/components/NativeUnsavedChangesDialog"
import { Text } from "@/components/ui/text"

const editorParts: CustomValueDraftEditorParts = {
  Form: ({ children, className }) => (
    <View className={className}>{children}</View>
  ),
  Heading: ({ children, className }) => (
    <Text accessibilityRole="header" className={className}>
      {children}
    </Text>
  ),
  Example: ({ children, className }) => (
    <Text className={className}>{children}</Text>
  ),
  FieldGroup: ({ children, className }) => (
    <View className={className}>{children}</View>
  ),
  Label: ({ children, className }) => (
    <Text className={className}>{children}</Text>
  ),
  Control: ({
    className,
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
      className={className}
      editable={!disabled}
      autoCapitalize={field === "name" ? "words" : "sentences"}
      returnKeyType={field === "name" ? "next" : undefined}
      onSubmitEditing={field === "name" ? onNext : undefined}
      multiline={field === "definition"}
      numberOfLines={field === "definition" ? 2 : 1}
      textAlignVertical="top"
      value={value}
      onChangeText={onChange}
    />
  ),
  Feedback: ({ children, className }) => (
    <View className={className}>{children}</View>
  ),
  FeedbackCounter: ({ children, className }) => (
    <Text className={className}>{children}</Text>
  ),
  FeedbackError: ({ children, className }) => (
    <Text
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className={className}
    >
      {children}
    </Text>
  ),
}

const parts: CustomValueInvitationParts<number> = {
  Surface: ({
    children,
    footer,
    confirmation,
    isConfirming,
    className,
    contentClassName,
  }) => (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        accessibilityElementsHidden={isConfirming}
        importantForAccessibility={
          isConfirming ? "no-hide-descendants" : "auto"
        }
        className={className}
      >
        <ScrollView
          className="min-h-0 flex-1"
          contentContainerClassName={contentClassName}
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
    <View accessibilityLabel={label} className={className}>
      {children}
    </View>
  ),
  MatchingAnimal: NativeSeethingSwarmAnimal,
  Section: ({ children, className, label }) => (
    <View accessibilityLabel={label} className={className}>
      {children}
    </View>
  ),
  Heading: ({ children, className }) => (
    <Text accessibilityRole="header" className={className}>
      {children}
    </Text>
  ),
  DraftList: ({ children, className }) => (
    <View role="list" className={className}>
      {children}
    </View>
  ),
  Draft: ({ children, className }) => (
    <View role="listitem" className={className}>
      {children}
    </View>
  ),
  DraftTitle: ({ children, className, accessibilityLabel }) => (
    <Text
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel}
      android_hyphenationFrequency="normal"
      className={className}
    >
      {children}
    </Text>
  ),
  DraftDefinition: ({ children, className }) => (
    <Text className={className}>{children}</Text>
  ),
  ActionRow: ({ children, className }) => (
    <View className={className}>{children}</View>
  ),
  Action: ({
    children,
    className,
    textClassName,
    disabled,
    accessibilityLabel,
    onActivate,
  }) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onPress={onActivate}
      className={className}
    >
      <Text className={textClassName}>{children}</Text>
    </Pressable>
  ),
  NoticeList: ({ children, className }) => (
    <View role="list" className={className}>
      {children}
    </View>
  ),
  Notice: ({ children, className }) => (
    <View role="listitem" accessible className="flex-row items-start gap-2">
      <Text accessible={false} className={className}>
        •
      </Text>
      <Text className={cx("min-w-0 flex-1", className)}>{children}</Text>
    </View>
  ),
  Footer: ({ children, className, contentClassName }) => (
    <ScrollView
      className={cx("grow-0", className)}
      contentContainerClassName={contentClassName}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ),
  Status: ({ children, className, isError }) => (
    <Text
      accessibilityRole={isError ? "alert" : undefined}
      accessibilityLiveRegion={isError ? undefined : "polite"}
      className={className}
    >
      {children}
    </Text>
  ),
  Confirmation: ({
    open,
    onKeepEditing,
    onRestoreFocus,
    title,
    frameClassName,
    titleClassName,
    readingClassName,
    footerClassName,
    discard,
    actions,
  }) => (
    <NativeUnsavedChangesDialog
      visible={open}
      onShow={Keyboard.dismiss}
      onKeepEditing={onKeepEditing}
      frameClassName={frameClassName}
      titleClassName={titleClassName}
      readingClassName={readingClassName}
      footerClassName={footerClassName}
      title={title}
      discardAction={discard}
      primaryActions={actions}
      onRestoreFocus={onRestoreFocus}
    />
  ),
}

export default function NativeCustomValueInvitation(
  props: CustomValueInvitationProps<number>,
) {
  return <CustomValueInvitationView {...props} parts={parts} />
}
