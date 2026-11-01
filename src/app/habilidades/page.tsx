import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Habilidades de la Facultad" };
export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const supabase = await createClient();
  const [{ data: domains }, { data: skills }, { data: stats }] = await Promise.all([
    supabase.from("skill_domains").select("id, name").order("sort"),
    supabase.from("skills").select("id, name, domain_id").eq("active", true).order("name"),
    supabase.rpc("public_stats"),
  ]);
  const counts = new Map(((stats as { top_skills: { skill: string; count: number }[] } | null)?.top_skills ?? []).map((s) => [s.skill, s.count]));

  return (
    <div className="wrap py-12">
      <p className="text-sm font-bold uppercase tracking-wider text-verde-tinta">Catálogo</p>
      <h1 className="display mt-1 text-4xl text-azul-oscuro">Habilidades de la Facultad</h1>
      <p className="mt-3 max-w-2xl text-suave">
        Las habilidades que los estudiantes de la FCEN pueden declarar en su perfil, agrupadas por área. Las que muestran un número son
        las más declaradas en la plataforma.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {(domains ?? []).map((d) => (
          <section key={d.id} className="card">
            <h2 className="font-bold text-azul-oscuro">{d.name}</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(skills ?? [])
                .filter((s) => s.domain_id === d.id)
                .map((s) => (
                  <span key={s.id} className={`chip ${counts.has(s.name) ? "chip-verde" : ""}`}>
                    {s.name}
                    {counts.has(s.name) && <strong>· {counts.get(s.name)}</strong>}
                  </span>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
