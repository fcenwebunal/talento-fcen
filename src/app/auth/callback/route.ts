import type { NextRequest } from "next/server";
import { localRedirect } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description") ?? "";

  if (!code) {
    const reason = /database error|UNAL_ONLY/i.test(errorDescription) ? "unal" : "auth";
    return localRedirect(`/ingresar?error=${reason}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return localRedirect("/ingresar?error=auth");

  return localRedirect("/panel");
}
