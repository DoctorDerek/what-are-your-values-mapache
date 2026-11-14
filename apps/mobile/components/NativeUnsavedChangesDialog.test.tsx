import { afterEach, describe, expect, it, jest } from "@jest/globals"
import { fireEvent, render, screen } from "@testing-library/react-native"
import { Platform, Text } from "react-native"
import NativeUnsavedChangesDialog from "@/components/NativeUnsavedChangesDialog"

afterEach(() => {
  jest.restoreAllMocks()
})

describe("native unsaved-change focus restoration", () => {
  it.each(["android", "ios"] as const)(
    "restores focus only after the %s close acknowledgment",
    async (platform) => {
      jest.replaceProperty(Platform, "OS", platform)
      const onKeepEditing = jest.fn()
      const onRestoreFocus = jest.fn()
      const props = {
        onKeepEditing,
        onRestoreFocus,
        titleClassName: "text-xl",
        discardAction: <Text>Discard action</Text>,
        primaryActions: <Text>Safe actions</Text>,
      }
      const { container } = await render(
        <NativeUnsavedChangesDialog {...props} visible />,
      )
      const [modal] = container.queryAll((node) => node.type === "Modal")
      expect(modal).toBeDefined()
      const acknowledgeNativeDismissal: unknown = modal.props.onDismiss
      if (typeof acknowledgeNativeDismissal !== "function")
        throw new Error(
          "The native Modal must expose its dismissal acknowledgment",
        )
      expect(onRestoreFocus).not.toHaveBeenCalled()
      await fireEvent(modal, "requestClose")
      expect(onKeepEditing).toHaveBeenCalledTimes(1)
      expect(onRestoreFocus).not.toHaveBeenCalled()
      await screen.rerender(
        <NativeUnsavedChangesDialog {...props} visible={false} />,
      )
      if (platform === "ios") {
        expect(onRestoreFocus).not.toHaveBeenCalled()
        acknowledgeNativeDismissal()
      }
      expect(onRestoreFocus).toHaveBeenCalledTimes(1)
    },
  )
})
