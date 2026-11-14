"use client"

import useCustomValueAuthoring, {
  type CustomValueAuthoringOptions,
} from "@game/data/src/useCustomValueAuthoring"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { getValueDisplayName } from "@game/data/src/Value"
import type { RankedValue } from "@game/data/src/ValueRanking"
import { findRankedValueNameMatches } from "@game/data/src/ValueSearch"
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
    ActionRow,
    Action,
    NoticeList,
    Notice,
    Footer,
    Status,
    Confirmation,
  } = parts
  if (!authoring.isActive) return null
  return (
    <Surface
      title={screenCopy.addOwnValues}
      disabled={authoring.isBusy}
      isConfirming={authoring.leaveTarget !== null}
      onBack={authoring.back}
      footer={
        <Footer>
          {options.isSaving && <Status>{copy.saving}</Status>}
          {issue && <Status isError>{issue}</Status>}
          <ActionRow className="flex flex-row flex-wrap gap-3">
            <Action
              variant="outline"
              location="footer"
              disabled={authoring.isBusy}
              onActivate={() => authoring.requestExit()}
            >
              {copy.back}
            </Action>
            <Action
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
          onKeepEditing={authoring.keepEditing}
          onRestoreFocus={focusName}
          discard={
            <Action
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
                variant="secondary"
                location="decision"
                disabled={false}
                onActivate={authoring.keepEditing}
              >
                {leaveCopy.keepEditing}
              </Action>
              <Action
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
            className="gap-2 p-[4px]"
          >
            {matchingValues.map(({ definition }) => (
              <Action
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
            <Heading className="font-bold">{copy.drafts}</Heading>
            <DraftList>
              {authoring.drafts.map((draft) => (
                <Draft
                  key={draft.key}
                  name={draft.name}
                  definition={draft.definition}
                >
                  <ActionRow className="flex flex-row flex-wrap gap-3">
                    <Action
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
              variant="link"
              location="inline"
              disabled={authoring.isBusy}
              onActivate={authoring.exportData}
            >
              {authoring.isExporting ? copy.exporting : copy.export}
            </Action>
            {authoring.hasUnfinishedDraft && authoring.drafts.length > 0 && (
              <Action
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
                variant="link"
                location="inline"
                disabled={authoring.isBusy}
                onActivate={() => authoring.requestExit()}
              >
                {leaveCopy.discard}
              </Action>
            )}
          </ActionRow>
          <NoticeList>
            {notices.map((notice) => (
              <Notice key={notice}>{notice}</Notice>
            ))}
          </NoticeList>
        </Section>
      </Panel>
    </Surface>
  )
}
