import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenCheck, BriefcaseBusiness, CalendarClock, ClipboardList, Info, Languages, ListChecks, Pencil, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { MODALITY_LABEL, SKILL_LEVEL } from "@/lib/labels";
import { SkillIcon } from "@/components/ui/skill-icon";
import { CallLogo } from "@/components/call-card";
import {
  CALL_SELECT, CONTRACT_LABEL, type CallWithRelations, type Readiness, callLogoUrl, callPrograms, deadlineText, formatLongDate, formatMoney, isOpen, lines, todayCo,
} from "@/lib/calls";
import { ApplyPanel } from "./apply-panel";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadCall(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("calls").select(CALL_SELECT).eq("id", id).maybeSingle();
  return data as unknown as CallWithRelations | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const call = await loadCall((await params).id);
  return { title: call ? `${call.title} · ${call.company_name}` : "Convocatoria" };
}

function Section({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="flex items-center gap-3 font-black text-azul-oscuro">
        <span className="icon-tile h-9 w-9">
          <Icon />
        </span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-sm text-texto">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  if (v === null || v === undefined || v === "") return null;
  return (
    <div className="grid gap-1 border-b border-borde/70 pb-2 last:border-0 last:pb-0 sm:grid-cols-[13rem_1fr]">
      <dt className="font-black text-azul-oscuro">{k}</dt>
      <dd className="whitespace-pre-line text-texto">{v}</dd>
    </div>
  );
}

function List({ text }: { text: string | null }) {
  const items = lines(text);
  if (items.length <= 1) return <p className="whitespace-pre-line">{text}</p>;
  return (
    <ol className="list-decimal space-y-1.5 pl-5 marker:font-black marker:text-verde-tinta">
      {items.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ol>
  );
}

export default async function CallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const call = await loadCall(id);
  if (!call) notFound();

  const supabase = await createClient();
  const session = await getSession();
  const today = todayCo();
  const open = isOpen(call, today);
  const programs = callPrograms(call);
  const staff = session?.role === "staff" || session?.role === "admin";

  let readiness: Readiness = { open, student: false, can_apply: false };
  if (session?.role === "student") {
    const { data } = await supabase.rpc("call_readiness", { p_call: id });
    if (data) readiness = data as Readiness;
  }
  const viewer = !session ? "anon" : session.role === "admin" ? "staff" : session.role;

  const academic = [
    call.min_progress !== null ? `Avance del plan de estudios de al menos ${String(call.min_progress).replace(".", ",")} %` : null,
    call.min_papa !== null ? `PAPA de al menos ${String(call.min_papa).replace(".", ",")}` : null,
  ].filter(Boolean);

  return (
    <div className="bg-dots">
      <div className="wrap py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/convocatorias" className="inline-flex items-center gap-2 text-sm font-black text-suave hover:text-azul">
            <ArrowLeft className="h-4 w-4" /> Convocatorias
          </Link>
          {staff && (
            <span className="flex gap-2">
              <Link href={`/admin/convocatorias/${id}`} className="btn btn-secondary btn-sm">
                <Users /> Postulantes
              </Link>
              <Link href={`/admin/convocatorias/${id}/editar`} className="btn btn-ghost btn-sm">
                <Pencil /> Editar
              </Link>
            </span>
          )}
        </div>

        <header className="card page-in flex flex-wrap items-center gap-5">
          <CallLogo url={callLogoUrl(supabase, call)} name={call.company_name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-suave">
              {call.company_name}
              {call.company_brand ? ` · ${call.company_brand}` : ""}
            </p>
            <h1 className="display text-2xl text-azul-oscuro md:text-3xl">{call.title}</h1>
            {programs.length > 0 && (
              <p className="mt-1 text-sm">
                <span className="text-suave">Convocatoria para estudiantes de: </span>
                <strong className="text-azul-oscuro">{programs.join(", ")}</strong>
              </p>
            )}
          </div>
          <div className="text-sm">
            <p className="flex items-center gap-2 text-suave">
              <CalendarClock className="h-4 w-4" aria-hidden="true" /> Fecha límite
            </p>
            <p className="display text-lg text-azul-oscuro">{formatLongDate(call.deadline)}</p>
            <span className={`chip mt-1 ${open ? "chip-verde" : ""}`}>
              <span className={`status-dot ${open ? "live" : ""}`} />
              {call.status === "borrador" ? "Borrador (no publicada)" : open ? deadlineText(call.deadline, today) : "Cerrada"}
            </span>
          </div>
        </header>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            {call.summary && <p className="text-base text-texto">{call.summary}</p>}

            <Section icon={Users} title="Perfil">
              <dl className="space-y-2">
                <Row k="Programas académicos" v={programs.join(", ") || "Cualquier programa de la Facultad"} />
                <Row k="Perfil buscado" v={call.profile} />
                <Row k="Requisitos académicos" v={[...academic, call.academic_requirement].filter(Boolean).join("\n")} />
                <Row k="Practicantes requeridos" v={call.openings} />
                <Row k="Fecha aproximada de inicio" v={formatLongDate(call.start_date)} />
              </dl>
            </Section>

            {call.duties && (
              <Section icon={ClipboardList} title="Funciones">
                <List text={call.duties} />
              </Section>
            )}

            {(call.knowledge || call.call_skills.length > 0) && (
              <Section icon={BookOpenCheck} title="Conocimientos requeridos o deseables">
                {call.call_skills.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {call.call_skills.map((s) => (
                      <li key={s.skill_id} className="chip">
                        <SkillIcon path={s.skills?.icon_path ?? null} className="h-3.5 w-3.5" />
                        {s.skills?.name}
                        <span className="text-xs text-suave">· {SKILL_LEVEL[s.level]}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {call.knowledge && <List text={call.knowledge} />}
              </Section>
            )}

            {call.languages.length > 0 && (
              <Section icon={Languages} title="Idiomas">
                <ul className="flex flex-wrap gap-2">
                  {call.languages.map((l, i) => (
                    <li key={i} className="chip chip-azul">
                      {l.language} · nivel {l.level} o superior
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section icon={BriefcaseBusiness} title="Condiciones de la práctica">
              <dl className="space-y-2">
                <Row k="Tipo de vinculación" v={call.contract_type ? CONTRACT_LABEL[call.contract_type] : null} />
                <Row
                  k="Apoyo económico"
                  v={call.paid ? [call.stipend !== null ? `${formatMoney(call.stipend)} mensuales` : "Sí", call.stipend_note].filter(Boolean).join(". ") : "No tiene apoyo económico"}
                />
                <Row k="Duración" v={call.duration_months ? `${call.duration_months} ${call.duration_months === 1 ? "mes" : "meses"}` : null} />
                <Row k="Horario" v={call.schedule} />
                <Row k="Lugar" v={call.city} />
                <Row k="Modalidad" v={call.modality ? MODALITY_LABEL[call.modality] : null} />
                <Row k="Otros beneficios" v={call.benefits} />
              </dl>
            </Section>

            {call.extra_info && (
              <Section icon={Info} title="Más información">
                <p className="whitespace-pre-line">{call.extra_info}</p>
              </Section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20">
            <ApplyPanel callId={id} companyName={call.company_name} viewer={viewer} readiness={readiness} />
            <p className="flex gap-2 px-1 text-xs text-suave">
              <ListChecks className="h-4 w-4 shrink-0" aria-hidden="true" />
              La Facultad revisa las postulaciones y las envía a la empresa. Te avisaremos del estado en Mis postulaciones.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
