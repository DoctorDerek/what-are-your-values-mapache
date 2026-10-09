"use client"

import {
  isControllerDirection,
  type ControllerCommand,
} from "@game/data/src/ControllerControls"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react"
import useWebControlHintInputModality from "@/lib/useWebControlHintInputModality"
import useWebGamepad, { type ActiveWebController } from "@/lib/useWebGamepad"
import { moveWebControllerFocus } from "@/lib/WebControllerFocus"

type ControllerHandler = Readonly<{
  priority: number
  handle: (command: ControllerCommand) => boolean
}>

const WebControlsContext = createContext<{
  controller: ActiveWebController | null
  inputModality: "keyboard" | "touch-pointer"
  hasUnsupportedController: boolean
  registerControllerHandler: ((handler: ControllerHandler) => () => void) | null
}>({
  controller: null,
  inputModality: "keyboard",
  hasUnsupportedController: false,
  registerControllerHandler: null,
})

export function useWebControls() {
  return useContext(WebControlsContext)
}

export function useWebControllerActions(
  priority: number,
  handle: ControllerHandler["handle"],
) {
  const { registerControllerHandler } = useWebControls()
  const handleCommand = useEffectEvent(handle)
  useEffect(() => {
    const handler = {
      priority,
      handle: (command: ControllerCommand) => handleCommand(command),
    }
    return registerControllerHandler?.(handler)
  }, [registerControllerHandler, priority])
}

export default function WebControlsProvider({
  children,
}: {
  children: ReactNode
}) {
  const handlers = useRef(new Set<ControllerHandler>())
  const registerControllerHandler = useCallback(
    (handler: ControllerHandler) => {
      handlers.current.add(handler)
      return () => {
        handlers.current.delete(handler)
      }
    },
    [],
  )
  const [controller, setController] = useState<ActiveWebController | null>(null)
  const inputModality = useWebControlHintInputModality(() =>
    setController(null),
  )
  const { hasUnsupportedController } = useWebGamepad({
    onActivity: (next) =>
      setController((current) =>
        current?.index === next.index && current.family === next.family
          ? current
          : next,
      ),
    onDisconnect: (index) =>
      setController((current) => (current?.index === index ? null : current)),
    onCommand: (command) => {
      if (isControllerDirection(command) || command === "confirm") {
        moveWebControllerFocus(command)
        return
      }
      for (const handler of [...handlers.current].sort(
        (a, b) => b.priority - a.priority,
      )) {
        if (handler.handle(command)) break
      }
    },
  })
  return (
    <WebControlsContext
      value={{
        controller,
        inputModality,
        hasUnsupportedController,
        registerControllerHandler,
      }}
    >
      <div
        className="contents data-[controller=true]:[&_:focus]:outline-4 data-[controller=true]:[&_:focus]:outline-offset-2 data-[controller=true]:[&_:focus]:outline-white"
        data-controller={controller !== null}
      >
        {children}
      </div>
    </WebControlsContext>
  )
}
