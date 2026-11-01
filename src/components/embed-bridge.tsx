"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FCEN_ORIGIN } from "@/lib/config";

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
    const send = () => window.parent.postMessage({ type: "talento:height", height: document.documentElement.scrollHeight }, FCEN_ORIGIN);
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    send();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.parent !== window) window.parent.postMessage({ type: "talento:navigate", path: pathname }, FCEN_ORIGIN);
  }, [pathname, params]);

  return null;
}
