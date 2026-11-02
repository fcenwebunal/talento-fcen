"use client";

import { useState } from "react";
import { Compass, GraduationCap, Languages, MapPin, RotateCcw, Search, SlidersHorizontal, Sparkles, Target, X } from "lucide-react";
import type { Area, Program, Skill } from "@/lib/types";
import { LEVEL_LABEL } from "@/lib/labels";
import { HelpTip } from "./ui/help-tip";

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
  const [open, setOpen] = useState(false);
  const byId = new Map(skills.map((s) => [s.id, s]));
  const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const suggestions = query ? skills.filter((s) => !selected.includes(s.id) && normalize(s.name).includes(normalize(query))).slice(0, 8) : [];
  const activeCount =
    selected.length + initial.program_ids.length + initial.area_ids.length + (initial.modality ? 1 : 0) + (initial.city ? 1 : 0) + (initial.language ? 1 : 0) + (initial.q ? 1 : 0);

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <button type="button" onClick={() => setOpen(!open)} className="btn btn-secondary mb-3 w-full lg:hidden">
        <SlidersHorizontal /> Filtros {activeCount > 0 && <span className="chip chip-azul px-2 py-0">{activeCount}</span>}
      </button>
      <form action={action} method="get" className={`card space-y-5 ${open ? "block" : "hidden"} lg:block`}>
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-black text-azul-oscuro">
            <SlidersHorizontal className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Filtros
          </p>
          {activeCount > 0 && (
            <a href={action} className="flex items-center gap-1 text-xs font-black text-suave hover:text-azul">
              <RotateCcw className="h-3.5 w-3.5" /> Limpiar
            </a>
          )}
        </div>

        <label className="field">
          <span>Palabras clave</span>
          <div className="input-icon">
            <Search aria-hidden="true" />
            <input name="q" defaultValue={initial.q} className="input" placeholder="series de tiempo, sensores…" />
          </div>
        </label>

        <div className="field">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-verde-tinta" aria-hidden="true" /> Habilidades
            <HelpTip>Los perfiles que tienen más de las habilidades elegidas aparecen primero. Puede exigir que tengan todas.</HelpTip>
          </span>
          {selected.map((id) => (
            <input key={id} type="hidden" name="habilidad" value={id} />
          ))}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((id) => (
                <button key={id} type="button" className="chip chip-azul" onClick={() => setSelected(selected.filter((x) => x !== id))}>
                  {byId.get(id)?.name} <X />
                </button>
              ))}
            </div>
          )}
          <input className="input" placeholder="Agregar habilidad…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5" style={{ animation: "fade-in 0.2s both" }}>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="chip"
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

        <Select name="programa" label="Programa" icon={GraduationCap} defaultValue={initial.program_ids[0] ? String(initial.program_ids[0]) : ""}>
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
        </Select>

        <Select name="area" label="Área de interés" icon={Target} defaultValue={initial.area_ids[0] ? String(initial.area_ids[0]) : ""}>
          <option value="">Todas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>

        <Select name="modalidad" label="Modalidad" icon={Compass} defaultValue={initial.modality}>
          <option value="">Cualquiera</option>
          <option value="presencial">Presencial</option>
          <option value="remota">Remota</option>
          <option value="hibrida">Híbrida</option>
        </Select>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
          <label className="field">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Ciudad
            </span>
            <input name="ciudad" defaultValue={initial.city} className="input" placeholder="Manizales" />
          </label>
          <label className="field">
            <span className="flex items-center gap-1.5">
              <Languages className="h-4 w-4 text-azul-medio" aria-hidden="true" /> Idioma
            </span>
            <input name="idioma" defaultValue={initial.language} className="input" placeholder="Inglés" />
          </label>
        </div>

        {staff && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="todos" value="1" defaultChecked={initial.include_unlisted} className="mt-1" /> Incluir perfiles que no aparecen ante empresas
          </label>
        )}

        <button className="btn btn-primary w-full">
          <Search /> Buscar
        </button>
      </form>
    </div>
  );
}

function Select({
  name,
  label,
  icon: Icon,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  icon: typeof Search;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="flex items-center gap-1.5">
        <Icon className="h-4 w-4 text-azul-medio" aria-hidden="true" /> {label}
      </span>
      <select name={name} defaultValue={defaultValue} className="input">
        {children}
      </select>
    </label>
  );
}
