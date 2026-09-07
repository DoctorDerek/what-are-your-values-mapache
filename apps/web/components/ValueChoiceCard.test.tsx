import { CANONICAL_VALUES } from "@game/data/src/CanonicalValues"
import {
  getValueDisplayDefinition,
  getValueDisplayName,
} from "@game/data/src/Value"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ValueChoiceCard } from "@/components/ValueChoiceCard"

describe("animal card attention", () => {
  it("combines pointer and actual focus without selecting or repeating attention", () => {
    const value = CANONICAL_VALUES[0]
    const onActivate = vi.fn()
    const props = {
      position: "first" as const,
      value,
      level: 1,
      focusedId: null,
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
    const animalCaption = screen.getByText(`↑ ${getValueDisplayName(value)}`)
    expect(animalCaption).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(animalCaption, { pointerType: "mouse" })
    expect(screen.getByText("Animal alert")).toBeVisible()
    expect(onActivate).not.toHaveBeenCalled()
    fireEvent.pointerLeave(animalCaption)
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(animalCaption, { pointerType: "touch" })
    expect(screen.getByText("Animal resting")).toBeVisible()
    fireEvent.pointerEnter(animalCaption, { pointerType: "mouse" })
    fireEvent.pointerCancel(animalCaption)
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
    fireEvent.click(animalCaption)
    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(onActivate).toHaveBeenLastCalledWith(value.id)
    rerender(<ValueChoiceCard {...props} isEnabled={false} />)
    fireEvent.click(animalCaption)
    fireEvent.focus(choice)
    expect(screen.getByText("Animal resting")).toBeVisible()
    const readingRegion = screen.getByRole("region")
    expect(readingRegion).toHaveAttribute("tabindex", "0")
    expect(readingRegion).toContainElement(choice)
    expect(choice.querySelector("[tabindex]")).toBeNull()
    fireEvent.focus(readingRegion)
    fireEvent.keyDown(readingRegion, { key: " " })
    fireEvent.keyDown(readingRegion, { key: "Enter" })
    fireEvent.keyDown(readingRegion, { key: "ArrowDown" })
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
          focusedId={value.id}
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
