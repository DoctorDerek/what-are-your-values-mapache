import { describe, expect, it } from "vitest"
import {
  createSeethingSwarmAttentionState,
  updateSeethingSwarmAttention,
} from "./SeethingSwarmAttention"

describe("mounted attention entries", () => {
  it("starts first, retains the choice while attended, advances on reentry and wraps", () => {
    let state = createSeethingSwarmAttentionState()
    for (const expected of [0, 1, 2, 0]) {
      state = updateSeethingSwarmAttention(state, true, true, 3)
      expect(state.alternativeIndex).toBe(expected)
      expect(state.isActive).toBe(true)
      expect(updateSeethingSwarmAttention(state, true, true, 3)).toBe(state)
      state = updateSeethingSwarmAttention(state, false, true, 3)
      expect(state.isActive).toBe(false)
    }
    expect(createSeethingSwarmAttentionState().alternativeIndex).toBe(0)
  })

  it("advances once per completed tap while the same row stays attended", () => {
    const first = updateSeethingSwarmAttention(
      createSeethingSwarmAttentionState(),
      true,
      true,
      2,
      1,
    )
    const second = updateSeethingSwarmAttention(first, true, true, 2, 2)
    expect(second).toMatchObject({ entries: 2, alternativeIndex: 1 })
    expect(updateSeethingSwarmAttention(second, true, true, 2, 2)).toBe(second)
    const reduced = updateSeethingSwarmAttention(second, true, false, 2, 3)
    expect(reduced).toMatchObject({
      entries: 2,
      isActive: false,
      alternativeIndex: 1,
    })
  })

  it("does not consume disabled entries or replay held attention after cancellation", () => {
    let state = updateSeethingSwarmAttention(
      createSeethingSwarmAttentionState(),
      true,
      false,
      2,
    )
    expect(state.entries).toBe(0)
    expect(state.generation).toBe(0)
    expect(updateSeethingSwarmAttention(state, true, true, 2)).toBe(state)
    state = updateSeethingSwarmAttention(state, false, true, 2)
    state = updateSeethingSwarmAttention(state, true, true, 2)
    expect(state.alternativeIndex).toBe(0)
    const activeGeneration = state.generation
    state = updateSeethingSwarmAttention(state, true, false, 2)
    expect(state.isActive).toBe(false)
    expect(state.generation).toBeGreaterThan(activeGeneration)
    expect(updateSeethingSwarmAttention(state, true, true, 2)).toBe(state)
    state = updateSeethingSwarmAttention(state, false, true, 2)
    state = updateSeethingSwarmAttention(state, true, true, 2)
    expect(state.alternativeIndex).toBe(1)
  })
})
