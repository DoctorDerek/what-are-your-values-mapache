import { cx, type ClassName } from "classix"
import { twMerge } from "tailwind-merge"

export const mergeClassNames = (...inputs: ClassName[]): string =>
  twMerge(cx(...inputs))

export { mergeClassNames as cn }
