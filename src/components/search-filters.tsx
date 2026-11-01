"use client";

import { useState } from "react";
import type { Area, Program, Skill } from "@/lib/types";
import { LEVEL_LABEL } from "@/lib/labels";

type Initial = {
  q: string;
  program_ids: number[];
  skill_ids: number[];
  require_all_skills: boolean;
  min_skill_level: number;
  area_ids: number[];
  modality: string;
  city: string;
  language: string;
  include_unlisted?: boolean;
};

export function SearchFilters({
  action,
  initial,
  programs,
  skills,
  areas,
  staff = false,
}: {
  action: string;
  initial: Initial;
  programs: Program[];
  skills: Skill[];
  areas: Area[];
  staff?: boolean;
}) {
  const [selected, setSelected] = useState<number[]>(initial.skill_ids);
  const [query, setQuery] = useState("");
  const byId = new Map(skills.map((s) => [s.id, s]));
  const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const suggestions = query
    ? skills.filter((s) => !selected.includes(s.id) && normalize(s.name).includes(normalize(query))).slice(0, 8)
    : [];

  return (
    <form action={action} method="get" className="card space-y-4">
      <label className="field">
        <span>Palabras clave</span>
        <input name="q" defaultValue={initial.q} className="input" placeholder="series de tiempo, sensores, R…" />
      </label>

      <div className="field">
        <span>Habilidades</span>
        {selected.map((id) => (
          <input key={id} type="hidden" name="habilidad" value={id} />
        ))}
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <button key={id} type="button" className="chip chip-azul" onClick={() => setSelected(selected.filter((x) => x !== id))}>
              {byId.get(id)?.name} ✕
            </button>
          ))}
        </div>
        <input className="input" placeholder="Agregar habilidad…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="chip hover:border-azul"
                onClick={() => {
                  setSelected([...selected, s.id]);
                  setQuery("");
                }}
              >
                + {s.name}
              </button>
            ))}
          </div>
        )}
        {selected.length > 1 && (
          <label className="flex items-center gap-2 text-sm font-normal">
            <input type="checkbox" name="todas" value="1" defaultChecked={initial.require_all_skills} /> Que tenga todas
          </label>
        )}
        <select name="nivel_habilidad" defaultValue={String(initial.min_skill_level)} className="input">
          <option value="1">Cualquier nivel</option>
          <option value="2">Intermedio o más</option>
          <option value="3">Solo avanzado</option>
        </select>
      </div>

      <label className="field">
        <span>Programa</span>
        <select name="programa" defaultValue={initial.program_ids[0] ? String(initial.program_ids[0]) : ""} className="input">
          <option value="">Todos</option>
          {(["pregrado", "especializacion", "maestria", "doctorado"] as const).map((level) => (
            <optgroup key={level} label={LEVEL_LABEL[level]}>
              {programs
                .filter((p) => p.level === level)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Área de interés</span>
        <select name="area" defaultValue={initial.area_ids[0] ? String(initial.area_ids[0]) : ""} className="input">
          <option value="">Todas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Modalidad</span>
        <select name="modalidad" defaultValue={initial.modality} className="input">
          <option value="">Cualquiera</option>
          <option value="presencial">Presencial</option>
          <option value="remota">Remota</option>
          <option value="hibrida">Híbrida</option>
        </select>
      </label>

      <label className="field">
        <span>Ciudad</span>
        <input name="ciudad" defaultValue={initial.city} className="input" placeholder="Manizales" />
      </label>

      <label className="field">
        <span>Idioma</span>
        <input name="idioma" defaultValue={initial.language} className="input" placeholder="Inglés" />
      </label>

      {staff && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="todos" value="1" defaultChecked={initial.include_unlisted} /> Incluir perfiles que no aparecen ante empresas
        </label>
      )}

      <div className="flex gap-2">
        <button className="btn btn-primary flex-1">Buscar</button>
        <a href={action} className="btn btn-ghost">
          Limpiar
        </a>
      </div>
    </form>
  );
}
