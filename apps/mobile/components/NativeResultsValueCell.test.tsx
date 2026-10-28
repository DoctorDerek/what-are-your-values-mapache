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

function createFrame(elapsedMs: number, settled = false, rowIndex = 0) {
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
    .values[rowIndex]
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
  it("stages a displaced card when resuming a visit already in motion", async () => {
    jest.useFakeTimers()
    try {
      const item = createFrame(900, false, 1)
      await render(
        <NativeResultsValueCell item={item} index={1} cellKey={item.value.definition.id} style={{}}>
          <Text>Displaced value</Text>
        </NativeResultsValueCell>,
      )
      const cell = screen.container.queryAll(element => typeof element.props.layout === "function")[0]
      await act(async () => cell.props.entering(layoutValues))
      await act(async () => jest.advanceTimersByTime(100))
      expect(getAnimatedStyle(cell)).toMatchObject({ transform: [
        { translateY: expect.closeTo((item.value.entryRank - item.value.exitRank) * layoutValues.targetHeight * (1 - item.motion.travel), 3) },
        { translateX: `${item.motion.lateralPercentage}%` },
        { scale: item.motion.scale },
      ] })
    } finally { jest.useRealTimers() }
  })
  it("interpolates the final natural frame instead of jumping to rest", async () => {
    jest.useFakeTimers()
    try {
      const item = createFrame(3_600)
      const rendered = await render(
        <NativeResultsValueCell item={item} index={0} cellKey={item.value.definition.id} style={{}}>
          <Text>Landing value</Text>
        </NativeResultsValueCell>,
      )
      const cell = screen.container.queryAll(element => typeof element.props.layout === "function")[0]
      await act(async () => cell.props.entering(layoutValues))
      await act(async () => jest.advanceTimersByTime(100))
      await rendered.rerender(
        <NativeResultsValueCell item={createFrame(3_700)} index={0} cellKey={item.value.definition.id} style={{}}>
          <Text>Landing value</Text>
        </NativeResultsValueCell>,
      )
      await act(async () => jest.advanceTimersByTime(20))
      expect(getAnimatedStyle(cell)).not.toMatchObject({transform: [{translateY: 0}, {translateX: "0%"}, {scale: 1}]})
      await act(async () => jest.advanceTimersByTime(100))
      expect(getAnimatedStyle(cell)).toMatchObject({transform: [{translateY: 0}, {translateX: "0%"}, {scale: 1}]})
    } finally { jest.useRealTimers() }
  })
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
