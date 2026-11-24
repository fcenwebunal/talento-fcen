import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { ApplicantsTable } from "@/components/applicants-table";
import { CallLogo } from "@/components/call-card";
import { CALL_SELECT, type Applicant, type CallWithRelations, callLogoUrl, callPrograms, formatLongDate } from "@/lib/calls";

export const metadata: Metadata = { title: "Postulantes" };
export const dynamic = "force-dynamic";

export default async function CompanyCall({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["company"]);
  if (!session.company || session.level < 1) redirect("/empresa");
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: applicants, error }] = await Promise.all([
    supabase.from("calls").select(CALL_SELECT).eq("id", id).eq("company_id", session.company.id).maybeSingle(),
    supabase.rpc("call_applicants", { p_call: id }),
  ]);
  if (!data || error) notFound();
  const call = data as unknown as CallWithRelations;

  return (
    <div className="wrap space-y-6 py-8">
      <Link href="/empresa/convocatorias" className="inline-flex items-center gap-2 text-sm font-black text-suave hover:text-azul">
        <ArrowLeft className="h-4 w-4" /> Mis convocatorias
      </Link>
      <header className="card flex flex-wrap items-center gap-5">
        <CallLogo url={callLogoUrl(supabase, call)} name={call.company_name} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="display text-2xl text-azul-oscuro">{call.title}</h1>
          <p className="text-sm text-suave">
            {callPrograms(call).join(", ") || "Todos los programas"} · Fecha límite: {formatLongDate(call.deadline)}
          </p>
        </div>
        <Link href={`/convocatorias/${id}`} className="btn btn-ghost btn-sm">
          <Eye /> Ver convocatoria
        </Link>
      </header>
      <p className="text-sm text-suave">
        Quienes se postularon autorizaron que su organización vea su hoja de vida completa y sus datos de contacto para esta convocatoria. La Facultad lleva el estado de cada postulación.
      </p>
      <ApplicantsTable callId={id} applicants={(applicants ?? []) as Applicant[]} mode="company" profileHref={(s) => `/empresa/estudiantes/${s}`} />
    </div>
  );
}
