import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { addSkill, toggleSkill } from "../actions";

export const metadata: Metadata = { title: "Catálogo de habilidades" };
export const dynamic = "force-dynamic";

export default async function AdminCatalog() {
  const supabase = await createClient();
  const [{ data: domains }, { data: skills }, { data: usage }] = await Promise.all([
    supabase.from("skill_domains").select("id, name").order("sort"),
    supabase.from("skills").select("id, name, domain_id, active").order("name"),
    supabase.from("student_skills").select("skill_id"),
  ]);
  const count = (usage ?? []).reduce<Record<number, number>>((acc, u) => ({ ...acc, [u.skill_id]: (acc[u.skill_id] ?? 0) + 1 }), {});

  return (
    <div className="space-y-6">
      <h1 className="display text-3xl text-azul-oscuro">Catálogo de habilidades</h1>
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
        <button className="btn btn-primary">Agregar</button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {(domains ?? []).map((d) => (
          <div key={d.id} className="card">
            <h2 className="font-bold text-azul-oscuro">{d.name}</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {(skills ?? [])
                .filter((s) => s.domain_id === d.id)
                .map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3">
                    <span className={s.active ? "" : "text-suave line-through"}>
                      {s.name} <span className="text-xs text-suave">({count[s.id] ?? 0})</span>
                    </span>
                    <form action={toggleSkill}>
                      <input type="hidden" name="skill_id" value={s.id} />
                      <input type="hidden" name="active" value={String(s.active)} />
                      <button className="text-xs text-azul-medio hover:underline">{s.active ? "Desactivar" : "Activar"}</button>
                    </form>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
