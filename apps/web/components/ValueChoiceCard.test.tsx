import { CANONICAL_VALUES } from "@game/data/src/CanonicalValues"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ValueChoiceCard } from "@/components/ValueChoiceCard"

describe("animal card attention", () => {
  it("removes absent input hints while retaining one value heading and level", () => {
    const props = {
      position: "first" as const,
      value: CANONICAL_VALUES[0],
      level: 12,
      winnerId: null,
      isEnabled: true,
      isAnimating: false,
      onActivate: vi.fn(),
      onFocus: vi.fn(),
    }
    const { rerender } = render(
      <ValueChoiceCard {...props} controlHint="[1 / A]" />,
    )
    expect(screen.getByText("[1 / A]")).toBeVisible()
    rerender(<ValueChoiceCard {...props} controlHint={null} />)
    expect(screen.queryByText("[1 / A]")).not.toBeInTheDocument()
    expect(screen.getAllByRole("heading")).toHaveLength(1)
    expect(screen.getByText("Level 12")).toBeVisible()
    fireEvent.click(screen.getByRole("button"))
    expect(props.onActivate).toHaveBeenCalledExactlyOnceWith(props.value.id)
  })
  it("preserves long value copy and selection without inserting text break markers", () => {
    const value = CANONICAL_VALUES.find(
      (value) => value.englishName === "Diligence",
    )!
    const onActivate = vi.fn()
    render(
      <ValueChoiceCard
        position="first"
        value={value}
        level={1}
        winnerId={null}
        isEnabled
        isAnimating={false}
        controlHint={null}
        onActivate={onActivate}
        onFocus={vi.fn()}
      />,
    )
    const choice = screen.getByRole("button", { name: /^Choose / })
    expect(screen.getByRole("heading").textContent).toBe(value.englishName)
    expect(choice).toHaveAccessibleDescription(`“${value.sourceDefinition}”`)
    expect(choice.textContent).not.toMatch(/[\u00ad\u200b]/u)
    fireEvent.click(choice)
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(value.id)
  })
  it("combines pointer and actual focus without selecting or repeating attention", () => {
    const value = CANONICAL_VALUES[0]
    const onActivate = vi.fn()
    const props = {
      position: "first" as const,
      value,
      level: 1,
      winnerId: null,
      isEnabled: true,
      isAnimating: false,
      controlHint: null,
      onActivate,
      onFocus: vi.fn(),
      combatant: (isAttended: boolean) => (
        <span>{isAttended ? "Animal alert" : "Animal resting"}</span>
      ),
    }
    const { rerender } = render(<ValueChoiceCard {...props} />)
    const choice = screen.getByRole("button", { name: /^Choose / })
    expect(screen.getAllByRole("button")).toHaveLength(1)
    expect(choice).toHaveAccessibleDescription(
      `“${getValueDisplayDefinition(value)}”`,
    )
    expect(screen.getAllByText(getValueDisplayName(value))).toHaveLength(1)
    expect(screen.getByText("Level 1")).toBeVisible()
    const animal = screen.getByText("Animal resting")
    expect(animal.closest("label")).toHaveAttribute("aria-hidden", "true")
    expect(animal.closest("label")).toHaveAttribute("for", choice.id)
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(animal, { pointerType: "mouse" })
    expect(screen.getByText("Animal alert")).toBeVisible()
    expect(onActivate).not.toHaveBeenCalled()
    fireEvent.pointerLeave(animal)
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(animal, { pointerType: "touch" })
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(animal, { pointerType: "mouse" })
    fireEvent.pointerCancel(animal)
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(choice, { pointerType: "mouse" })
    expect(screen.getByText("Animal alert")).toBeVisible()
    fireEvent.focus(choice)
    fireEvent.pointerLeave(choice)
    expect(screen.getByText("Animal alert")).toBeVisible()
    expect(onActivate).not.toHaveBeenCalled()
    fireEvent.blur(choice)
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(choice, { pointerType: "mouse" })
    fireEvent.pointerCancel(choice)
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(choice, { pointerType: "touch" })
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.click(choice)
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(value.id)
    fireEvent.click(animal)
    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(onActivate).toHaveBeenLastCalledWith(value.id)
    rerender(<ValueChoiceCard {...props} isEnabled={false} />)
    fireEvent.click(animal)
    fireEvent.focus(choice)
    expect(screen.getByText("Animal resting")).toBeVisible()
    expect(screen.queryByRole("region")).not.toBeInTheDocument()
    expect(choice.querySelector("[tabindex]")).toBeNull()
    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(choice).toBeDisabled()
    rerender(<ValueChoiceCard {...props} combatant={undefined} />)
    expect(screen.queryByText("Animal resting")).toBeNull()
    expect(choice).toHaveAccessibleDescription(
      `“${getValueDisplayDefinition(value)}”`,
    )
    fireEvent.click(choice)
    expect(onActivate).toHaveBeenCalledTimes(3)
    expect(onActivate).toHaveBeenLastCalledWith(value.id)
  })

  it.each(["first", "second"] as const)(
    "keeps the %s animal reward associated with its disabled value choice",
    (position) => {
      const value = CANONICAL_VALUES[0]
      const onActivate = vi.fn()
      render(
        <ValueChoiceCard
          position={position}
          value={value}
          level={4}
          winnerId={value.id}
          isEnabled={false}
          isAnimating
          controlHint={null}
          onActivate={onActivate}
          onFocus={vi.fn()}
          reward={{
            valueId: value.id,
            label: "+1 XP · Level 4",
            progressLabel: "1/4 XP toward Level 5",
            progressPercentage: 25,
          }}
          combatant={(isAttended, reward) => (
            <span>
              {isAttended ? "Animal alert" : "Animal resting"}
              {reward}
            </span>
          )}
        />,
      )
      const choice = screen.getByRole("button", { name: /^Choose .*Level 4/ })
      const reward = screen.getByText("+1 XP · Level 4")
      expect(choice).toBeDisabled()
      expect(screen.getAllByRole("button")).toHaveLength(1)
      expect(reward).toBeVisible()
      expect(reward).toHaveAttribute("title", "1/4 XP toward Level 5")
      fireEvent.pointerEnter(reward, { pointerType: "mouse" })
      fireEvent.focus(choice)
      fireEvent.pointerCancel(reward)
      fireEvent.click(reward)
      expect(screen.getByText("Animal resting")).toBeVisible()
      expect(onActivate).not.toHaveBeenCalled()
    },
  )
})
