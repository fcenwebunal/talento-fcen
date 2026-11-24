import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Lock, Pencil, Send, Trash2, Unlock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ApplicantsTable } from "@/components/applicants-table";
import { CallLogo } from "@/components/call-card";
import { CALL_SELECT, CALL_STATUS_LABEL, type Applicant, type CallWithRelations, callLogoUrl, callPrograms, deadlineText, formatLongDate, isOpen, todayCo } from "@/lib/calls";
import { deleteCall, setApplicationStatus, setCallStatus } from "../actions";

export const metadata: Metadata = { title: "Postulantes" };
export const dynamic = "force-dynamic";

export default async function AdminCall({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data }, { data: applicants }] = await Promise.all([
    supabase.from("calls").select(CALL_SELECT).eq("id", id).maybeSingle(),
    supabase.rpc("call_applicants", { p_call: id }),
  ]);
  if (!data) notFound();
  const call = data as unknown as CallWithRelations;
  const list = (applicants ?? []) as Applicant[];
  const today = todayCo();
  const open = isOpen(call, today);

  const statusButton = (status: "publicada" | "cerrada" | "borrador", label: string, Icon: typeof Lock, style = "btn-secondary") => (
    <form action={setCallStatus}>
      <input type="hidden" name="call_id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`btn btn-sm ${style}`}>
        <Icon /> {label}
      </button>
    </form>
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/convocatorias" className="text-sm text-suave hover:text-azul">
        <ArrowLeft className="mr-1 inline h-4 w-4 align-[-0.2rem]" aria-hidden="true" /> Convocatorias
      </Link>

      <header className="card flex flex-wrap items-center gap-5">
        <CallLogo url={callLogoUrl(supabase, call)} name={call.company_name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-suave">
            {call.company_name} · n.º {call.code}
          </p>
          <h1 className="display text-2xl text-azul-oscuro">{call.title}</h1>
          <p className="mt-1 text-sm text-suave">
            {callPrograms(call).join(", ") || "Todos los programas"} · Fecha límite: {formatLongDate(call.deadline)}
            {open ? ` (${deadlineText(call.deadline, today).toLowerCase()})` : ""}
          </p>
          <p className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className={`chip ${open ? "chip-verde" : ""}`}>
              <span className={`status-dot ${open ? "live" : ""}`} /> {open ? "Abierta" : call.status === "publicada" ? "Cerrada por fecha" : CALL_STATUS_LABEL[call.status]}
            </span>
            <span className="chip">{call.enforce_requirements ? "Exige requisitos académicos" : "No exige requisitos académicos"}</span>
            {call.company_id ? <span className="chip chip-azul">La empresa ve a sus postulantes</span> : <span className="chip">Sin empresa vinculada</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/convocatorias/${id}`} className="btn btn-ghost btn-sm">
            <Eye /> Ver publicada
          </Link>
          <Link href={`/admin/convocatorias/${id}/editar`} className="btn btn-secondary btn-sm">
            <Pencil /> Editar
          </Link>
          {call.status === "borrador" && statusButton("publicada", "Publicar", Send, "btn-accent")}
          {call.status === "publicada" && statusButton("cerrada", "Cerrar ya", Lock)}
          {call.status === "cerrada" && statusButton("publicada", "Reabrir", Unlock)}
          {call.status === "borrador" && list.length === 0 && (
            <form action={deleteCall}>
              <input type="hidden" name="call_id" value={id} />
              <button className="btn btn-ghost btn-sm text-naranja">
                <Trash2 /> Eliminar borrador
              </button>
            </form>
          )}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="display text-xl text-azul-oscuro">Postulantes</h2>
        <ApplicantsTable callId={id} applicants={list} mode="staff" profileHref={(s) => `/admin/estudiantes/${s}`} setStatus={setApplicationStatus} />
      </section>
    </div>
  );
}
