import { expect, type Locator } from "@playwright/test"

export async function expectCompleteBattleTextReachable(text: Locator) {
  for (const edge of ["start", "end"] as const) {
    const evidence = await text.evaluate((element, edge) => {
      const surfaceBounds = element
        .closest('[role="region"]')!
        .getBoundingClientRect()
      const verticalClippingSurfaces: {
        element: Element
        canScroll: boolean
      }[] = []
      for (
        let ancestor: Element | null = element;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        const overflow = getComputedStyle(ancestor).overflowY
        if (["auto", "scroll", "hidden", "clip"].includes(overflow))
          verticalClippingSurfaces.push({
            element: ancestor,
            canScroll: overflow === "auto" || overflow === "scroll",
          })
      }
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
      const textNodes: Node[] = []
      while (walker.nextNode()) {
        if (walker.currentNode.textContent?.length)
          textNodes.push(walker.currentNode)
      }
      const node = edge === "start" ? textNodes[0]! : textNodes.at(-1)!
      const offset = edge === "start" ? 0 : node.textContent!.length - 1
      const character = document.createRange()
      character.setStart(node, offset)
      character.setEnd(node, offset + 1)
      for (const { element: surface, canScroll } of verticalClippingSurfaces) {
        if (!canScroll) continue
        const bounds = surface.getBoundingClientRect()
        const beforeScroll = character.getBoundingClientRect()
        surface.scrollBy({
          top:
            edge === "start"
              ? beforeScroll.top - bounds.top - surface.clientTop
              : beforeScroll.bottom -
                bounds.top -
                surface.clientTop -
                surface.clientHeight,
          behavior: "instant",
        })
      }
      const characterBounds = character.getBoundingClientRect()
      const cardBounds = element
        .closest("label, aside")!
        .getBoundingClientRect()
      const clippingBounds = verticalClippingSurfaces.map(
        ({ element: surface }) => {
          const top = surface.getBoundingClientRect().top + surface.clientTop
          return { top, bottom: top + surface.clientHeight }
        },
      )
      const visibleTextRects = textNodes.flatMap((textNode) =>
        [...textNode.textContent!.matchAll(/\S+/gu)].flatMap((match) => {
          const textRun = document.createRange()
          textRun.setStart(textNode, match.index)
          textRun.setEnd(textNode, match.index + match[0].length)
          return [...textRun.getClientRects()]
        }),
      )
      return {
        edgeIsVisible:
          characterBounds.top >=
            Math.max(0, ...clippingBounds.map(({ top }) => top)) - 1 &&
          characterBounds.bottom <=
            Math.min(
              innerHeight,
              ...clippingBounds.map(({ bottom }) => bottom),
            ) +
              1,
        allLinesFitWidth: visibleTextRects.every(
          (line) =>
            line.left >= Math.max(surfaceBounds.left, cardBounds.left) &&
            line.right <= Math.min(innerWidth, cardBounds.right),
        ),
      }
    }, edge)
    expect(evidence, `${edge} of ${await text.textContent()}`).toEqual({
      edgeIsVisible: true,
      allLinesFitWidth: true,
    })
  }
}
