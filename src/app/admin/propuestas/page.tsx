import type { Metadata } from "next";
import { Lightbulb } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Skill } from "@/lib/types";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminTitle } from "../admin-title";
import { ReviewCard, type Proposal } from "./review-card";

export const metadata: Metadata = { title: "Habilidades propuestas" };
export const dynamic = "force-dynamic";

type Row = Skill & { created_at: string; profiles: { full_name: string | null; email: string } | null };

export default async function AdminProposals() {
  const supabase = await createClient();
  const [{ data: domains }, { data: pending }, { data: approved }] = await Promise.all([
    supabase.from("skill_domains").select("id, name").order("sort"),
    supabase.from("skills").select("id, name, domain_id, description, created_at, profiles:proposed_by(full_name, email)").eq("status", "pending").order("created_at"),
    supabase.from("skills").select("id, name, domain_id").eq("status", "approved").eq("active", true).order("name"),
  ]);
  const rows = (pending ?? []) as unknown as Row[];
  const { data: usage } = rows.length
    ? await supabase.from("student_skills").select("skill_id").in("skill_id", rows.map((r) => r.id))
    : { data: [] as { skill_id: number }[] };
  const proposals: Proposal[] = rows.map(({ profiles, ...r }) => ({
    ...r,
    proposer: profiles,
    students: (usage ?? []).filter((u) => u.skill_id === r.id).length,
  }));

  return (
    <div className="space-y-6">
      <AdminTitle
        icon={Lightbulb}
        title="Habilidades propuestas"
        description="Las que agregaron los estudiantes y aún no están en el catálogo. Al aprobarlas aparecen en el catálogo y en las sugerencias para todos."
      />
      {proposals.length === 0 ? (
        <EmptyState icon={Lightbulb} title="No hay propuestas pendientes" text="Cuando un estudiante proponga una habilidad, aparecerá aquí para revisarla." />
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <ReviewCard key={p.id} proposal={p} domains={domains ?? []} approved={(approved ?? []) as Skill[]} />
          ))}
        </div>
      )}
    </div>
  );
}
