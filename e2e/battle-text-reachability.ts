import { expect, type Locator } from "@playwright/test"

export async function expectCompleteBattleTextReachable(text: Locator) {
  for (const edge of ["start", "end"] as const) {
    const evidence = await text.evaluate((element, edge) => {
      const surface = element.closest('[aria-label="Battle choices"]')!
      const surfaceBounds = surface.getBoundingClientRect()
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
      const beforeScroll = character.getBoundingClientRect()
      surface.scrollBy({
        top:
          edge === "start"
            ? beforeScroll.top - surfaceBounds.top - surface.clientTop
            : beforeScroll.bottom -
              surfaceBounds.top -
              surface.clientTop -
              surface.clientHeight,
        behavior: "instant",
      })
      const characterBounds = character.getBoundingClientRect()
      const cardBounds = element
        .closest("button, aside")!
        .getBoundingClientRect()
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
            Math.max(0, surfaceBounds.top + surface.clientTop) - 1 &&
          characterBounds.bottom <=
            Math.min(
              innerHeight,
              surfaceBounds.top + surface.clientTop + surface.clientHeight,
            ) +
              1,
        allLinesFitWidth: visibleTextRects.every(
          (line) =>
            line.left >= Math.max(surfaceBounds.left, cardBounds.left) &&
            line.right <= Math.min(innerWidth, cardBounds.right),
        ),
        textIsNotClipped:
          getComputedStyle(element).overflowY === "visible" ||
          element.scrollHeight <= element.clientHeight + 1,
      }
    }, edge)
    expect(evidence, `${edge} of ${await text.textContent()}`).toEqual({
      edgeIsVisible: true,
      allLinesFitWidth: true,
      textIsNotClipped: true,
    })
  }
}
