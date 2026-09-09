import { CANONICAL_VALUES } from "@game/data/src/CanonicalValues"
import { CUSTOM_VALUE_NAME_MAX_GRAPHEMES } from "@game/data/src/CustomValueValidation"
import {
  createCustomValueId,
  getValueDisplayDefinition,
  getValueDisplayName,
  type CustomValueDefinition,
} from "@game/data/src/Value"
import { getValueChoiceAccessibilityLabel } from "@game/machines/src/BattleAccessibilityPresentation"
import { describe, expect, it, jest } from "@jest/globals"
import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native"
import type { ComponentProps } from "react"
import { Text } from "react-native"
import NativeValueChoiceCard from "@/components/NativeValueChoiceCard"

const selfAcceptance = CANONICAL_VALUES.find(
  ({ englishName }) => englishName === "Self-Acceptance",
)

if (!selfAcceptance)
  throw new Error("Self-Acceptance is missing from the canonical catalog")

const maximumWidthCustomValueName = "W".repeat(CUSTOM_VALUE_NAME_MAX_GRAPHEMES)
const maximumWidthCustomValue = Object.freeze({
  kind: "custom",
  id: createCustomValueId("custom:00000000-0000-4000-8000-000000000001"),
  name: maximumWidthCustomValueName,
  definition: "A deliberately wide name at the supported Custom Value limit.",
  creationOrdinal: 1,
  createdAt: "2026-08-28T00:00:00.000Z",
  updatedAt: "2026-08-28T00:00:00.000Z",
}) satisfies CustomValueDefinition

