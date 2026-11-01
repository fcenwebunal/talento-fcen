import type { Metadata } from "next";
import { Atom, BarChart3, Blocks, Code2, Dna, Presentation, Sigma, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";

const DOMAIN_ICON: Record<string, typeof Blocks> = {
  "Datos y estadística": BarChart3,
  Computación: Code2,
  "Matemáticas aplicadas": Sigma,
  "Física aplicada e instrumentación": Atom,
  "Biología y bioprocesos": Dna,
  Herramientas: Wrench,
  "Docencia y divulgación": Presentation,
};

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
    <>
      <PageHeader
        kicker="Catálogo"
        icon={Blocks}
        title="Habilidades de la Facultad"
        description="Las habilidades que los estudiantes de la FCEN pueden declarar en su perfil, agrupadas por área. Las resaltadas son las más declaradas."
      />
    <div className="wrap -mt-4">
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {(domains ?? []).map((d, i) => {
          const Icon = DOMAIN_ICON[d.name] ?? Blocks;
          return (
          <Reveal as="section" key={d.id} index={i} className="card card-hover">
            <h2 className="flex items-center gap-3 font-black text-azul-oscuro">
              <span className={`icon-tile ${i % 2 ? "icon-tile-verde" : ""}`}><Icon /></span>
              {d.name}
            </h2>
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
          </Reveal>
          );
        })}
      </div>
    </div>
    </>
  );
}
