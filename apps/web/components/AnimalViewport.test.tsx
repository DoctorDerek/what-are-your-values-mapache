import { act, render, screen } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import AnimalViewport, { useAnimalViewport } from "@/components/AnimalViewport"

function Portrait({name}: {name:string}) {
  const {ref,near} = useAnimalViewport()
  return <span ref={ref} data-testid={name}>{near ? name : ""}</span>
}
afterEach(()=>vi.unstubAllGlobals())

it("shares one observer and releases decorative work when a portrait leaves", () => {
  const unobserve = vi.fn(), disconnect = vi.fn()
  let update: IntersectionObserverCallback
  const observer = {observe:vi.fn(), unobserve, disconnect}
  const factory = vi.fn(function(callback: IntersectionObserverCallback) {
    update=callback
    return observer
  })
  vi.stubGlobal("IntersectionObserver",factory)
  const renderAnimals=(second:boolean)=><AnimalViewport><Portrait name="Tiger"/>{second && <Portrait name="Squirrel"/>}</AnimalViewport>
  const {rerender,unmount}=render(renderAnimals(true))
  const tiger=screen.getByTestId("Tiger"), squirrel=screen.getByTestId("Squirrel")
  expect(factory).toHaveBeenCalledTimes(1)
  expect(tiger).toBeEmptyDOMElement()
  const intersect=(target:Element,isIntersecting:boolean)=>act(()=>update(
    [{target,isIntersecting} as IntersectionObserverEntry],
    observer as unknown as IntersectionObserver,
  ))
  intersect(tiger,true)
  expect(tiger).toHaveTextContent("Tiger")
  expect(squirrel).toBeEmptyDOMElement()
  intersect(tiger,false)
  expect(tiger).toBeEmptyDOMElement()
  rerender(renderAnimals(false))
  expect(unobserve).toHaveBeenCalledWith(squirrel)
  expect(disconnect).not.toHaveBeenCalled()
  unmount()
  expect(disconnect).toHaveBeenCalledOnce()
})

it("keeps art available in a browser without IntersectionObserver",()=>{
  vi.stubGlobal("IntersectionObserver",undefined)
  render(<AnimalViewport><Portrait name="Tiger"/></AnimalViewport>)
  expect(screen.getByTestId("Tiger")).toHaveTextContent("Tiger")
})
