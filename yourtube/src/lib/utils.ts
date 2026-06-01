import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVideoSrc(filepath?: string) {
  if (!filepath) return ""
  if (filepath.startsWith("http://") || filepath.startsWith("https://")) {
    return filepath
  }

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || ""
  const normalized = backendUrl.endsWith("/")
    ? backendUrl.slice(0, -1)
    : backendUrl

  if (filepath.startsWith("/")) {
    return `${normalized}${filepath}`
  }

  return `${normalized}/${filepath}`
}
