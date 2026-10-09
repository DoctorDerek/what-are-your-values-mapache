import type {
  ControllerCommand,
  ControllerFamily,
} from "@game/data/src/ControllerControls"
import {
  CONTROLLER_PROMPT_COLUMNS,
  CONTROLLER_PROMPT_ROWS,
  getControllerPrompt,
} from "@game/data/src/ControllerPrompts"
import { Image, View } from "react-native"

const PROMPT_DISPLAY_SIZE = 32

export default function NativeControllerPrompt({
  family,
  command,
}: {
  family: ControllerFamily
  command: ControllerCommand
}) {
  const prompt = getControllerPrompt(family, command)
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="size-8 shrink-0 overflow-hidden rounded-sm bg-black"
    >
      <Image
        source={require("@game/data/assets/controller-prompts/ControllerPrompts.png")}
        className="absolute"
        style={{
          width: CONTROLLER_PROMPT_COLUMNS * PROMPT_DISPLAY_SIZE,
          height: CONTROLLER_PROMPT_ROWS * PROMPT_DISPLAY_SIZE,
          left: -prompt.column * PROMPT_DISPLAY_SIZE,
          top: -prompt.row * PROMPT_DISPLAY_SIZE,
        }}
      />
    </View>
  )
}
