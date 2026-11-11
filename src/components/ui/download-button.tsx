"use client";

import { useState, type ReactNode } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { fileNameFrom, saveBlob } from "@/lib/files";

const GENERIC_ERROR = "No se pudo descargar el archivo. Recarga la página e inténtalo de nuevo.";

/**
 * Downloads a file from one of the app's routes. Inside the fcen.unal.edu.co iframe the session cookie is
 * partitioned, and Chrome sends <a download> requests without it: the route answered 401 and Chrome saved a
 * failed «exportar.txt». fetch does carry the cookie, and it also lets the button show progress and errors.
 */
export function DownloadButton({
  href,
  icon,
  className = "",
  disabled = false,
  children,
}: {
  href: string;
  icon: ReactNode;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(href, { cache: "no-store" });
      const disposition = res.headers.get("content-disposition") ?? "";
      if (!res.ok || !/attachment/i.test(disposition)) {
        const plain = (res.headers.get("content-type") ?? "").startsWith("text/plain");
        const text = plain ? (await res.text()).trim() : "";
        setError(text && text.length <= 200 ? text : GENERIC_ERROR);
        return;
      }
      saveBlob(await res.blob(), fileNameFrom(disposition));
    } catch {
      setError("No se pudo descargar el archivo. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex max-w-full flex-col gap-1">
      <button type="button" onClick={download} disabled={disabled || busy} aria-busy={busy} className={`btn ${className}`}>
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : icon} {busy ? "Preparando…" : children}
      </button>
      {error && (
        <span role="alert" className="flex max-w-xs items-start gap-1 text-xs text-naranja">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {error}
        </span>
      )}
    </span>
  );
}
