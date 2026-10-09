import { describe, expect, it } from "@jest/globals"
import { render } from "@testing-library/react-native"
import NativeControllerPrompt from "@/components/NativeControllerPrompt"

describe("native shared controller prompt", () => {
  it("crops the shared atlas by detected family without adding spoken glyph labels", async () => {
    const { toJSON, rerender } = await render(
      <NativeControllerPrompt family="playstation" command="confirm" />,
    )
    expect(toJSON()).toMatchObject({
      props: { accessibilityElementsHidden: true },
      children: [
        { props: { style: { width: 192, height: 256, left: -64, top: -64 } } },
      ],
    })
    await rerender(
      <NativeControllerPrompt family="steam-deck" command="menu" />,
    )
    expect(toJSON()).toMatchObject({
      children: [
        {
          props: { style: { width: 192, height: 256, left: -128, top: -192 } },
        },
      ],
    })
  })
})
