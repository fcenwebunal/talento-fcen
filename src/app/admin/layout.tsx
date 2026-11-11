import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { AppShell, ADMIN_NAV } from "@/components/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  const [{ count: pendingCompanies }, { count: pendingProgress }, { count: pendingSkills }, { count: pendingUsers }] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "en_revision"),
    supabase
      .from("students")
      .select("id, profiles!inner(role)", { count: "exact", head: true })
      .eq("profiles.role", "student")
      .neq("progress_verified", "coordinacion")
      .or("progress_pct.not.is.null,papa.not.is.null"),
    supabase.from("skills").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
  ]);

  return (
    <AppShell
      session={session}
      items={ADMIN_NAV}
      badges={{ pendingCompanies: pendingCompanies ?? 0, pendingProgress: pendingProgress ?? 0, pendingSkills: pendingSkills ?? 0, pendingUsers: pendingUsers ?? 0 }}
    >
      {children}
    </AppShell>
  );
}
