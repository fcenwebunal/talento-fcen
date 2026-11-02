import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lightbulb, ListChecks, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Skill } from "@/lib/types";
import { AdminTitle } from "../admin-title";
import { addSkill } from "../actions";
import { SkillRow } from "./skill-row";

export const metadata: Metadata = { title: "Catálogo de habilidades" };
export const dynamic = "force-dynamic";

export default async function AdminCatalog() {
  const supabase = await createClient();
  const [{ data: domains }, { data: skills }, { data: usage }, { count: pending }] = await Promise.all([
    supabase.from("skill_domains").select("id, name").order("sort"),
    supabase.from("skills").select("id, name, domain_id, active, description, icon_path").eq("status", "approved").order("name"),
    supabase.from("student_skills").select("skill_id"),
    supabase.from("skills").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const count = (usage ?? []).reduce<Record<number, number>>((acc, u) => ({ ...acc, [u.skill_id]: (acc[u.skill_id] ?? 0) + 1 }), {});

  return (
    <div className="space-y-6">
      <AdminTitle
        icon={ListChecks}
        title="Catálogo de habilidades"
        description="Las habilidades que los estudiantes pueden declarar, con su descripción e ícono. El número indica cuántos la tienen."
      />
      {(pending ?? 0) > 0 && (
        <Link href="/admin/propuestas" className="card card-hover flex items-center gap-3 border-amarillo/40">
          <span className="icon-tile">
            <Lightbulb />
          </span>
          <span className="flex-1">
            <strong className="text-azul-oscuro">
              {pending} {pending === 1 ? "habilidad propuesta" : "habilidades propuestas"} por estudiantes
            </strong>
            <span className="block text-sm text-suave">Revíselas para agregarlas al catálogo, unirlas con una existente o rechazarlas.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-azul" />
        </Link>
      )}
      <form action={addSkill} className="card flex flex-wrap items-end gap-3">
        <label className="field min-w-56 flex-1">
          <span>Nueva habilidad</span>
          <input name="name" required className="input" />
        </label>
        <label className="field">
          <span>Área</span>
          <select name="domain_id" className="input">
            {(domains ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary">
          <Plus /> Agregar
        </button>
        <p className="w-full text-xs text-suave">Después de agregarla, use el lápiz para escribir su descripción y subir su ícono.</p>
      </form>
      <div className="grid gap-4 xl:grid-cols-2">
        {(domains ?? []).map((d) => (
          <div key={d.id} className="card">
            <h2 className="font-black text-azul-oscuro">{d.name}</h2>
            <ul className="mt-2 divide-y divide-borde text-sm">
              {((skills ?? []) as (Skill & { active: boolean })[])
                .filter((s) => s.domain_id === d.id)
                .map((s) => (
                  <SkillRow key={s.id} skill={s} domains={domains ?? []} count={count[s.id] ?? 0} active={s.active} />
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
