import type { PreparedValuesCard, PrepareValuesCard } from "@game/data/src/ValuesCard"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createActor, waitFor } from "xstate"
import { valuesCardShareMachine, VALUES_CARD_PREPARATION_TIMEOUT_MS } from "./ValuesCardShareMachine"

function artifact(): PreparedValuesCard {
  return { format: "gif", previewUri: "card.gif", stillPreviewUri: "card.png", byteLength: 123,
    canShare: true, save: vi.fn(async () => "saved" as const), share: vi.fn(async () => "handed-off" as const), dispose: vi.fn() }
}
afterEach(() => vi.useRealTimers())

describe("values-card share lifecycle", () => {
  it("defaults to GIF, delivers only on request, and releases a replaced artifact", async () => {
    const first = artifact()
    const next = artifact()
    const prepare = vi.fn<PrepareValuesCard>().mockResolvedValueOnce(first).mockResolvedValueOnce(next)
    const actor = createActor(valuesCardShareMachine, { input: { prepare } }).start()
    await waitFor(actor, (state) => state.matches("Ready"))
    expect(prepare).toHaveBeenCalledWith(expect.objectContaining({ format: "gif", includeHero: true }))
    expect(first.save).not.toHaveBeenCalled()
    actor.send({ type: "CARD_SHARE.DELIVER", delivery: "save" })
    await waitFor(actor, (state) => state.context.outcome === "saved")
    actor.send({ type: "CARD_SHARE.FORMAT", format: "png" })
    await waitFor(actor, (state) => state.matches("Ready"))
    expect(first.dispose).toHaveBeenCalledOnce()
    expect(prepare).toHaveBeenLastCalledWith(expect.objectContaining({ format: "png" }))
    actor.send({ type: "CARD_SHARE.CLOSE" })
    expect(next.dispose).toHaveBeenCalledOnce()
    actor.stop()
  })

  it("retains format and hero choice after a preparation failure, and permits retry", async () => {
    const prepare = vi.fn<PrepareValuesCard>().mockRejectedValueOnce(new Error("Missing art")).mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(artifact())
    const actor = createActor(valuesCardShareMachine, { input: { prepare } }).start()
    await waitFor(actor, (state) => state.matches("Failed"))
    actor.send({ type: "CARD_SHARE.HERO", includeHero: false })
    await waitFor(actor, (state) => state.matches("Failed"))
    expect(actor.getSnapshot().context.error).toBe("Offline")
    actor.send({ type: "CARD_SHARE.RETRY" })
    await waitFor(actor, (state) => state.matches("Ready"))
    expect(prepare).toHaveBeenLastCalledWith(expect.objectContaining({ includeHero: false }))
    actor.send({ type: "CARD_SHARE.CLOSE" })
    actor.stop()
  })

  it("keeps the ready file after delivery rejection or user cancellation", async () => {
    const file = { ...artifact(), share: vi.fn(async () => { throw new Error("Sharing unavailable") }) }
    const actor = createActor(valuesCardShareMachine, { input: { prepare: async () => file } }).start()
    await waitFor(actor, (state) => state.matches("Ready"))
    actor.send({ type: "CARD_SHARE.DELIVER", delivery: "share" })
    await waitFor(actor, (state) => state.context.error === "Sharing unavailable")
    expect(actor.getSnapshot().context.artifact).toBe(file)
    actor.send({ type: "CARD_SHARE.DELIVER", delivery: "save" })
    await waitFor(actor, (state) => state.context.outcome === "saved")
    expect(actor.getSnapshot().context.error).toBeNull()
    actor.send({ type: "CARD_SHARE.CLOSE" })
  })

  it("times out an unresponsive renderer and disposes its late result", async () => {
    vi.useFakeTimers()
    let complete: (file: PreparedValuesCard) => void = () => undefined
    const file = artifact()
    const actor = createActor(valuesCardShareMachine, { input: { prepare: () => new Promise((resolve) => { complete = resolve }) } }).start()
    await vi.advanceTimersByTimeAsync(VALUES_CARD_PREPARATION_TIMEOUT_MS)
    expect(actor.getSnapshot().matches("Failed")).toBe(true)
    expect(actor.getSnapshot().context.error).toContain("too long")
    complete(file)
    await vi.advanceTimersByTimeAsync(0)
    expect(file.dispose).toHaveBeenCalledOnce()
    actor.stop()
  })

  it("aborts obsolete preparation without adopting its late file", async () => {
    let complete: (file: PreparedValuesCard) => void = () => undefined
    const discarded = artifact()
    const kept = artifact()
    const prepare = vi.fn<PrepareValuesCard>().mockImplementationOnce(() => new Promise((resolve) => { complete = resolve })).mockResolvedValueOnce(kept)
    const actor = createActor(valuesCardShareMachine, { input: { prepare } }).start()
    const signal = prepare.mock.calls[0][0].signal
    actor.send({ type: "CARD_SHARE.FORMAT", format: "png" })
    await waitFor(actor, (state) => state.matches("Ready"))
    complete(discarded)
    await vi.waitFor(() => expect(discarded.dispose).toHaveBeenCalledOnce())
    expect(signal.aborted).toBe(true)
    expect(actor.getSnapshot().context.artifact).toBe(kept)
    actor.send({ type: "CARD_SHARE.CLOSE" })
  })
})
