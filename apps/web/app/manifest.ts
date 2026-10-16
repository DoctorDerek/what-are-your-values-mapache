import { createWebManifest } from "@/lib/WebManifest"

export const dynamic = "force-static"

export default function manifest() {
  return createWebManifest()
}
