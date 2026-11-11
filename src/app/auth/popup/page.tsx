import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Kept for embedded apps loaded before 2026-11-11: Google sign-in now starts on the server at /auth/google.
export default async function PopupLogin({ searchParams }: { searchParams: Promise<{ nonce?: string; como?: string }> }) {
  const { nonce = "", como = "estudiante" } = await searchParams;
  redirect(`/auth/google?${new URLSearchParams({ handoff: nonce, como })}`);
}
