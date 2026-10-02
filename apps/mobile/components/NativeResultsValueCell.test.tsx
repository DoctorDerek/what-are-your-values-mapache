import {
  createBattleExitResults,
  projectBattleExitResultsFrame,
} from "@game/machines/src/BattleExitResults"
import { createInitialBattleProfile } from "@game/machines/src/BattleProfile"
import { describe, expect, it, jest } from "@jest/globals"
import { act, render, screen } from "@testing-library/react-native"
import { Text } from "react-native"
import {
  getAnimatedStyle,
  type LayoutAnimationFunction,
} from "react-native-reanimated"
import NativeResultsValueCell from "@/components/NativeResultsValueCell"

function createFrame(elapsedMs: number, settled = false) {
  const entry = createInitialBattleProfile("native-card-travel")
  const progressById = new Map(entry.progressById)
  const valueId = entry.activeDeck.valueIds[74]!
  progressById.set(valueId, {
    ...progressById.get(valueId)!,
    totalXp: 12,
    profileWins: 3,
    profileComparisons: 3,
  })
  const results = createBattleExitResults(entry, { ...entry, progressById })!
  return projectBattleExitResultsFrame(results, elapsedMs, elapsedMs, settled)
    .values[0]
}

const layoutValues: Parameters<LayoutAnimationFunction>[0] = {
  currentOriginX: 0,
  currentOriginY: 9_600,
  currentGlobalOriginX: 0,
  currentGlobalOriginY: 9_600,
  currentWidth: 280,
  currentHeight: 128,
  currentBorderRadius: 0,
  targetOriginX: 0,
  targetOriginY: 0,
  targetGlobalOriginX: 0,
  targetGlobalOriginY: 0,
  targetWidth: 280,
  targetHeight: 128,
  targetBorderRadius: 0,
  windowWidth: 320,
  windowHeight: 640,
}

describe("Native Results card travel", () => {
  it("uses the native layout transition to stage a distant promotion and settles without remounting", async () => {
    jest.useFakeTimers()
    try {
      const item = createFrame(900)
      const rendered = await render(
        <NativeResultsValueCell
          item={item}
          index={0}
          cellKey={item.value.definition.id}
          style={{}}
        >
          <Text>Promoted value</Text>
        </NativeResultsValueCell>,
      )
      const cell = screen.container.queryAll(
        (element) => typeof element.props.layout === "function",
      )[0]
      expect(cell).toBeDefined()
      await act(async () => cell.props.entering(layoutValues))
      await act(async () => jest.advanceTimersByTime(50))
      expect(getAnimatedStyle(cell)).toMatchObject({
        transform: [
          { translateY: expect.closeTo(160 * (1 - item.motion.travel), 0) },
          { translateX: `${item.motion.lateralPercentage}%` },
          { scale: item.motion.scale },
        ],
      })
      await act(async () => cell.props.layout(layoutValues))
      await act(async () => jest.advanceTimersByTime(50))
      expect(getAnimatedStyle(cell)).toMatchObject({
        transform: [{ translateY: expect.closeTo(160, 0) }, {}, {}],
      })
      const identity = screen.getByText("Promoted value")
      await rendered.rerender(
        <NativeResultsValueCell
          item={createFrame(900, true)}
          index={0}
          cellKey={item.value.definition.id}
          style={{}}
        >
          <Text>Promoted value</Text>
        </NativeResultsValueCell>,
      )
      await act(async () => jest.advanceTimersByTime(50))
      expect(screen.getByText("Promoted value")).toBe(identity)
      expect(getAnimatedStyle(cell)).toMatchObject({
        transform: [{ translateY: 0 }, { translateX: "0%" }, { scale: 1 }],
      })
    } finally {
      jest.useRealTimers()
    }
  })
})
