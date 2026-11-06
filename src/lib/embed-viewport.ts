import { FCEN_ORIGIN } from "@/lib/config";

// Inside the TYPO3 iframe the frame is as tall as the content, so the iframe never scrolls:
// the host page reports which slice of the frame is on screen (top is relative to the frame's top edge).
export type ParentViewport = { top: number; height: number };

let current: ParentViewport | null = null;
const listeners = new Set<() => void>();

export function setParentViewport(next: ParentViewport) {
  current = next;
  listeners.forEach((listener) => listener());
}

export function getParentViewport() {
  return current;
}

export function subscribeParentViewport(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isEmbedded() {
  return typeof window !== "undefined" && window.parent !== window;
}

export function scrollParentTo(top: number) {
  window.parent.postMessage({ type: "talento:scrollTo", top: Math.max(0, Math.round(top)) }, FCEN_ORIGIN);
}

// Retries briefly because after a route change the target section may not be rendered yet.
export function scrollParentToId(id: string, tries = 40) {
  const target = document.getElementById(id);
  if (target) {
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    scrollParentTo(target.getBoundingClientRect().top + window.scrollY - margin);
    return true;
  }
  if (tries > 0) setTimeout(() => scrollParentToId(id, tries - 1), 50);
  return false;
}

export function hashId(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return "";
  }
}
