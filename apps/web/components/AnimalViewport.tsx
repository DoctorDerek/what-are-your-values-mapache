import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

type ObservePortrait = (element: Element, setNear: (near: boolean) => void) => (() => void) | undefined
const Visibility = createContext<ObservePortrait | null>(null)

export default function AnimalViewport({ children }: { children: ReactNode }) {
  const [observe] = useState<ObservePortrait>(() => {
    const subscribers = new Map<Element, (near: boolean) => void>()
    let observer: IntersectionObserver | undefined
    return (element, setNear) => {
      if (typeof IntersectionObserver === "undefined") {
        setNear(true)
        return
      }
      observer ??= new IntersectionObserver((entries) => {
        for (const entry of entries) subscribers.get(entry.target)?.(entry.isIntersecting)
      }, { rootMargin: "96px" })
      subscribers.set(element, setNear)
      observer.observe(element)
      return () => {
        subscribers.delete(element)
        observer?.unobserve(element)
        if (subscribers.size === 0) {
          observer?.disconnect()
          observer = undefined
        }
      }
    }
  })
  return <Visibility value={observe}>{children}</Visibility>
}

export function useAnimalViewport() {
  const observe = useContext(Visibility)
  const [near, setNear] = useState(false)
  const ref = useCallback((element: HTMLSpanElement | null) => {
    if (element) return observe?.(element, setNear)
  }, [observe])
  return { ref, near: observe === null || near }
}
