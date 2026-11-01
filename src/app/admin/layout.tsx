import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  const [{ count: pendingCompanies }, { count: pendingProgress }] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "en_revision"),
    supabase.from("students").select("id", { count: "exact", head: true }).neq("progress_verified", "coordinacion").not("progress_pct", "is", null),
  ]);

  return (
    <AppShell session={session} items={ADMIN_NAV} badges={{ pendingCompanies: pendingCompanies ?? 0, pendingProgress: pendingProgress ?? 0 }}>
      {children}
    </AppShell>
  );
}
