"use client"

import useCustomValueAuthoring, {
  type CustomValueAuthoringOptions,
} from "@game/data/src/useCustomValueAuthoring"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { findRankedValueNameMatches } from "@game/data/src/ValueSearch"
import Action from "@game/ui/src/CustomValueAuthoringAction"
import type {
  AuthoringInputHandle,
  CustomValueInvitationParts,
} from "@game/ui/src/CustomValueInvitationParts"
import { useEffect, useRef, type ReactNode } from "react"

export type CustomValueInvitationProps = CustomValueAuthoringOptions & {
  saveIssue: string | null
  rankedValues?: readonly RankedValue[]
  header?: ReactNode
}

export default function CustomValueInvitationView({
  parts,
  saveIssue,
  rankedValues = [],
  header,
  ...options
}: CustomValueInvitationProps & { parts: CustomValueInvitationParts }) {
  const localization = useLocaleCatalog()
  const copy = localization.interfaceCopy.customValues
  const leaveCopy = localization.interfaceCopy.dressingRoom
  const screenCopy = localization.interfaceCopy.screen
  const authoring = useCustomValueAuthoring(options)
  const nameInput = useRef<AuthoringInputHandle | null>(null)
  const definitionInput = useRef<AuthoringInputHandle | null>(null)
  const focusName = () => nameInput.current?.focus()
  const restoreAuthoringFocus = () => {
    if (nameInput.current?.isFocused() || definitionInput.current?.isFocused())
      return
    focusName()
  }
  useEffect(() => {
    if (authoring.isOpen) nameInput.current?.focus()
  }, [options.editorRequestId, authoring.isOpen])
  const notices = authoring.hasChanges
    ? [...copy.consequences, copy.unsaved]
    : copy.consequences
  const matchingValues = findRankedValueNameMatches(
    rankedValues,
    authoring.editorDraft.name,
    localization.values,
  )
  const issue = saveIssue || authoring.exportIssue
  const {
    Surface,
    Panel,
    Editor,
    MatchingValues,
    Section,
    Heading,
    DraftList,
    Draft,
    DraftTitle,
    DraftDefinition,
    ActionRow,
    NoticeList,
    Notice,
    Footer,
    Status,
    Confirmation,
  } = parts
  if (!authoring.isActive) return null
  return (
    <Surface
      className="text-mapache-vivid-dark flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col self-center"
      contentClassName="flex grow flex-col gap-4"
      title={screenCopy.addOwnValues}
      disabled={authoring.isBusy}
      isConfirming={authoring.leaveTarget !== null}
      onBack={authoring.back}
      footer={
        <Footer
          className="max-h-1/2 shrink-0 border-4 border-black bg-white"
          contentClassName="p-[12px] pb-[20px] xl:px-5"
        >
          {options.isSaving && (
            <Status className="text-mapache-vivid-dark">{copy.saving}</Status>
          )}
          {issue && (
            <Status isError className="text-mapache-vivid-dark mb-3 font-bold">
              {issue}
            </Status>
          )}
          <ActionRow className="flex flex-row flex-wrap gap-3">
            <Action
              Control={parts.Action}
              variant="outline"
              location="footer"
              disabled={authoring.isBusy}
              onActivate={() => authoring.requestExit()}
            >
              {copy.back}
            </Action>
            <Action
              Control={parts.Action}
              variant="default"
              location="footer"
              disabled={authoring.isBusy || !authoring.canApply}
              onActivate={authoring.saveAdditions}
            >
              {copy.apply}
            </Action>
          </ActionRow>
        </Footer>
      }
      confirmation={
        <Confirmation
          open={authoring.leaveTarget !== null}
          title={leaveCopy.keepTitle}
          frameClassName="max-w-2xl border-4 border-black bg-white shadow-[12px_12px_0px_0px_#000000] xl:max-w-3xl"
          titleClassName="text-4xl leading-tight font-black wrap-anywhere uppercase xl:text-5xl"
          readingClassName="flex flex-col gap-4 p-[16px]"
          footerClassName="flex shrink-0 flex-row flex-wrap gap-[12px] border-t-4 border-black p-[12px] pb-[20px]"
          onKeepEditing={authoring.keepEditing}
          onRestoreFocus={restoreAuthoringFocus}
          discard={
            <Action
              Control={parts.Action}
              variant="outline"
              location="discard"
              disabled={authoring.isBusy}
              onActivate={() =>
                authoring.discardAndExit(authoring.leaveTarget ?? "home")
              }
            >
              {leaveCopy.discard}
            </Action>
          }
          actions={
            <>
              <Action
                Control={parts.Action}
                variant="secondary"
                location="decision"
                disabled={false}
                onActivate={authoring.keepEditing}
              >
                {leaveCopy.keepEditing}
              </Action>
              <Action
                Control={parts.Action}
                variant="default"
                location="decision"
                disabled={!authoring.canApply || authoring.isBusy}
                onActivate={authoring.saveAdditions}
              >
                {leaveCopy.saveReturn}
              </Action>
            </>
          }
        />
      }
    >
      {header}
      <Panel className="flex min-w-0 grow flex-col border-4 border-b-0 border-black bg-white p-3 xl:p-5">
        <Editor
          draft={authoring.editorDraft}
          validation={authoring.editorValidation}
          disabled={authoring.isBusy}
          nameInputRef={(input) => {
            nameInput.current = input
          }}
          definitionInputRef={(input) => {
            definitionInput.current = input
          }}
          onNext={() => definitionInput.current?.focus()}
          onChange={authoring.setEditorDraft}
          onSubmit={authoring.saveAdditions}
        />
        {matchingValues.length > 0 && (
          <MatchingValues
            label={screenCopy.matchingValues}
            className="mt-3 max-h-[min(12rem,35vh)]"
            contentClassName="flex flex-col gap-2 p-1"
          >
            {matchingValues.map(({ definition }) => (
              <Action
                Control={parts.Action}
                key={definition.id}
                variant="link"
                location="matching"
                disabled={authoring.isBusy}
                onActivate={() =>
                  authoring.requestExit({ valueId: definition.id })
                }
              >
                {screenCopy.openValue(
                  getValueDisplayName(definition, localization.values),
                )}
              </Action>
            ))}
          </MatchingValues>
        )}
        {authoring.drafts.length > 0 && (
          <Section
            label={copy.drafts}
            className="mt-4 flex flex-col gap-3 border-t-2 border-black pt-3"
          >
            <Heading className="text-mapache-vivid-dark font-bold">
              {copy.drafts}
            </Heading>
            <DraftList className="flex flex-col">
              {authoring.drafts.map((draft, index) => (
                <Draft
                  key={draft.key}
                  className={
                    index === 0 ? "py-2" : "border-t border-black/20 py-2"
                  }
                >
                  <DraftTitle className="text-mapache-vivid-dark font-bold wrap-anywhere">
                    {draft.name}
                  </DraftTitle>
                  <DraftDefinition className="text-mapache-vivid-dark wrap-anywhere">
                    {draft.definition}
                  </DraftDefinition>
                  <ActionRow className="flex flex-row flex-wrap gap-3">
                    <Action
                      Control={parts.Action}
                      variant="link"
                      location="inline"
                      disabled={
                        authoring.isBusy || authoring.hasUnfinishedDraft
                      }
                      accessibilityLabel={screenCopy.editValue(draft.name)}
                      onActivate={() => authoring.editDraft(draft)}
                    >
                      {copy.edit}
                    </Action>
                    <Action
                      Control={parts.Action}
                      variant="link"
                      location="inline"
                      disabled={
                        authoring.isBusy || authoring.editingKey === draft.key
                      }
                      accessibilityLabel={screenCopy.removeDraft(draft.name)}
                      onActivate={() => authoring.removeDraft(draft.key)}
                    >
                      {copy.remove}
                    </Action>
                  </ActionRow>
                </Draft>
              ))}
            </DraftList>
          </Section>
        )}
        <Section
          label={screenCopy.saveCustomValues}
          className="mt-4 flex flex-col gap-3 border-t-2 border-black pt-3"
        >
          <ActionRow className="flex flex-row flex-wrap gap-3">
            <Action
              Control={parts.Action}
              variant="outline"
              location="inline"
              disabled={authoring.isBusy || !authoring.editorValidation.isValid}
              onActivate={() => {
                authoring.queueDraft()
                focusName()
              }}
            >
              {copy.another}
            </Action>
            <Action
              Control={parts.Action}
              variant="link"
              location="inline"
              disabled={authoring.isBusy}
              onActivate={authoring.exportData}
            >
              {authoring.isExporting ? copy.exporting : copy.export}
            </Action>
            {authoring.hasUnfinishedDraft && authoring.drafts.length > 0 && (
              <Action
                Control={parts.Action}
                variant="link"
                location="inline"
                disabled={authoring.isBusy}
                onActivate={authoring.discardUnfinished}
              >
                {copy.discardUnfinished}
              </Action>
            )}
            {authoring.hasChanges && (
              <Action
                Control={parts.Action}
                variant="link"
                location="inline"
                disabled={authoring.isBusy}
                onActivate={() => authoring.requestExit()}
              >
                {leaveCopy.discard}
              </Action>
            )}
          </ActionRow>
          <NoticeList className="flex flex-col gap-3">
            {notices.map((notice) => (
              <Notice
                key={notice}
                className="text-mapache-vivid-dark text-sm leading-relaxed"
              >
                {notice}
              </Notice>
            ))}
          </NoticeList>
        </Section>
      </Panel>
    </Surface>
  )
}
