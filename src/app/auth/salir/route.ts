import type { NextRequest } from "next/server";
import { localRedirect } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";
import { expireAuthCookie, isAuthCookie } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = localRedirect("/");
  for (const c of request.cookies.getAll()) if (isAuthCookie(c.name)) expireAuthCookie(response, c.name);
  return response;
}
