import type { NextRequest } from "next/server";
import { localRedirect } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const handoff = searchParams.get("handoff");
  const como = searchParams.get("como");
  const errorDescription = searchParams.get("error_description") ?? "";

  if (!code) {
    const reason = /database error|UNAL_ONLY/i.test(errorDescription) ? "unal" : "auth";
    return localRedirect(`/ingresar?error=${reason}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return localRedirect("/ingresar?error=auth");

  // Popup opened from the embedded app: leave a one-time token for the iframe to pick up.
  if (handoff && /^[a-f0-9]{64}$/.test(handoff) && data.user.email) {
    try {
      const admin = createAdminClient();
      const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email: data.user.email });
      if (link?.properties?.hashed_token) {
        await admin.from("login_handoffs").upsert({ nonce: handoff, token_hash: link.properties.hashed_token, created_at: new Date().toISOString() });
      }
      return localRedirect("/auth/listo");
    } catch {
      return localRedirect("/ingresar?error=popup");
    }
  }

  if (como === "estudiante") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    if (profile?.role === "company") return localRedirect("/empresa/registro?aviso=no-unal");
  }
  return localRedirect("/panel");
}
