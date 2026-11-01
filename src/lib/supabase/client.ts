import { createBrowserClient } from "@supabase/ssr";
import { COOKIE_OPTIONS, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/config";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { cookieOptions: COOKIE_OPTIONS });
}
