import { DEFAULT_HEROES99_APPEARANCE } from "@game/data/src/Heroes99Appearance"
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { AppState, type AppStateStatus } from "react-native"
import { getAnimatedStyle } from "react-native-reanimated"
import NativeHeroes99Hero from "@/components/NativeHeroes99Hero"
import { composeNativeHeroes99 } from "@/lib/ComposeNativeHeroes99"

jest.mock("@/lib/ComposeNativeHeroes99", () => ({
  composeNativeHeroes99: jest.fn(),
}))
jest.mock("@/generated/heroes99/Heroes99Assets", () => ({
  HEROES99_ASSETS: { layers: {} },
}))
jest.mock("uniwind", () => ({
  withUniwind: <T,>(component: T) => component,
  useResolveClassNames: () => ({ height: 160, width: 100 }),
}))

const compose = jest.mocked(composeNativeHeroes99)
const strip = {
  source: { uri: "data:image/png;base64,fixture" },
  width: 40,
  height: 80,
}
const hidden = { includeHiddenElements: true }
const image = () => screen.getByTestId("heroes99-idle-image", hidden)
const animation = () => screen.getByTestId("heroes99-idle-strip", hidden)
let changeState: ((state: AppStateStatus) => void) | undefined
const removeListener = jest.fn()
beforeEach(() => {
  jest.useFakeTimers()
  AppState.currentState = "active"
  compose.mockReset().mockResolvedValue(strip)
  jest
    .spyOn(AppState, "addEventListener")
    .mockImplementation((_type, listener) => {
      changeState = listener
      return { remove: removeListener }
    })
})
afterEach(() => {
  jest.useRealTimers()
})

describe("native hero preview", () => {
  it("waits for the composed image, contains its aspect ratio, and pauses in the background", async () => {
    const { unmount, rerender } = await render(
      <NativeHeroes99Hero
        appearance={DEFAULT_HEROES99_APPEARANCE}
        shouldReduceMotion={false}
      />,
    )
    expect(
      screen.getByRole("image", { name: "Your Heroes99 character" }),
    ).toHaveStyle({ width: 100, height: 160 })
    expect(image()).toHaveStyle({ width: 480, height: 160 })
    expect(screen.getByTestId("heroes99-frame-viewport", hidden)).toHaveStyle({
      width: 80,
      height: 160,
    })
    expect(image()).toHaveProp("fadeDuration", 0)
    await act(async () => {
      jest.advanceTimersByTime(400)
    })
    expect(getAnimatedStyle(animation())).toMatchObject({
      transform: [{ translateX: -0 }],
    })
    await fireEvent(image(), "load")
    await act(async () => {
      jest.advanceTimersByTime(400)
    })
    expect(getAnimatedStyle(animation())).toMatchObject({
      transform: [{ translateX: -160 }],
    })
    await act(async () => {
      changeState?.("background")
    })
    await act(async () => {
      jest.advanceTimersByTime(400)
    })
    expect(getAnimatedStyle(animation())).toMatchObject({
      transform: [{ translateX: -0 }],
    })
    await act(async () => {
      changeState?.("active")
    })
    await rerender(
      <NativeHeroes99Hero
        appearance={DEFAULT_HEROES99_APPEARANCE}
        shouldReduceMotion
      />,
    )
    await act(async () => {
      jest.advanceTimersByTime(1200)
    })
    expect(getAnimatedStyle(animation())).toMatchObject({
      transform: [{ translateX: -0 }],
    })
    await unmount()
    expect(removeListener).toHaveBeenCalled()
  })

  it("keeps a readable fallback for failed assets and ignores an aborted composition", async () => {
    compose.mockRejectedValueOnce(new Error("Missing artwork"))
    const { rerender, unmount } = await render(
      <NativeHeroes99Hero
        appearance={DEFAULT_HEROES99_APPEARANCE}
        shouldReduceMotion
      />,
    )
    expect(
      screen.getByRole("image", { name: "Hero preview unavailable" }),
    ).toBeOnTheScreen()
    await rerender(
      <NativeHeroes99Hero
        appearance={{ ...DEFAULT_HEROES99_APPEARANCE, skinPalette: 2 }}
        shouldReduceMotion
      />,
    )
    await fireEvent(image(), "error")
    expect(screen.getByText("Hero preview unavailable")).toBeOnTheScreen()
    let resolve: ((value: typeof strip) => void) | undefined
    compose.mockImplementationOnce(
      () =>
        new Promise((result) => {
          resolve = result
        }),
    )
    await rerender(
      <NativeHeroes99Hero
        appearance={{ ...DEFAULT_HEROES99_APPEARANCE, skinPalette: 3 }}
        shouldReduceMotion
      />,
    )
    const signal = compose.mock.calls.at(-1)![2]
    await unmount()
    expect(signal.aborted).toBe(true)
    await act(async () => {
      resolve?.(strip)
    })
  })
})
