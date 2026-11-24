import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Megaphone, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CallCard } from "@/components/call-card";
import { CALL_SELECT, type Applicant, type CallWithRelations, callLogoUrl } from "@/lib/calls";

export const metadata: Metadata = { title: "Mis convocatorias" };
export const dynamic = "force-dynamic";

export default async function CompanyCalls() {
  const session = await requireRole(["company"]);
  if (!session.company || session.level < 1) redirect("/empresa");
  const supabase = await createClient();
  const { data } = await supabase
    .from("calls")
    .select(CALL_SELECT)
    .eq("company_id", session.company.id)
    .neq("status", "borrador")
    .order("deadline", { ascending: false });
  const calls = (data ?? []) as unknown as CallWithRelations[];
  const counts = await Promise.all(
    calls.map(async (c) => ((await supabase.rpc("call_applicants", { p_call: c.id })).data as Applicant[] | null)?.length ?? 0),
  );

  return (
    <>
      <PageHeader
        kicker="Empresa"
        icon={Megaphone}
        title="Mis convocatorias"
        description="Las convocatorias que la Facultad publicó para su organización. Aquí ve a quienes se postularon y su hoja de vida completa."
      />
      <div className="wrap pb-10">
        {calls.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="Aún no tiene convocatorias"
            text="Envíe a la Facultad los datos de la práctica que ofrece (programas, perfil, funciones, condiciones y fecha límite) y la publicará vinculada a su organización."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {calls.map((c, i) => (
              <CallCard
                key={c.id}
                call={c}
                logoUrl={callLogoUrl(supabase, c)}
                href={`/empresa/convocatorias/${c.id}`}
                footer={
                  <span className="chip chip-azul text-xs">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" /> {counts[i]} {counts[i] === 1 ? "postulante" : "postulantes"}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
