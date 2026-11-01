"use client";

import { useMemo, useState } from "react";
import type { Skill, SkillDomain } from "@/lib/types";
import { SKILL_LEVEL, SKILL_LEVEL_HELP } from "@/lib/labels";

export type StudentSkill = { skill_id: number; level: number; evidence_url: string | null };

export function SkillsPicker({
  catalog,
  domains,
  value,
  onChange,
}: {
  catalog: Skill[];
  domains: SkillDomain[];
  value: StudentSkill[];
  onChange: (value: StudentSkill[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<number | "">("");
  const selected = new Set(value.map((v) => v.skill_id));
  const byId = useMemo(() => new Map(catalog.map((s) => [s.id, s])), [catalog]);

  const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const options = catalog.filter(
    (s) => !selected.has(s.id) && (domain === "" || s.domain_id === domain) && (!query || normalize(s.name).includes(normalize(query)))
  );

  function update(id: number, patch: Partial<StudentSkill>) {
    onChange(value.map((v) => (v.skill_id === id ? { ...v, ...patch } : v)));
  }

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((v) => (
            <div key={v.skill_id} className="grid items-center gap-2 rounded-lg border border-borde bg-superficie p-3 md:grid-cols-[1fr_auto_1.2fr_auto]">
              <span className="font-bold">{byId.get(v.skill_id)?.name}</span>
              <div className="flex gap-1" role="radiogroup" aria-label="Nivel">
                {[1, 2, 3].map((l) => (
                  <button
                    key={l}
                    type="button"
                    title={SKILL_LEVEL_HELP[l]}
                    onClick={() => update(v.skill_id, { level: l })}
                    className={`rounded-md border px-2.5 py-1 text-xs font-bold ${v.level === l ? "border-azul bg-azul text-white" : "border-borde bg-white text-suave"}`}
                  >
                    {SKILL_LEVEL[l]}
                  </button>
                ))}
              </div>
              <input
                className="input"
                type="url"
                placeholder="Enlace a evidencia (opcional): proyecto, certificado…"
                value={v.evidence_url ?? ""}
                onChange={(e) => update(v.skill_id, { evidence_url: e.target.value || null })}
              />
              <button type="button" className="text-sm text-naranja hover:underline" onClick={() => onChange(value.filter((x) => x.skill_id !== v.skill_id))}>
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-dashed border-borde p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input className="input" placeholder="Buscar una habilidad o herramienta: Python, encuestas, sensores…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="input" value={domain} onChange={(e) => setDomain(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Todas las áreas</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
          {options.slice(0, 60).map((s) => (
            <button
              key={s.id}
              type="button"
              className="chip hover:border-azul hover:text-azul"
              onClick={() => {
                onChange([...value, { skill_id: s.id, level: 1, evidence_url: null }]);
                setQuery("");
              }}
            >
              + {s.name}
            </button>
          ))}
          {options.length === 0 && <p className="text-sm text-suave">No hay coincidencias en el catálogo.</p>}
        </div>
        <p className="mt-3 text-xs text-suave">
          Niveles: <strong>Básico</strong>, lo usé en clase; <strong>Intermedio</strong>, lo usé en un proyecto real;{" "}
          <strong>Avanzado</strong>, puedo enseñarlo. ¿Falta una habilidad? Escríbenos y la agregamos al catálogo.
        </p>
      </div>
    </div>
  );
}