describe("NativeValueChoiceCard", () => {
  it("combines supported hover and focus responses without requiring an extra press", async () => {
    const onActivate = jest.fn()
    await render(
      <NativeValueChoiceCard
        position="first"
        value={selfAcceptance}
        level={1}
        controlHint={null}
        winnerId={null}
        isEnabled
        isAnimating={false}
        onActivate={onActivate}
        combatant={(isAttended) => (
          <Text>{isAttended ? "Animal alert" : "Animal resting"}</Text>
        )}
      />,
    )
    const choice = screen.getByRole("button", { name: /^Choose / })
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(choice).toHaveProp(
      "accessibilityHint",
      getValueDisplayDefinition(selfAcceptance),
    )
    expect(
      screen.getAllByText(getValueDisplayName(selfAcceptance), {
        includeHiddenElements: true,
      }),
    ).toHaveLength(1)
    const animal = screen.getByText("Animal resting", {
      includeHiddenElements: true,
    })
    await fireEvent(animal, "pointerEnter", {
      nativeEvent: { pointerType: "mouse" },
    })
    expect(
      screen.getByText("Animal alert", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    expect(onActivate).not.toHaveBeenCalled()
    await fireEvent(animal, "pointerLeave")
    expect(
      screen.getByText("Animal resting", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    await fireEvent(animal, "pointerEnter", {
      nativeEvent: { pointerType: "touch" },
    })
    expect(
      screen.getByText("Animal resting", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    await fireEvent(animal, "pointerEnter", {
      nativeEvent: { pointerType: "mouse" },
    })
    await fireEvent(animal, "pointerCancel")
    expect(
      screen.getByText("Animal resting", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    await fireEvent(choice, "hoverIn")
    expect(
      screen.getByText("Animal alert", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    await fireEvent(choice, "focus")
    await fireEvent(choice, "hoverOut")
    expect(
      screen.getByText("Animal alert", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    expect(onActivate).not.toHaveBeenCalled()
    await fireEvent(choice, "blur")
    expect(
      screen.getByText("Animal resting", { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    await fireEvent.press(choice)
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(onActivate).toHaveBeenCalledWith(selfAcceptance.id)
    await fireEvent.press(animal)
    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(onActivate).toHaveBeenLastCalledWith(selfAcceptance.id)
  })

  it.each(["first", "second"] as const)(
    "keeps the %s animal reward associated with its disabled value choice",
    async (position) => {
      const onActivate = jest.fn()
      await render(
        <NativeValueChoiceCard
          position={position}
          value={selfAcceptance}
          level={4}
          controlHint={null}
          winnerId={selfAcceptance.id}
          isEnabled={false}
          isAnimating
          onActivate={onActivate}
          reward={{
            valueId: selfAcceptance.id,
            label: "+1 XP · Level 4",
            progressLabel: "1/4 XP toward Level 5",
            progressPercentage: 25,
          }}
          combatant={(isAttended, reward) => (
            <>
              <Text>{isAttended ? "Animal alert" : "Animal resting"}</Text>
              {reward}
            </>
          )}
        />,
      )
      const choice = screen.getByRole("button", { name: /^Choose .*Level 4/ })
      const reward = screen.getByText("+1 XP · Level 4", {
        includeHiddenElements: true,
      })
      expect(choice).toBeDisabled()
      expect(choice).toHaveProp("accessibilityState", {
        disabled: true,
        selected: true,
      })
      expect(screen.getAllByRole("button")).toHaveLength(1)
      expect(reward).toBeOnTheScreen()
      expect(screen.queryByText("+1 XP · Level 4")).toBeNull()
      await fireEvent(choice, "focus")
      await fireEvent.press(reward)
      await fireEvent.press(choice)
      expect(
        screen.getByText("Animal resting", { includeHiddenElements: true }),
      ).toBeOnTheScreen()
      expect(onActivate).not.toHaveBeenCalled()
    },
  )

  it("preserves complete canonical and maximum-length Custom Value names", async () => {
    const user = userEvent.setup()
    const cases = Object.freeze([
      {
        position: "first",
        value: selfAcceptance,
        level: 4,
        controlHint: "Tap",
      },
      {
        position: "second",
        value: maximumWidthCustomValue,
        level: 37,
        controlHint: "B",
      },
    ] as const)

    for (const choiceCase of cases) {
      const onActivate = jest.fn()
      const props = {
        ...choiceCase,
        winnerId: null,
        isEnabled: true,
        isAnimating: false,
        onActivate,
        combatant: () => <Text>Animal</Text>,
      } satisfies ComponentProps<typeof NativeValueChoiceCard>
      const { unmount, rerender } = await render(
        <NativeValueChoiceCard {...props} />,
      )
      const displayName = getValueDisplayName(choiceCase.value)
      const name = screen.getByText(displayName)
      const choice = screen.getByRole("button", {
        name: getValueChoiceAccessibilityLabel(choiceCase),
      })

      expect(name).toHaveProp("lineBreakStrategyIOS", "push-out")
      expect(name).toHaveProp("textBreakStrategy", "balanced")
      expect(name.props.numberOfLines).toBeUndefined()
      expect(name.props.ellipsizeMode).toBeUndefined()
      expect(choice).toHaveProp(
        "accessibilityHint",
        getValueDisplayDefinition(choiceCase.value),
      )

      await user.press(choice)
      expect(onActivate).toHaveBeenCalledTimes(1)
      expect(onActivate).toHaveBeenCalledWith(choiceCase.value.id)

      const animal = screen.getByText("Animal", { includeHiddenElements: true })
      await fireEvent.press(animal)
      expect(onActivate).toHaveBeenCalledTimes(2)
      expect(onActivate).toHaveBeenLastCalledWith(choiceCase.value.id)
      await rerender(<NativeValueChoiceCard {...props} isEnabled={false} />)
      await fireEvent.press(animal)
      await fireEvent.press(choice)
      expect(onActivate).toHaveBeenCalledTimes(2)

      await rerender(<NativeValueChoiceCard {...props} combatant={undefined} />)
      expect(
        screen.queryByText("Animal", { includeHiddenElements: true }),
      ).toBeNull()
      expect(choice).toHaveProp(
        "accessibilityHint",
        getValueDisplayDefinition(choiceCase.value),
      )
      await user.press(choice)
      expect(onActivate).toHaveBeenCalledTimes(3)
      expect(onActivate).toHaveBeenLastCalledWith(choiceCase.value.id)

      await unmount()
    }
  })
})
