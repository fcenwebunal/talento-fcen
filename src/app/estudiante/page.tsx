import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, BadgeCheck, Briefcase, CalendarDays, Check, Eye, FileText, GraduationCap, PencilLine,
  RefreshCcw, Route, Sparkles, UserRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { AVAILABILITY_LABEL, daysSince, freshness } from "@/lib/labels";
import { AVAILABILITY_DAYS } from "@/lib/config";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Avatar } from "@/components/ui/avatar";
import { HelpTip } from "@/components/ui/help-tip";
import { Reveal } from "@/components/ui/reveal";
import { confirmAvailability, setAvailability } from "./actions";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

const SECTIONS = [
  { id: "personales", label: "Datos personales", icon: UserRound },
  { id: "academico", label: "Información académica", icon: GraduationCap },
  { id: "perfil", label: "Perfil y competencias", icon: Sparkles },
  { id: "experiencia", label: "Experiencia e idiomas", icon: Briefcase },
  { id: "disponibilidad", label: "Disponibilidad", icon: CalendarDays },
  { id: "documentos", label: "Documentos y autorización", icon: FileText },
];

export default async function StudentHome() {
  const session = await requireRole(["student"]);
  const supabase = await createClient();

  const [{ data: s }, { data: priv }, skills, soft, langs, { data: photo }] = await Promise.all([
    supabase.from("students").select("*, programs(name)").eq("id", session.userId).single(),
    supabase.from("student_private").select("phone").eq("student_id", session.userId).single(),
    supabase.from("student_skills").select("skill_id", { count: "exact", head: true }).eq("student_id", session.userId),
    supabase.from("student_soft_skills").select("soft_skill_id", { count: "exact", head: true }).eq("student_id", session.userId),
    supabase.from("student_languages").select("id", { count: "exact", head: true }).eq("student_id", session.userId),
    supabase.from("documents").select("path").eq("student_id", session.userId).eq("kind", "foto").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!s) return null;
  const photoUrl = photo ? (await supabase.storage.from("documentos").createSignedUrl(photo.path, 3600)).data?.signedUrl : null;

  const checklist = [
    { done: !!s.program_id && s.progress_pct !== null, label: "Programa y avance", section: "academico" },
    { done: !!priv?.phone && !!s.city, label: "Datos personales y de contacto", section: "personales" },
    { done: !!s.headline && !!s.about, label: "Titular y perfil profesional", section: "perfil" },
    { done: (skills.count ?? 0) >= 3, label: "Al menos 3 habilidades técnicas", section: "perfil" },
    { done: (soft.count ?? 0) >= 3, label: "De 3 a 5 competencias transversales", section: "perfil" },
    { done: (langs.count ?? 0) >= 1, label: "Idiomas", section: "experiencia" },
    { done: s.modalities.length > 0 && !!s.dedication && !!s.practice_period, label: "Disponibilidad para la práctica", section: "disponibilidad" },
    { done: s.consent_anonymous, label: "Autorización para aparecer ante empresas", section: "documentos" },
  ];
  const done = checklist.filter((c) => c.done).length;
  const pct = Math.round((done / checklist.length) * 100);
  const fresh = freshness(s.last_confirmed_at);
  const days = daysSince(s.last_confirmed_at);
  const listed = s.consent_anonymous && s.program_id && ["disponible", "en_proceso"].includes(s.availability);
  const program = (s.programs as { name: string } | null)?.name;
  const firstName = session.fullName?.split(" ")[0];
  const routeStep = s.availability === "en_practica" ? 6 : s.availability === "en_proceso" ? 3 : listed ? 2 : 1;

  return (
    <>
      <PageHeader
        kicker="Mi perfil"
        title={<>Hola{firstName ? `, ${firstName}` : ""}</>}
        description={program ?? "Completa tu programa para empezar"}
        actions={
          <>
            <Link href="/estudiante/vista-previa" className="btn btn-glass">
              <Eye /> Cómo me ven
            </Link>
            <Link href="/estudiante/perfil" className="btn btn-accent">
              <PencilLine /> Editar perfil
            </Link>
          </>
        }
      >
        <div className="mt-6 flex items-center gap-3">
          <Avatar name={session.fullName ?? session.email} seed={session.email} src={photoUrl} size={44} />
          <span className={`chip ${listed ? "chip-verde" : "chip-dark"}`}>
            <span className={`status-dot ${listed ? "live" : ""}`} />
            {listed ? "Visible para empresas" : "Aún no apareces en las búsquedas"}
          </span>
        </div>
      </PageHeader>

      <div className="wrap -mt-6 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <Reveal className="card p-6">
          <div className="flex flex-wrap items-center gap-6">
            <ProgressRing value={pct} label="completo" />
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-lg font-black text-azul-oscuro">
                Fuerza del perfil
                <HelpTip>Un perfil completo aparece mejor ubicado y da más confianza a las empresas.</HelpTip>
              </h2>
              <p className="text-sm text-suave">
                {done === checklist.length ? "Tu perfil está completo. Mantén tu disponibilidad al día." : `Te faltan ${checklist.length - done} pasos.`}
              </p>
            </div>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link
                  href={`/estudiante/perfil?seccion=${c.section}`}
                  className={`group flex items-center gap-2.5 rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] border px-3 py-2.5 text-sm transition-colors ${c.done ? "border-transparent bg-verde-claro text-verde-tinta" : "border-borde hover:border-azul hover:bg-celeste"}`}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-verde text-white" : "border-2 border-borde"}`}>
                    {c.done && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="flex-1">{c.label}</span>
                  {!c.done && <ArrowRight className="h-4 w-4 text-azul opacity-0 transition-opacity group-hover:opacity-100" />}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal index={1} className="card overflow-hidden p-6">
          <span className="accent-bar" />
          <h2 className="flex items-center gap-2 text-lg font-black text-azul-oscuro">
            <CalendarDays className="h-5 w-5 text-azul-medio" aria-hidden="true" /> Mi disponibilidad
            <HelpTip align="right">
              Tu estado «Disponible» vence a los {AVAILABILITY_DAYS} días si no lo confirmas, para que las empresas no encuentren perfiles viejos.
            </HelpTip>
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`chip ${s.availability === "disponible" ? "chip-verde" : s.availability === "sin_confirmar" ? "chip-amarillo" : "chip-azul"}`}>
              <span className={`status-dot ${s.availability === "disponible" ? "live" : ""}`} />
              {AVAILABILITY_LABEL[s.availability as keyof typeof AVAILABILITY_LABEL]}
            </span>
            {["disponible", "en_proceso"].includes(s.availability) && <span className="text-sm text-suave">{fresh.text}</span>}
          </div>
          {s.availability === "disponible" && days !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-suave">
                <span>Vigencia de tu confirmación</span>
                <span>{Math.max(0, AVAILABILITY_DAYS - days)} días restantes</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-superficie-2">
                <div
                  className={`h-full rounded-full ${days >= AVAILABILITY_DAYS - 15 ? "bg-amarillo" : "bg-verde"}`}
                  style={{ width: `${Math.max(4, 100 - (days / AVAILABILITY_DAYS) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {s.availability === "disponible" && days !== null && days >= AVAILABILITY_DAYS - 15 && (
            <p className="mt-3 flex gap-2 rounded-lg bg-amarillo/15 p-3 text-sm text-amarillo-tinta">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> Confirma que sigues buscando o tu perfil dejará de aparecer.
            </p>
          )}
          {["disponible", "en_proceso", "sin_confirmar", "no_disponible"].includes(s.availability) && (
            <form action={confirmAvailability} className="mt-5">
              <button className="btn btn-primary w-full">
                <RefreshCcw /> Sigo buscando práctica
              </button>
            </form>
          )}
          <details className="mt-4 border-t border-borde pt-4">
            <summary className="cursor-pointer text-sm font-black text-azul">Cambiar mi estado</summary>
            <form action={setAvailability} className="mt-3 space-y-3">
              <select name="availability" defaultValue={s.availability} className="input">
                <option value="disponible">Disponible: busco práctica</option>
                <option value="en_proceso">En proceso con una empresa</option>
                <option value="en_practica">Conseguí práctica</option>
                <option value="no_disponible">No estoy buscando por ahora</option>
              </select>
              <label className="field">
                <span>Si conseguiste práctica, ¿cuándo termina?</span>
                <input type="date" name="practice_end_date" defaultValue={s.practice_end_date ?? ""} className="input" />
              </label>
              <button className="btn btn-secondary">Guardar estado</button>
            </form>
          </details>
        </Reveal>
      </div>

      <section className="wrap mt-10">
        <Reveal>
          <h2 className="kicker">Ir directo a</h2>
        </Reveal>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((sec, i) => (
            <Reveal key={sec.id} index={i}>
              <Link href={`/estudiante/perfil?seccion=${sec.id}`} className="card card-hover group flex items-center gap-4">
                <span className={`icon-tile ${i % 3 === 1 ? "icon-tile-verde" : ""}`}>
                  <sec.icon />
                </span>
                <span className="flex-1 font-black text-azul-oscuro">{sec.label}</span>
                <ArrowRight className="h-4 w-4 text-suave transition-transform group-hover:translate-x-1 group-hover:text-azul" />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap mt-10">
        <Reveal className="card-dark grid gap-6 p-7 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
            <p className="flex items-center gap-2 font-black">
              <Route className="h-5 w-5 text-verde" aria-hidden="true" /> Tu ruta hacia la práctica
            </p>
            <ol className="mt-4 flex flex-wrap gap-2">
              {["Perfil", "Visible", "Carta de aceptación", "Vinculación", "Formalización", "En práctica", "Cierre"].map((step, i) => (
                <li
                  key={step}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${i + 1 < routeStep ? "bg-verde/25 text-white" : i + 1 === routeStep ? "bg-verde text-azul-noche font-black" : "bg-white/10 text-white/60"}`}
                >
                  {i + 1 < routeStep ? <BadgeCheck className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <Link href="/guia/estudiantes#ruta" className="btn btn-accent relative">
            Ver la guía <ArrowRight />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
