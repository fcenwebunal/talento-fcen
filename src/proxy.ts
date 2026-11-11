import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_OPTIONS, EMBED_COOKIE, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/config";
import { expireAuthCookie, isAuthCookie } from "@/lib/auth-cookies";

export async function proxy(request: NextRequest) {
  // Sign-in routes must not refresh a stored session: when it is stale (deleted account, token revoked by a sign-out
  // inside the iframe) supabase-js clears its storage, PKCE code verifier included, and /auth/callback cannot finish.
  if (request.nextUrl.pathname.startsWith("/auth/")) return NextResponse.next();

  // ?embed=1 marks the session as embedded in fcen.unal.edu.co (the cookie is partitioned per top-level site)
  const embedParam = request.nextUrl.searchParams.get("embed");
  if (embedParam === "1") request.cookies.set(EMBED_COOKIE, "1");
  if (embedParam === "0") request.cookies.delete(EMBED_COOKIE);

  let response = NextResponse.next({ request });
  const deleted = new Set<string>();

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
          if (!value && isAuthCookie(name)) deleted.add(name);
          else deleted.delete(name);
        });
      },
    },
  });

  await supabase.auth.getUser();
  if (embedParam === "1") response.cookies.set(EMBED_COOKIE, "1", { ...COOKIE_OPTIONS, httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
  if (embedParam === "0") response.cookies.set(EMBED_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  // supabase-js dropped a dead session but only deletes its partitioned copy: drop an older unpartitioned one too
  for (const name of deleted) expireAuthCookie(response, name, { settingNow: true });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|fonts/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|otf)$).*)"],
};
