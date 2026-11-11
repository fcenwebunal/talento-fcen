import type { NextResponse } from "next/server";
import { COOKIE_OPTIONS, SUPABASE_URL } from "@/lib/config";

export const AUTH_COOKIE_PREFIX = `sb-${new URL(SUPABASE_URL).hostname.split(".")[0]}-auth-token`;

export const isAuthCookie = (name: string) => name.startsWith(AUTH_COOKIE_PREFIX);

/**
 * Expires an auth cookie in both of its possible copies: partitioned (what the app writes since 2026-11-01) and
 * unpartitioned (sessions from before). supabase-js only deletes the copy that matches its own options, so an old
 * unpartitioned session survived forever: every request tried to refresh it, and each failed refresh also wiped the
 * PKCE verifier of the sign-in in progress («No pudimos completar el ingreso»).
 * With `settingNow` the same response writes a fresh copy of that cookie: only the unpartitioned leftover goes.
 * Append these headers after any response.cookies.set call: ResponseCookies rewrites the Set-Cookie headers it owns.
 */
export function expireAuthCookie(response: NextResponse, name: string, { settingNow = false } = {}) {
  const partitioned = !!COOKIE_OPTIONS?.partitioned;
  if (settingNow && !partitioned) return;
  const attrs = COOKIE_OPTIONS ? "; Secure; SameSite=None" : "";
  response.headers.append("Set-Cookie", `${name}=; Path=/; Max-Age=0${attrs}`);
  if (partitioned && !settingNow) response.headers.append("Set-Cookie", `${name}=; Path=/; Max-Age=0${attrs}; Partitioned`);
}
