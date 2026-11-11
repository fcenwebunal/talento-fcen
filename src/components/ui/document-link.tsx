"use client";

import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { openInNewTab } from "@/lib/files";

// Signs the private document when it is clicked: a URL signed while rendering the page expired if the page stayed open.
export function DocumentLink({ path, className = "", children }: { path: string; className?: string; children: ReactNode }) {
  const [failed, setFailed] = useState(false);

  async function open() {
    setFailed(false);
    const ok = await openInNewTab(async () => {
      const { data } = await createClient().storage.from("documentos").createSignedUrl(path, 120);
      return data?.signedUrl ?? null;
    });
    if (!ok) setFailed(true);
  }

  return (
    <>
      <button type="button" onClick={open} className={className}>
        {children}
      </button>
      {failed && (
        <span role="alert" className="ml-1 text-xs text-naranja">
          No se pudo abrir. Revisa tu conexión o permite las ventanas emergentes.
        </span>
      )}
    </>
  );
}
