import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { formatDate } from "@/lib/labels";
import type { RequirementConfig } from "@/lib/requirements";
import { AdminTitle } from "../admin-title";
import { RequirementsForm, type MatrixRow } from "./requirements-form";

export const metadata: Metadata = { title: "Hoja de vida obligatoria" };
export const dynamic = "force-dynamic";

export default async function RequirementsPage() {
  const session = await requireRole(["staff", "admin"]);
  const supabase = await createClient();
  const [{ data: config }, { data: matrix }] = await Promise.all([
    supabase.from("profile_requirements").select("*").order("sort"),
    supabase.rpc("profile_requirements_matrix"),
  ]);
  const items = (config ?? []) as RequirementConfig[];

  const last = items.filter((i) => i.updated_by).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  let lastChange: string | null = null;
  if (last) {
    const { data: who } = await supabase.from("profiles").select("full_name, email").eq("id", last.updated_by!).maybeSingle();
    lastChange = `Último cambio: ${formatDate(last.updated_at)}${who ? `, por ${who.full_name || who.email}` : ""}.`;
  }

  return (
    <div>
      <AdminTitle
        icon={ClipboardCheck}
        title="Hoja de vida obligatoria"
        description="Qué datos debe tener la hoja de vida de un estudiante para aparecer ante las empresas y postularse a convocatorias."
      />
      <RequirementsForm config={items} matrix={(matrix ?? []) as MatrixRow[]} canEdit={session.role === "admin"} lastChange={lastChange} />
    </div>
  );
}
