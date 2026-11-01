"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UNAL_DOMAIN } from "@/lib/config";

// Opened as a popup from the embedded app: Google sign-in cannot run inside an iframe.
export default function PopupLogin() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nonce = params.get("nonce") ?? "";
    const como = params.get("como") ?? "estudiante";
    if (!/^[a-f0-9]{64}$/.test(nonce)) return;
    createClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?handoff=${nonce}&como=${como}`,
        queryParams: { prompt: "select_account", ...(como === "estudiante" ? { hd: UNAL_DOMAIN } : {}) },
      },
    });
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-suave">
      <Loader2 className="h-8 w-8 animate-spin text-azul" aria-hidden="true" />
      <p>Abriendo Google…</p>
    </div>
  );
}
