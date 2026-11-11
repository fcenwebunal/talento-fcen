import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { COOKIE_OPTIONS, PUBLIC_SITE, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, UNAL_DOMAIN } from "@/lib/config";
import { expireAuthCookie, isAuthCookie } from "@/lib/auth-cookies";
import { localRedirect } from "@/lib/redirect";

export const dynamic = "force-dynamic";

// Google sign-in starts on the server with a clean slate. A browser client first tries to refresh whatever session
// is stored, and when that session is dead (deleted account, token revoked by a sign-out elsewhere) the failed refresh
// wipes the PKCE verifier of this very sign-in, so /auth/callback cannot finish. Old auth cookies are expired here.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const como = params.get("como") === "empresa" ? "empresa" : "estudiante";
  const handoff = params.get("handoff") ?? "";
  const host = request.headers.get("host") ?? "";
  const origin = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? `http://${host}` : PUBLIC_SITE;
  const callback = new URLSearchParams({ ...(/^[a-f0-9]{64}$/.test(handoff) ? { handoff } : {}), como });

  const written: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: COOKIE_OPTIONS,
    cookies: { getAll: () => [], setAll: (list) => void written.push(...list) },
  });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?${callback}`,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account", ...(como === "estudiante" ? { hd: UNAL_DOMAIN } : {}) },
    },
  });
  if (error || !data?.url) return localRedirect(`/ingresar?error=auth&como=${como}`);

  const response = NextResponse.redirect(data.url, 303);
  response.headers.set("Cache-Control", "no-store");
  for (const c of written) response.cookies.set(c.name, c.value, c.options);
  for (const c of request.cookies.getAll()) {
    if (isAuthCookie(c.name)) expireAuthCookie(response, c.name, { settingNow: written.some((w) => w.name === c.name) });
  }
  return response;
}
