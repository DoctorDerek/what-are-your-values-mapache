declare global {
  interface Window {
    getVisibleTextBounds: (
      text: Element,
    ) => Pick<DOMRect, "left" | "right" | "top" | "bottom">
  }
}

export function getRenderedTextLines(element: Element): string[] {
  const rows = new Map<number, string>()
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const text = walker.currentNode
    for (let index = 0; index < text.textContent!.length; index += 1) {
      const character = text.textContent![index]
      if (!/\p{L}/u.test(character)) continue
      const range = document.createRange()
      range.setStart(text, index)
      range.setEnd(text, index + 1)
      const bounds = range.getBoundingClientRect()
      const row = Math.round(bounds.top)
      rows.set(row, (rows.get(row) ?? "") + character)
    }
  }
  return [...rows.values()]
}

export function installVisibleTextBounds(): void {
  window.getVisibleTextBounds = (text) => {
    let { left, right, top, bottom } = text.getBoundingClientRect()
    for (
      let ancestor = text.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const style = getComputedStyle(ancestor)
      const clip = ancestor.getBoundingClientRect()
      if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX)) {
        left = Math.max(left, clip.left)
        right = Math.min(right, clip.right)
      }
      if (["auto", "scroll", "hidden", "clip"].includes(style.overflowY)) {
        top = Math.max(top, clip.top)
        bottom = Math.min(bottom, clip.bottom)
      }
    }
    return { left, right, top, bottom }
  }
}
