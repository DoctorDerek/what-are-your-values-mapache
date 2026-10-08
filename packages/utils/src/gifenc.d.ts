declare module "gifenc" {
  export type GifPalette = number[][]
  export function quantize(pixels: Uint8Array | Uint8ClampedArray, colors: number): GifPalette
  export function applyPalette(pixels: Uint8Array | Uint8ClampedArray, palette: GifPalette): Uint8Array
  export function GIFEncoder(): {
    writeFrame(pixels: Uint8Array, width: number, height: number, options: {
      palette?: GifPalette; delay: number; repeat: number
    }): void
    finish(): void
    bytes(): Uint8Array<ArrayBuffer>
  }
}
