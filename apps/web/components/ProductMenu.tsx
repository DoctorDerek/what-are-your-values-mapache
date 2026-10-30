"use client"

import { type ProductMenuDestination } from "@game/data/src/ProductMenu"
import useLocaleCatalog from "@game/data/src/useLocaleCatalog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function ProductMenu({
  contextActionLabel,
  open,
  onDestinationSelect,
  onOpenChange,
  onCloseAutoFocus,
}: {
  contextActionLabel: string
  open: boolean
  onDestinationSelect: (destination: ProductMenuDestination) => void
  onOpenChange: (open: boolean) => void
  onCloseAutoFocus?: (event: Event) => void
}) {
  const localizedCopy = useLocaleCatalog()
  const PRODUCT_MENU_COPY = localizedCopy.interfaceCopy.menu
  const PRODUCT_MENU_DESTINATIONS = localizedCopy.interfaceCopy.menuDestinations

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={onCloseAutoFocus}
        aria-describedby={undefined}
        className="grid-rows-[minmax(0,auto)_minmax(0,1fr)_auto] [overflow-wrap:anywhere] hyphens-auto"
      >
        <header className="max-h-[25dvh] min-h-0 overflow-y-auto border-b-4 border-black px-[20px] py-[20px] xl:px-8 xl:py-7">
          <DialogTitle>{PRODUCT_MENU_COPY.title}</DialogTitle>
        </header>

        <nav
          aria-label={PRODUCT_MENU_COPY.title}
          className="min-h-0 overflow-y-auto overscroll-contain p-[20px] xl:p-8"
        >
          <ul className="grid gap-4">
            {PRODUCT_MENU_DESTINATIONS.map((destination) => (
              <li key={destination.id}>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  align="start"
                  wrap
                  typographyClassName="text-xl xl:text-2xl"
                  onClick={() => onDestinationSelect(destination)}
                >
                  {destination.label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t-4 border-black p-[12px] pb-[20px] xl:p-5">
          <Button
            type="button"
            size="default"
            wrap
            className="w-full"
            typographyClassName="text-xl xl:text-2xl"
            onClick={() => onOpenChange(false)}
          >
            {contextActionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
