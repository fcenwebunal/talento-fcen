import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description") ?? "";

  if (!code) {
    const reason = /database error|UNAL_ONLY/i.test(errorDescription) ? "unal" : "auth";
    return NextResponse.redirect(`${origin}/ingresar?error=${reason}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/ingresar?error=auth`);

  return NextResponse.redirect(`${origin}/panel`);
}
