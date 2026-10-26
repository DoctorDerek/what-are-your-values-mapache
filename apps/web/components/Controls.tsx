"use client"

import { getControllerButtonLabel } from "@game/data/src/ControllerControls"
import {
  orderControlBindings,
  type ControlActionId,
} from "@game/data/src/Controls"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { useState, type ComponentProps, type ReactNode } from "react"
import ControllerPrompt from "@/components/ControllerPrompt"
import { ReopenedInformationPanel } from "@/components/InformationPanel"
import { useWebControls } from "@/components/WebControlsProvider"

export default function Controls({
  open,
  onOpenChange,
  onCloseAutoFocus,
}: Readonly<{
  open: boolean
  onOpenChange: (open: boolean) => void
  onCloseAutoFocus?: ComponentProps<
    typeof ReopenedInformationPanel
  >["onCloseAutoFocus"]
}>) {
  const { controls } = useLocaleCatalog().interfaceCopy
  return (
    <ReopenedInformationPanel
      open={open}
      accessibleCloseLabel={controls.closeAction}
      primaryActionLabel={controls.closeAction}
      title={controls.title}
      presentation="reference"
      onCloseAutoFocus={onCloseAutoFocus}
      onOpenChange={onOpenChange}
      onPrimaryAction={() => onOpenChange(false)}
    >
      <ControlsReference />
    </ReopenedInformationPanel>
  )
}

function ControlReferenceRow({
  actionId,
  input,
  description,
}: Readonly<{
  actionId: ControlActionId
  input: ReactNode
  description?: string
}>) {
  const { controls, controlActions } = useLocaleCatalog().interfaceCopy
  const explanation =
    actionId === "stop" ? controls.stopDescription : description
  return (
    <div className="flex flex-wrap items-start gap-3 border-b-2 border-gray-200 py-3 last:border-b-0">
      <dt className="min-w-0 flex-[0.8_1_6rem] text-sm leading-snug font-bold [overflow-wrap:anywhere] text-gray-800">
        {input}
      </dt>
      <dd className="min-w-0 flex-[1.2_1_9rem] text-base leading-snug font-black [overflow-wrap:anywhere]">
        {controlActions[actionId]}
        {explanation && (
          <p className="mt-1 text-sm leading-snug font-medium text-gray-700">
            {explanation}
          </p>
        )}
      </dd>
    </div>
  )
}

function ControlsReference() {
  const copy = useLocaleCatalog().interfaceCopy
  const { controller, inputModality, hasUnsupportedController } =
    useWebControls()
  const [openingInput] = useState(() => ({
    modality: inputModality,
    controllerFamily: controller?.family,
    hasUnsupportedController,
  }))
  const family = openingInput.controllerFamily
  const groups = [...copy.webControls].sort(
    (first, second) =>
      Number(second.id === openingInput.modality) -
      Number(first.id === openingInput.modality),
  )

  return (
    <div className="grid gap-6 text-left text-black">
      {family && (
        <section>
          <h2 className="text-xl leading-tight font-black">
            {copy.controller.title}
          </h2>
          <dl className="grid gap-x-6 xl:grid-cols-2">
            {orderControlBindings(copy.controllerBindings).map((binding) => (
              <ControlReferenceRow
                key={binding.command}
                actionId={binding.actionId}
                description={binding.input}
                input={
                  <span className="flex flex-wrap items-center gap-2">
                    <ControllerPrompt
                      family={family}
                      command={binding.command}
                    />
                    {getControllerButtonLabel(
                      family,
                      binding.command,
                      copy.controllerButtonLabels,
                      copy.controller.navigate,
                    )}
                  </span>
                }
              />
            ))}
            <ControlReferenceRow
              actionId="move-focus"
              input={copy.controller.navigate}
            />
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            {copy.controller.introduction}
          </p>
        </section>
      )}
      {groups.map((group) => (
        <section key={group.id}>
          <h2 className="text-xl leading-tight font-black">{group.title}</h2>
          <dl className="grid gap-x-6 xl:grid-cols-2">
            {orderControlBindings(group.bindings).map((binding) => (
              <ControlReferenceRow
                key={binding.actionId}
                actionId={binding.actionId}
                input={
                  group.id === "keyboard" && binding.actionId !== "stop" ? (
                    <kbd className="inline-block rounded border border-gray-400 bg-gray-100 px-2 py-1 font-sans">
                      {binding.input}
                    </kbd>
                  ) : (
                    binding.input
                  )
                }
              />
            ))}
          </dl>
        </section>
      ))}
      {openingInput.hasUnsupportedController && (
        <p className="text-sm leading-relaxed text-gray-700">
          {copy.controller.unsupported}
        </p>
      )}
    </div>
  )
}
