"use client"

import { createContext, createElement, useContext, type ReactNode } from "react"

const LocaleContext = createContext<string | undefined>(undefined)

export default function LocaleProvider({
  locale,
  children,
}: {
  readonly locale: string | undefined
  readonly children: ReactNode
}) {
  return createElement(LocaleContext, { value: locale }, children)
}

export function useLocalePreference() {
  return useContext(LocaleContext)
}
