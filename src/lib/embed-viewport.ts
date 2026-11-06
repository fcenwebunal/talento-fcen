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
