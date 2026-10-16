import { introductionCopy } from "@game/data/src/IntroductionCopy"
import LocaleProvider from "@game/utils/src/LocaleContext"
import { describe, expect, it, jest } from "@jest/globals"
import { render, screen, userEvent } from "@testing-library/react-native"
import NativeIntroduction from "@/components/NativeIntroduction"

describe("NativeIntroduction", () => {
  it("renders Mexican Spanish guidance and lets the player start", async () => {
    const onComplete = jest.fn()
    const user = userEvent.setup()
    await render(
      <LocaleProvider locale="es-MX">
        <NativeIntroduction
          locale="es-MX"
          shouldReduceMotion
          onComplete={onComplete}
          onLocaleChange={jest.fn()}
        />
      </LocaleProvider>,
    )
    expect(
      screen.getByRole("heading", {
        name: "¿Cuáles son tus valores, Mapache?",
      }),
    ).toBeOnTheScreen()
    expect(screen.getByText("Un juego de Mapachito")).toBeOnTheScreen()
    await user.press(screen.getByRole("button", { name: "Empezar" }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
  it("presents the approved first-run guidance and completes explicitly", async () => {
    const onComplete = jest.fn()
    const user = userEvent.setup()
    await render(
      <NativeIntroduction onComplete={onComplete} onLocaleChange={jest.fn()} />,
    )

    expect(
      screen.getByRole("heading", { name: introductionCopy.title }),
    ).toBeOnTheScreen()
    expect(screen.getByText(introductionCopy.tagline)).toBeOnTheScreen()
    expect(screen.getByText(introductionCopy.body[0])).toBeOnTheScreen()
    expect(screen.getByText(introductionCopy.body.at(-1)!)).toBeOnTheScreen()
    expect(screen.queryByText("Recovered player data.")).toBeNull()

    await user.press(
      screen.getByRole("button", { name: introductionCopy.startAction }),
    )

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("announces an optional first-run notice without changing the Start action", async () => {
    const onComplete = jest.fn()
    const user = userEvent.setup()
    await render(
      <NativeIntroduction
        onLocaleChange={jest.fn()}
        notice="Recovered player data."
        onComplete={onComplete}
      />,
    )

    expect(screen.getByText("Recovered player data.")).toHaveProp(
      "accessibilityLiveRegion",
      "polite",
    )

    await user.press(
      screen.getByRole("button", { name: introductionCopy.startAction }),
    )

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
