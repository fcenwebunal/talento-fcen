"use client";

import { createClient } from "@/lib/supabase/client";

type Como = "estudiante" | "empresa";

function randomNonce() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Google sign-in always starts on the server (/auth/google), never with a browser client: see that route.
// Inside the FCEN iframe Google refuses to load, so it runs in a popup and the session comes back through a
// one-time token that the iframe polls for.
export async function signInWithGoogle(como: Como): Promise<"redirected" | "done" | "cancelled"> {
  if (window.parent === window) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a route handler that redirects to Google needs a full navigation
    window.location.assign(`/auth/google?como=${como}`);
    return "redirected";
  }

  const nonce = randomNonce();
  const popup = window.open(`/auth/google?handoff=${nonce}&como=${como}`, "talento-login", "width=520,height=680");
  if (!popup) return "cancelled";

  const started = Date.now();
  while (Date.now() - started < 4 * 60 * 1000) {
    await new Promise((r) => setTimeout(r, 1500));
    const res = await fetch(`/api/handoff?nonce=${nonce}`, { cache: "no-store" });
    const body = (await res.json()) as { ready?: boolean; token_hash?: string };
    if (body.ready && body.token_hash) {
      const supabase = createClient();
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
