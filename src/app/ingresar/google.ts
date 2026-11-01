"use client";

import { createClient } from "@/lib/supabase/client";
import { UNAL_DOMAIN } from "@/lib/config";

type Como = "estudiante" | "empresa";

function randomNonce() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Inside the FCEN iframe Google refuses to load, so sign-in runs in a popup and the session
// comes back through a one-time token that the iframe polls for.
export async function signInWithGoogle(como: Como): Promise<"redirected" | "done" | "cancelled"> {
  const supabase = createClient();
  if (window.parent === window) {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?como=${como}`,
        queryParams: { prompt: "select_account", ...(como === "estudiante" ? { hd: UNAL_DOMAIN } : {}) },
      },
    });
    return "redirected";
  }

  const nonce = randomNonce();
  const popup = window.open(`/auth/popup?nonce=${nonce}&como=${como}`, "talento-login", "width=520,height=680");
  if (!popup) return "cancelled";

  const started = Date.now();
  while (Date.now() - started < 4 * 60 * 1000) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch(`/api/handoff?nonce=${nonce}`, { cache: "no-store" });
    const body = (await res.json()) as { ready?: boolean; token_hash?: string };
    if (body.ready && body.token_hash) {
      let { error } = await supabase.auth.verifyOtp({ token_hash: body.token_hash, type: "magiclink" });
      if (error) ({ error } = await supabase.auth.verifyOtp({ token_hash: body.token_hash, type: "email" }));
      return error ? "cancelled" : "done";
    }
    if (popup.closed && Date.now() - started > 3000) {
      const last = await fetch(`/api/handoff?nonce=${nonce}`, { cache: "no-store" }).then((r) => r.json());
      if (!last.ready) return "cancelled";
    }
  }
  return "cancelled";
}
