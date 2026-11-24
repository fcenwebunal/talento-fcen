import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Megaphone, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { formatDate } from "@/lib/labels";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { CallLogo } from "@/components/call-card";
import { APPLICATION_STATUS_CHIP, APPLICATION_STATUS_LABEL, type ApplicationStatus, type CallWithRelations, callLogoUrl, formatLongDate, todayCo } from "@/lib/calls";

export const metadata: Metadata = { title: "Mis postulaciones" };
export const dynamic = "force-dynamic";

const STATUS_HELP: Record<ApplicationStatus, string> = {
  recibida: "La Facultad recibió tu postulación y la va a revisar.",
  en_revision: "La Facultad está revisando tu hoja de vida.",
  enviada: "Tu hoja de vida ya está con la empresa. Si te contactan, responde pronto.",
  seleccionada: "¡Te seleccionaron! La Facultad te indicará los pasos para formalizar la práctica.",
  no_seleccionada: "Esta vez no quedaste. Sigue postulándote a otras convocatorias.",
  retirada: "Retiraste esta postulación.",
};

type Row = {
  id: number;
  status: ApplicationStatus;
  created_at: string;
  status_changed_at: string;
  calls: Pick<CallWithRelations, "id" | "title" | "company_name" | "logo_path" | "deadline" | "companies"> | null;
};

export default async function StudentApplications() {
  const session = await requireRole(["student"]);
  const supabase = await createClient();
  const today = todayCo();
  const [{ data }, { count: openCalls }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, created_at, status_changed_at, calls(id, title, company_name, logo_path, deadline, companies(name, logo_path))")
      .eq("student_id", session.userId)
      .order("created_at", { ascending: false }),
    supabase.from("calls").select("id", { count: "exact", head: true }).eq("status", "publicada").gte("deadline", today),
  ]);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader
        kicker="Prácticas"
        icon={Send}
        title="Mis postulaciones"
        description="Las convocatorias a las que te postulaste y en qué va cada una."
        actions={
          <Link href="/convocatorias" className="btn btn-primary">
            <Megaphone /> Convocatorias abiertas{openCalls ? ` (${openCalls})` : ""}
          </Link>
        }
      />
      <div className="wrap pb-10">
        {rows.length === 0 ? (
          <EmptyState
            icon={Send}
            title="Aún no te has postulado"
            text="Revisa las convocatorias abiertas y postúlate con tu hoja de vida."
            action={
              <Link href="/convocatorias" className="btn btn-accent">
                Ver convocatorias <ArrowRight />
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {rows.map((r) =>
              r.calls ? (
                <li key={r.id} className="card card-hover relative flex flex-wrap items-center gap-4">
                  <CallLogo url={callLogoUrl(supabase, r.calls)} name={r.calls.company_name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-suave">{r.calls.company_name}</p>
                    <Link href={`/convocatorias/${r.calls.id}`} className="display text-lg text-azul-oscuro after:absolute after:inset-0 hover:underline">
                      {r.calls.title}
                    </Link>
                    <p className="text-sm text-suave">{STATUS_HELP[r.status]}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs text-suave">
                    <span className={`chip ${APPLICATION_STATUS_CHIP[r.status]}`}>{APPLICATION_STATUS_LABEL[r.status]}</span>
                    <span>Te postulaste el {formatDate(r.created_at)}</span>
                    <span>Cierre: {formatLongDate(r.calls.deadline)}</span>
                  </div>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </div>
    </>
  );
}
