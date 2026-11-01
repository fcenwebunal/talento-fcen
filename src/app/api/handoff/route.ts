import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// The embedded app polls with its secret nonce and receives a one-time login token (valid for 5 minutes).
export async function GET(request: NextRequest) {
  const nonce = request.nextUrl.searchParams.get("nonce") ?? "";
  if (!/^[a-f0-9]{64}$/.test(nonce)) return NextResponse.json({ error: "nonce" }, { status: 400 });
  const admin = createAdminClient();
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data } = await admin.from("login_handoffs").select("token_hash").eq("nonce", nonce).gte("created_at", since).maybeSingle();
  if (!data?.token_hash) return NextResponse.json({ ready: false }, { headers: { "Cache-Control": "no-store" } });
  await admin.from("login_handoffs").delete().eq("nonce", nonce);
  return NextResponse.json({ ready: true, token_hash: data.token_hash }, { headers: { "Cache-Control": "no-store" } });
}
