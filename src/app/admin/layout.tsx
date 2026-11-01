import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  const { count } = await supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "en_revision");

  return (
    <div className="bg-dots min-h-[70vh]">
      <div className="wrap grid gap-6 py-8 lg:grid-cols-[14rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-dark mb-4 hidden p-4 lg:block">
            <ShieldCheck className="h-6 w-6 text-verde" aria-hidden="true" />
            <p className="mt-2 text-sm font-black">Administración</p>
            <p className="text-xs text-white/60">{session.role === "admin" ? "Administrador" : "Facultad"}</p>
          </div>
          <AdminNav pending={count ?? 0} />
        </aside>
        <div className="page-in min-w-0">{children}</div>
      </div>
    </div>
  );
}
