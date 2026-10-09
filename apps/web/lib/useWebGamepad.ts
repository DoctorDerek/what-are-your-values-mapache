"use client"

import {
  CONTROLLER_REPEAT_DELAY_MS,
  CONTROLLER_REPEAT_INTERVAL_MS,
  identifyControllerFamily,
  isControllerDirection,
  readControllerCommands,
  type ControllerCommand,
  type ControllerFamily,
} from "@game/data/src/ControllerControls"
import { useEffect, useEffectEvent, useState } from "react"

export type ActiveWebController = Readonly<{
  index: number
  family: ControllerFamily
}>

export default function useWebGamepad({
  onCommand,
  onActivity,
  onDisconnect,
}: {
  onCommand: (command: ControllerCommand) => void
  onActivity: (controller: ActiveWebController) => void
  onDisconnect: (index: number) => void
}) {
  const [hasUnsupportedController, setHasUnsupportedController] =
    useState(false)
  const handleCommand = useEffectEvent(onCommand)
  const handleActivity = useEffectEvent(onActivity)
  const handleDisconnect = useEffectEvent(onDisconnect)

  useEffect(() => {
    if (typeof navigator.getGamepads !== "function") return
    let animationFrame: number | null = null
    let available = true
    let previouslyUnsupported = false
    const previousSamples = new Map<
      number,
      {
        id: string
        commands: ReadonlySet<ControllerCommand>
        repeatAt: number
      }
    >()

    const stop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame)
      animationFrame = null
      previousSamples.clear()
    }

    const poll = (now: number) => {
      animationFrame = null
      if (!available || document.hidden || !document.hasFocus()) return
      let controllers: (Gamepad | null)[]
      try {
        controllers = navigator.getGamepads()
      } catch {
        available = false
        return
      }
      const connected = controllers.filter(
        (controller) => controller?.connected,
      )
      const unsupported = connected.some(
        (controller) => controller?.mapping !== "standard",
      )
      if (unsupported !== previouslyUnsupported) {
        previouslyUnsupported = unsupported
        setHasUnsupportedController(unsupported)
      }
      for (const index of previousSamples.keys()) {
        if (!connected.some((controller) => controller?.index === index)) {
          previousSamples.delete(index)
          handleDisconnect(index)
        }
      }
      let dispatched = false
      for (const controller of connected) {
        if (!controller || controller.mapping !== "standard") continue
        const previous = previousSamples.get(controller.index)
        const commands = readControllerCommands(controller, previous?.commands)
        const next = {
          id: controller.id,
          commands,
          repeatAt: previous?.repeatAt ?? now + CONTROLLER_REPEAT_DELAY_MS,
        }
        previousSamples.set(controller.index, next)
        if (!previous || previous.id !== controller.id) continue
        const pressed = [...commands].find(
          (command) => !previous.commands.has(command),
        )
        const repeated =
          now >= previous.repeatAt
            ? [...commands].find(isControllerDirection)
            : undefined
        if (pressed) next.repeatAt = now + CONTROLLER_REPEAT_DELAY_MS
        else if (repeated) next.repeatAt = now + CONTROLLER_REPEAT_INTERVAL_MS
        const command = pressed ?? repeated
        if (command && !dispatched) {
          dispatched = true
          handleActivity({
            index: controller.index,
            family: identifyControllerFamily(controller.id),
          })
          handleCommand(command)
        }
      }
      if (connected.some((controller) => controller?.mapping === "standard"))
        animationFrame = requestAnimationFrame(poll)
    }

    const resume = () => {
      stop()
      poll(performance.now())
    }
    const handleVisibility = () => (document.hidden ? stop() : resume())
    const handleDisconnection = (event: GamepadEvent) => {
      previousSamples.delete(event.gamepad.index)
      handleDisconnect(event.gamepad.index)
      resume()
    }
    window.addEventListener("gamepadconnected", resume)
    window.addEventListener("gamepaddisconnected", handleDisconnection)
    window.addEventListener("focus", resume)
    window.addEventListener("blur", stop)
    document.addEventListener("visibilitychange", handleVisibility)
    resume()
    return () => {
      stop()
      window.removeEventListener("gamepadconnected", resume)
      window.removeEventListener("gamepaddisconnected", handleDisconnection)
      window.removeEventListener("focus", resume)
      window.removeEventListener("blur", stop)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return { hasUnsupportedController }
}
