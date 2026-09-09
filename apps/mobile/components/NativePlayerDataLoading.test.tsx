import { describe, expect, it } from "@jest/globals"
import { render, screen } from "@testing-library/react-native"
import NativePlayerDataLoading from "@/components/NativePlayerDataLoading"

describe("Native player data loading", () => {
  it("exposes a polite busy surface without flashing a loading headline", async () => {
    await render(<NativePlayerDataLoading />)

    const loading = screen.getByLabelText("Loading your values…")
    expect(loading).toBeBusy()
    expect(loading.props.accessibilityLiveRegion).toBe("polite")
    expect(screen.queryByText("Loading your values…")).toBeNull()
  })
})
