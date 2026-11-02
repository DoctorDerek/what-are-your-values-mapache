type PaintedAnimalBounds = Pick<DOMRect, "left" | "top" | "right" | "bottom">

declare global {
  interface Window {
    getPaintedAnimalBounds: (combatant: Element) => PaintedAnimalBounds | null
  }
}

export function installPaintedAnimalBounds() {
  window.getPaintedAnimalBounds = (combatant) => {
    const image = combatant.querySelector<HTMLImageElement>(
      '[data-battle-active-clip="true"] img',
    )
    if (!image?.complete || !image.naturalWidth) return null
    const sprite = image.closest<HTMLElement>("[data-frame-count]")!
    const frame = image.parentElement!.getBoundingClientRect()
    const count = Number(sprite.dataset.frameCount)
    const width = image.naturalWidth / count
    const height = image.naturalHeight
    const transform = getComputedStyle(image).transform
    const offset =
      transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m41
    const index = Math.max(
      0,
      Math.min(count - 1, Math.round(-offset / frame.width)),
    )
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")!
    context.drawImage(
      image,
      index * width,
      0,
      width,
      height,
      0,
      0,
      width,
      height,
    )
    const { data } = context.getImageData(0, 0, width, height)
    let left = width,
      right = 0,
      top = height,
      bottom = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!data[(y * width + x) * 4 + 3]) continue
        left = Math.min(left, x)
        right = Math.max(right, x + 1)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y + 1)
      }
    }
    if (right <= left) return null
    const facingLeft = sprite.dataset.facing === "left"
    return {
      left:
        frame.left +
        ((facingLeft ? width - right : left) * frame.width) / width,
      right:
        frame.left +
        ((facingLeft ? width - left : right) * frame.width) / width,
      top: frame.top + (top * frame.height) / height,
      bottom: frame.top + (bottom * frame.height) / height,
    }
  }
}
