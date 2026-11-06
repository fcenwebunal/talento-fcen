"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FCEN_ORIGIN } from "@/lib/config";
import { hashId, scrollParentToId, setParentViewport } from "@/lib/embed-viewport";

// Talks to the TYPO3 page that hosts the iframe: reports the content height and route changes.
export function EmbedBridge() {
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    if (window.parent === window) {
      // Opened at top level with a leftover embed cookie: leave embedded mode.
      window.location.replace(`${window.location.pathname}?embed=0`);
      return;
    }
    // The body's own height, not the document's scrollHeight: that one never drops below the iframe's current
    // height, so the frame could only grow and short pages were left with a blank tail.
    const send = () => window.parent.postMessage({ type: "talento:height", height: Math.ceil(document.body.getBoundingClientRect().height) }, FCEN_ORIGIN);
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    send();

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== FCEN_ORIGIN || e.data?.type !== "talento:viewport") return;
      const { top, height } = e.data;
      if (typeof top === "number" && typeof height === "number") setParentViewport({ top, height });
    };
    window.addEventListener("message", onMessage);

    // In-page anchors cannot scroll the host page from a cross-origin frame: ask the host to do it.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const id = link ? hashId(link.getAttribute("href")!) : "";
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      scrollParentToId(id, 0);
      history.replaceState(history.state, "", `#${id}`);
    };
    document.addEventListener("click", onClick);

    return () => {
      observer.disconnect();
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (window.parent === window) return;
    window.parent.postMessage({ type: "talento:navigate", path: pathname }, FCEN_ORIGIN);
    const id = hashId(window.location.hash);
    if (id) scrollParentToId(id);
  }, [pathname, params]);

  return null;
}
