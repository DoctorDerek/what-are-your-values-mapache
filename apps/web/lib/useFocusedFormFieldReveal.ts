"use client"

import { useEffect, useRef } from "react"

export default function useFocusedFormFieldReveal() {
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    function revealFocusedField() {
      const focusedField = document.activeElement
      if (
        (focusedField instanceof HTMLInputElement ||
          focusedField instanceof HTMLTextAreaElement) &&
        formRef.current?.contains(focusedField)
      )
        focusedField.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          behavior: "instant",
        })
    }

    const visualViewport = window.visualViewport
    window.addEventListener("resize", revealFocusedField)
    visualViewport?.addEventListener("resize", revealFocusedField)
    return () => {
      window.removeEventListener("resize", revealFocusedField)
      visualViewport?.removeEventListener("resize", revealFocusedField)
    }
  }, [])

  return formRef
}
