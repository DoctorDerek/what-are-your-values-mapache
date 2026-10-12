import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals"
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native"
import NativeFirstArrivalRaccoon from "@/components/NativeFirstArrivalRaccoon"

beforeEach(() => {
  jest.useFakeTimers()
})
afterEach(async () => {
  await cleanup()
  jest.useRealTimers()
})

const image = () =>
  screen.getByTestId("seething-swarm-animal-raccoonpack-image", {
    includeHiddenElements: true,
  })

describe("native first-arrival crossing", () => {
  it("waits for decoded art, plays one delayed crossing, and signals completion", async () => {
    const complete = jest.fn()
    await render(<NativeFirstArrivalRaccoon onComplete={complete} />)
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    expect(complete).not.toHaveBeenCalled()
    await fireEvent(image(), "load")
    await act(async () => {
      jest.advanceTimersByTime(900)
    })
    expect(complete).not.toHaveBeenCalled()
    await act(async () => {
      jest.advanceTimersByTime(3300)
    })
    expect(complete).toHaveBeenCalledTimes(1)
  })

  it("finishes missing artwork gracefully and cancels an active crossing on exit", async () => {
    const complete = jest.fn()
    const { unmount } = await render(
      <NativeFirstArrivalRaccoon onComplete={complete} />,
    )
    await fireEvent(image(), "error")
    expect(complete).toHaveBeenCalledTimes(1)
    await unmount()
    complete.mockClear()
    const active = await render(
      <NativeFirstArrivalRaccoon onComplete={complete} />,
    )
    await fireEvent(image(), "load")
    await act(async () => {
      jest.advanceTimersByTime(1200)
    })
    await active.unmount()
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    expect(complete).not.toHaveBeenCalled()
  })
})
