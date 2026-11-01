import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, Check, Eye, PencilLine, RefreshCcw, Route } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { AVAILABILITY_LABEL, daysSince, freshness } from "@/lib/labels";
import { AVAILABILITY_DAYS } from "@/lib/config";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressRing } from "@/components/ui/progress-ring";
import { HelpTip } from "@/components/ui/help-tip";
import { CvToOrg } from "@/components/ui/connect-art";
import { confirmAvailability, setAvailability } from "./actions";

export const metadata: Metadata = { title: "Mi espacio" };
export const dynamic = "force-dynamic";

const ROUTE = ["Perfil", "Visible", "Carta de aceptación", "Vinculación", "Formalización", "En práctica", "Cierre"];

export default async function StudentHome() {
  const session = await requireRole(["student"]);
  const supabase = await createClient();

  const [{ data: s }, { data: priv }, skills, soft, langs] = await Promise.all([
    supabase.from("students").select("*, programs(name)").eq("id", session.userId).single(),
    supabase.from("student_private").select("phone").eq("student_id", session.userId).single(),
    supabase.from("student_skills").select("skill_id", { count: "exact", head: true }).eq("student_id", session.userId),
    supabase.from("student_soft_skills").select("soft_skill_id", { count: "exact", head: true }).eq("student_id", session.userId),
    supabase.from("student_languages").select("id", { count: "exact", head: true }).eq("student_id", session.userId),
  ]);
  if (!s) return null;

  const checklist = [
    { done: !!s.program_id && s.progress_pct !== null, label: "Programa y avance", section: "academico" },
    { done: !!priv?.phone && !!s.city, label: "Datos de contacto", section: "personales" },
    { done: !!s.headline && !!s.about, label: "Titular y perfil profesional", section: "perfil" },
    { done: (skills.count ?? 0) >= 3, label: "Al menos 3 habilidades", section: "perfil" },
    { done: (soft.count ?? 0) >= 3, label: "Competencias transversales", section: "perfil" },
    { done: (langs.count ?? 0) >= 1, label: "Idiomas", section: "experiencia" },
    { done: s.modalities.length > 0 && !!s.dedication && !!s.practice_period, label: "Disponibilidad", section: "disponibilidad" },
    { done: s.consent_anonymous, label: "Autorización para aparecer", section: "documentos" },
  ];
  const done = checklist.filter((c) => c.done).length;
  const pct = Math.round((done / checklist.length) * 100);
  const pendingItem = checklist.find((c) => !c.done);
  const days = daysSince(s.last_confirmed_at);
  const fresh = freshness(s.last_confirmed_at);
  const listed = s.consent_anonymous && s.program_id && ["disponible", "en_proceso"].includes(s.availability);
  const program = (s.programs as { name: string } | null)?.name;
  const nearExpiry = s.availability === "disponible" && days !== null && days >= AVAILABILITY_DAYS - 15;
  const routeStep = s.availability === "en_practica" ? 6 : s.availability === "en_proceso" ? 3 : listed ? 2 : 1;

  const next = nearExpiry || s.availability === "sin_confirmar"
    ? { title: "Confirma que sigues buscando práctica", text: "Tu perfil deja de aparecer ante las empresas si no lo confirmas.", confirm: true }
    : pendingItem
      ? { title: `Completa: ${pendingItem.label.toLowerCase()}`, text: `Te faltan ${checklist.length - done} pasos para un perfil completo.`, href: `/estudiante/perfil?seccion=${pendingItem.section}` }
      : !listed
        ? { title: "Marca que estás disponible", text: "Así tu perfil aparece en las búsquedas de las empresas.", confirm: true }
        : { title: "Tu perfil está listo y visible", text: "Revisa cómo te ven las empresas y prepara tu carta de aceptación cuando te contacten.", href: "/estudiante/vista-previa" };

  return (
    <>
      <PageHeader
        kicker={program ?? "Mi espacio"}
        title={`Hola${session.fullName ? `, ${session.fullName.split(" ")[0]}` : ""}`}
        description={
          <span className={`chip mt-1 ${listed ? "chip-verde" : ""}`}>
            <span className={`status-dot ${listed ? "live" : ""}`} />
            {listed ? "Visible para empresas" : "Aún no apareces en las búsquedas"}
          </span>
        }
        actions={
          <>
            <Link href="/estudiante/vista-previa" className="btn btn-secondary">
              <Eye /> Cómo me ven
            </Link>
            <Link href="/estudiante/perfil" className="btn btn-primary">
              <PencilLine /> Editar perfil
            </Link>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="card overflow-hidden p-6 xl:col-span-2">
          <span className="accent-bar" />
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0 max-w-lg">
              <p className="text-xs font-black uppercase tracking-widest text-verde-tinta">Siguiente paso</p>
              <h2 className="display mt-1 text-2xl text-azul-oscuro">{next.title}</h2>
              <p className="mt-1 text-suave">{next.text}</p>
              <div className="mt-5">
                {"confirm" in next ? (
                  <form action={confirmAvailability}>
                    <button className="btn btn-primary">
                      <RefreshCcw /> Sigo buscando práctica
                    </button>
                  </form>
                ) : (
                  <Link href={next.href} className="btn btn-primary btn-arrow">
                    Continuar <ArrowRight />
                  </Link>
                )}
              </div>
            </div>
            <CvToOrg className="hidden w-56 sm:block" />
          </div>
        </section>

        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
            <CalendarDays className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Disponibilidad
            <HelpTip align="right">«Disponible» vence a los {AVAILABILITY_DAYS} días sin confirmar, para que las empresas no encuentren perfiles viejos.</HelpTip>
          </h2>
          <p className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`chip ${s.availability === "disponible" ? "chip-verde" : s.availability === "sin_confirmar" ? "chip-amarillo" : "chip-azul"}`}>
              {AVAILABILITY_LABEL[s.availability as keyof typeof AVAILABILITY_LABEL]}
            </span>
            {["disponible", "en_proceso"].includes(s.availability) && <span className="text-xs text-suave">{fresh.text}</span>}
          </p>
          {s.availability === "disponible" && days !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-suave">
                <span>Vigencia</span>
                <span>{Math.max(0, AVAILABILITY_DAYS - days)} días</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-superficie-2">
                <div className={`h-full rounded-full ${nearExpiry ? "bg-amarillo" : "bg-verde"}`} style={{ width: `${Math.max(4, 100 - (days / AVAILABILITY_DAYS) * 100)}%` }} />
              </div>
            </div>
          )}
          {nearExpiry && (
            <p className="mt-3 flex gap-2 text-xs text-amarillo-tinta">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> Confírmala pronto.
            </p>
          )}
          <form action={setAvailability} className="mt-4 space-y-2 border-t border-borde pt-4">
            <select name="availability" defaultValue={s.availability} className="input">
              <option value="disponible">Disponible: busco práctica</option>
              <option value="en_proceso">En proceso con una empresa</option>
              <option value="en_practica">Conseguí práctica</option>
              <option value="no_disponible">No estoy buscando por ahora</option>
            </select>
            <input type="date" name="practice_end_date" defaultValue={s.practice_end_date ?? ""} className="input" aria-label="Si conseguiste práctica, fecha de fin" title="Si conseguiste práctica, ¿cuándo termina?" />
            <button className="btn btn-secondary btn-sm w-full">Guardar estado</button>
          </form>
        </section>

        <section className="card p-6 xl:col-span-2">
          <div className="flex flex-wrap items-center gap-6">
            <ProgressRing value={pct} size={104} label="completo" />
            <div className="min-w-0 flex-1">
              <h2 className="font-black text-azul-oscuro">Tu perfil</h2>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {checklist.map((c) => (
                  <li key={c.label}>
                    <Link href={`/estudiante/perfil?seccion=${c.section}`} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-celeste ${c.done ? "text-verde-tinta" : "text-texto"}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-verde text-white" : "border-2 border-borde"}`}>
                        {c.done && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="flex items-center gap-2 font-black text-azul-oscuro">
            <Route className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Tu ruta
          </h2>
          <ol className="mt-4 space-y-2">
            {ROUTE.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-black ${i + 1 < routeStep ? "bg-verde text-white" : i + 1 === routeStep ? "bg-azul text-white" : "bg-superficie-2 text-suave"}`}
                >
                  {i + 1 < routeStep ? <BadgeCheck className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={i + 1 === routeStep ? "font-black text-azul-oscuro" : i + 1 < routeStep ? "text-suave line-through" : "text-suave"}>{step}</span>
              </li>
            ))}
          </ol>
          <Link href="/guia/estudiantes#ruta" className="mt-4 inline-flex items-center gap-1 text-sm font-black text-azul hover:underline">
            Qué hacer en cada paso <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
