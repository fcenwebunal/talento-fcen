import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { AVAILABILITY_LABEL, daysSince, freshness } from "@/lib/labels";
import { AVAILABILITY_DAYS } from "@/lib/config";
import { confirmAvailability, setAvailability } from "./actions";

export const metadata: Metadata = { title: "Mi perfil" };
export const dynamic = "force-dynamic";

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

  return (
    <div className="wrap py-10">
      <p className="text-sm text-suave">Hola{session.fullName ? `, ${session.fullName.split(" ")[0]}` : ""}</p>
      <h1 className="display text-3xl text-azul-oscuro">Mi perfil en Talento FCEN</h1>
      {program && <p className="mt-1 text-suave">{program}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-azul-oscuro">Fuerza del perfil</h2>
            <span className="display text-2xl text-azul">{pct}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-superficie-2">
            <div className="h-full rounded-full bg-verde transition-all" style={{ width: `${pct}%` }} />
          </div>
          <ul className="mt-5 space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${c.done ? "bg-verde text-white" : "border border-borde text-suave"}`}>
                    {c.done ? "✓" : ""}
                  </span>
                  {c.label}
                </span>
                {!c.done && (
                  <Link href={`/estudiante/perfil?seccion=${c.section}`} className="text-azul-medio underline underline-offset-2">
                    Completar
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/estudiante/perfil" className="btn btn-primary">
              Editar mi perfil
            </Link>
            <Link href="/estudiante/vista-previa" className="btn btn-secondary">
              Ver cómo me ven las empresas
            </Link>
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold text-azul-oscuro">Mi disponibilidad</h2>
          <p className="mt-2">
            <span className={`chip ${s.availability === "disponible" ? "chip-verde" : s.availability === "sin_confirmar" ? "chip-amarillo" : ""}`}>
              {AVAILABILITY_LABEL[s.availability as keyof typeof AVAILABILITY_LABEL]}
            </span>
            {["disponible", "en_proceso"].includes(s.availability) && <span className="ml-2 text-sm text-suave">{fresh.text}</span>}
          </p>
          <p className="mt-3 text-sm text-suave">
            {listed
              ? "Tu perfil aparece en las búsquedas de las empresas."
              : "Tu perfil no aparece en las búsquedas. Para aparecer: completa tu programa, autoriza aparecer ante empresas y marca que estás disponible."}
          </p>
          {s.availability === "disponible" && days !== null && days >= AVAILABILITY_DAYS - 15 && (
            <p className="mt-3 rounded-lg bg-amarillo/15 p-3 text-sm text-amarillo-tinta">
              Confirma que sigues buscando práctica: a los {AVAILABILITY_DAYS} días sin confirmar, tu perfil deja de aparecer.
            </p>
          )}
          {["disponible", "en_proceso", "sin_confirmar", "no_disponible"].includes(s.availability) && (
            <form action={confirmAvailability} className="mt-4">
              <button className="btn btn-primary w-full">Sigo buscando práctica</button>
            </form>
          )}
          <form action={setAvailability} className="mt-4 space-y-3 border-t border-borde pt-4">
            <label className="field">
              <span>Cambiar mi estado</span>
              <select name="availability" defaultValue={s.availability} className="input">
                <option value="disponible">Disponible: busco práctica</option>
                <option value="en_proceso">En proceso con una empresa</option>
                <option value="en_practica">Conseguí práctica</option>
                <option value="no_disponible">No estoy buscando por ahora</option>
              </select>
            </label>
            <label className="field">
              <span>Si conseguiste práctica, ¿cuándo termina?</span>
              <input type="date" name="practice_end_date" defaultValue={s.practice_end_date ?? ""} className="input" />
            </label>
            <button className="btn btn-secondary">Guardar estado</button>
          </form>
        </section>
      </div>

      <section className="mt-6 card bg-superficie">
        <h2 className="font-bold text-azul-oscuro">¿Cómo sigue tu práctica?</h2>
        <p className="mt-1 text-sm text-suave">
          Revisa la ruta en 7 pasos, los documentos que vas a necesitar y tus derechos durante la práctica.
        </p>
        <Link href="/guia/estudiantes" className="btn btn-secondary mt-4">
          Abrir la guía del estudiante
        </Link>
      </section>
    </div>
  );
}
