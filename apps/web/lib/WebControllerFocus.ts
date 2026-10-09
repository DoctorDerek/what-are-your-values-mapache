import type { ControllerCommand } from "@game/data/src/ControllerControls"
import { PRODUCT_MENU_COPY } from "@game/data/src/ProductMenu"

const CONTROLLER_FOCUS_TARGETS =
  "button, a[href], input, select, textarea, [role=region][tabindex], [data-controller-scroll]"
const CONTROLLER_SCROLL_STEP = 96

function getControllerFocusTargets() {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"]')
  const scope =
    dialogs.item(dialogs.length - 1) ??
    document.querySelector<HTMLElement>('[data-slot="mapache-screen"]')
  if (!scope) return []
  return [
    ...scope.querySelectorAll<HTMLElement>(CONTROLLER_FOCUS_TARGETS),
  ].filter(
    (element) =>
      (element.tabIndex >= 0 ||
        element.matches('[role="radio"], [role="tab"]')) &&
      !element.matches(":disabled, [aria-disabled=true]") &&
      !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
      element.checkVisibility({
        visibilityProperty: true,
        opacityProperty: true,
      }),
  )
}

export function activateWebControllerMenu() {
  const menu = getControllerFocusTargets().find((element) =>
    element instanceof HTMLButtonElement &&
    (element.getAttribute("aria-label") ?? element.textContent?.trim()) === PRODUCT_MENU_COPY.openAction,
  )
  menu?.click()
}

export function moveWebControllerFocus(command: ControllerCommand) {
  const targets = getControllerFocusTargets()
  const active = document.activeElement
  if (command === "confirm") {
    if (active instanceof HTMLElement && targets.includes(active)) {
      if (
        !active.matches(
          '[role="region"], [data-controller-scroll]',
        )
      )
        active.click()
    } else targets[0]?.focus()
    return
  }
  if (
    active instanceof HTMLElement &&
    targets.includes(active) &&
    active.matches('[role="region"], [data-controller-scroll]') &&
    (command === "up" || command === "down")
  ) {
    active.scrollBy({
      top: command === "up" ? -CONTROLLER_SCROLL_STEP : CONTROLLER_SCROLL_STEP,
      behavior: "instant",
    })
    return
  }
  const index = targets.findIndex((target) => target === active)
  const step = command === "up" || command === "left" ? -1 : 1
  const next =
    index < 0
      ? step > 0
        ? 0
        : targets.length - 1
      : (index + step + targets.length) % targets.length
  targets[next]?.focus()
}
