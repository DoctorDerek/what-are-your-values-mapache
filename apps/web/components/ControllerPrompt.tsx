"use client"

import atlas from "@game/data/assets/controller-prompts/ControllerPrompts.png"
import {
  getControllerButtonLabel,
  type ControllerCommand,
  type ControllerFamily,
} from "@game/data/src/ControllerControls"
import {
  CONTROLLER_PROMPT_COLUMNS,
  CONTROLLER_PROMPT_ROWS,
  getControllerPrompt,
} from "@game/data/src/ControllerPrompts"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import type { CSSProperties } from "react"

export default function ControllerPrompt({
  family,
  command,
}: {
  family: ControllerFamily
  command: ControllerCommand
}) {
  const localization = useLocaleCatalog()
  const prompt = getControllerPrompt(family, command)
  const style: CSSProperties = {
    backgroundImage: `url(${atlas.src})`,
    backgroundSize: `${CONTROLLER_PROMPT_COLUMNS * 100}% ${CONTROLLER_PROMPT_ROWS * 100}%`,
    backgroundPosition: `${(prompt.column / (CONTROLLER_PROMPT_COLUMNS - 1)) * 100}% ${(prompt.row / (CONTROLLER_PROMPT_ROWS - 1)) * 100}%`,
  }
  return (
    <span
      aria-hidden="true"
      title={getControllerButtonLabel(
        family,
        command,
        localization.interfaceCopy.controllerButtonLabels,
        localization.interfaceCopy.controller.navigate,
      )}
      className="inline-block size-8 shrink-0 rounded-sm bg-black align-middle"
      style={style}
    />
  )
}
