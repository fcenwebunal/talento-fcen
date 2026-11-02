"use client";

import { useMemo, useState } from "react";
import { Lightbulb, Loader2, Plus, X } from "lucide-react";
import type { Skill, SkillDomain } from "@/lib/types";
import { SKILL_LEVEL, SKILL_LEVEL_HELP } from "@/lib/labels";
import { createClient } from "@/lib/supabase/client";
import { SkillIcon } from "@/components/ui/skill-icon";

export type StudentSkill = { skill_id: number; level: number; evidence_url: string | null };

const PROPOSE_ERRORS: Record<string, string> = {
  LIMIT: "Ya tienes 5 habilidades propuestas en revisión. Espera a que la Facultad las revise.",
  INVALID: "Revisa el nombre (entre 2 y 60 caracteres) y elige un grupo.",
};

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
  const [proposed, setProposed] = useState<Skill[]>([]);
  const [proposing, setProposing] = useState(false);
  const [draft, setDraft] = useState({ domain: "" as number | "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const all = useMemo(() => [...catalog, ...proposed.filter((p) => !catalog.some((c) => c.id === p.id))], [catalog, proposed]);
  const byId = useMemo(() => new Map(all.map((s) => [s.id, s])), [all]);
  const selected = new Set(value.map((v) => v.skill_id));

  const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const options = all.filter(
    (s) => !selected.has(s.id) && (domain === "" || s.domain_id === domain) && (!query || normalize(s.name).includes(normalize(query)))
  );
  const exact = query.trim() && all.some((s) => normalize(s.name) === normalize(query));

  function update(id: number, patch: Partial<StudentSkill>) {
    onChange(value.map((v) => (v.skill_id === id ? { ...v, ...patch } : v)));
  }

  function add(id: number) {
    if (!selected.has(id)) onChange([...value, { skill_id: id, level: 1, evidence_url: null }]);
    setQuery("");
  }

  function openProposal() {
    setDraft({ domain: domain === "" ? "" : domain, description: "" });
    setError(null);
    setProposing(true);
  }

  async function propose() {
    const name = query.trim();
    if (!name || draft.domain === "") {
      setError(PROPOSE_ERRORS.INVALID);
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("propose_skill", {
      p_name: name,
      p_domain: draft.domain,
      p_description: draft.description.trim() || null,
    });
    setBusy(false);
    if (rpcError || typeof data !== "number") {
      const code = rpcError?.message.split(":")[0] ?? "";
      setError(PROPOSE_ERRORS[code] ?? "No se pudo enviar la propuesta. Inténtalo de nuevo.");
      return;
    }
    if (!byId.has(data)) {
      setProposed((list) => [...list, { id: data, name, domain_id: draft.domain as number, description: draft.description.trim() || null, status: "pending" }]);
    }
    add(data);
    setProposing(false);
  }

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((v) => {
            const skill = byId.get(v.skill_id);
            return (
              <div key={v.skill_id} className="grid items-center gap-2 rounded-lg border border-borde bg-superficie p-3 md:grid-cols-[1fr_auto_1.2fr_auto]">
                <span className="flex flex-wrap items-center gap-2 font-black">
                  <SkillIcon path={skill?.icon_path} className="h-4 w-4" />
                  {skill?.name}
                  {skill?.status === "pending" && (
                    <span className="chip chip-amarillo chip-pending py-0 text-[0.6875rem] font-normal" title="La Facultad la revisa antes de agregarla al catálogo">
                      En revisión
                    </span>
                  )}
                </span>
                <div className="flex gap-1" role="radiogroup" aria-label="Nivel">
                  {[1, 2, 3].map((l) => (
                    <button
                      key={l}
                      type="button"
                      title={SKILL_LEVEL_HELP[l]}
                      onClick={() => update(v.skill_id, { level: l })}
                      className={`rounded-md border px-2.5 py-1 text-xs font-black ${v.level === l ? "border-azul bg-azul text-white" : "border-borde bg-white text-suave"}`}
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
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-dashed border-borde p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            className="input"
            placeholder="Buscar una habilidad o herramienta: Python, encuestas, sensores…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setProposing(false);
            }}
          />
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
            <button key={s.id} type="button" className={`chip ${s.status === "pending" ? "chip-pending" : ""}`} title={s.description ?? undefined} onClick={() => add(s.id)}>
              <SkillIcon path={s.icon_path} /> {s.name}
            </button>
          ))}
          {options.length === 0 && <p className="text-sm text-suave">No hay coincidencias en el catálogo.</p>}
        </div>

        {query.trim().length >= 2 && !exact && !proposing && (
          <button type="button" onClick={openProposal} className="mt-3 inline-flex items-center gap-2 text-sm font-black text-azul hover:underline">
            <Lightbulb className="h-4 w-4" aria-hidden="true" /> Proponer «{query.trim()}» como habilidad nueva
          </button>
        )}

        {proposing && (
          <div className="mt-3 space-y-3 rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] bg-celeste p-3" style={{ animation: "fade-up 0.25s var(--ease-out) both" }}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">
                <strong className="text-azul-oscuro">Proponer «{query.trim()}»</strong>
                <span className="block text-suave">La usas de inmediato en tu perfil, marcada como en revisión. Cuando la Facultad la apruebe, queda en el catálogo para todos.</span>
              </p>
              <button type="button" onClick={() => setProposing(false)} className="rounded-md p-1 text-suave hover:bg-white" aria-label="Cancelar propuesta">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="field">
              <span>Grupo</span>
              <select className="input" value={draft.domain} onChange={(e) => setDraft({ ...draft, domain: e.target.value ? Number(e.target.value) : "" })}>
                <option value="">Elige un grupo</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Descripción breve (opcional)</span>
              <textarea
                className="input min-h-20"
                maxLength={280}
                placeholder="¿En qué consiste? Por ejemplo: análisis de imágenes satelitales con Python."
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            {error && <p className="text-sm text-naranja">{error}</p>}
            <button type="button" onClick={propose} disabled={busy} className="btn btn-primary btn-sm">
              {busy ? <Loader2 className="animate-spin" /> : <Plus />} Proponer y agregar a mi perfil
            </button>
          </div>
        )}

        <p className="mt-3 text-xs text-suave">
          Niveles: <strong>Básico</strong>, lo usé en clase; <strong>Intermedio</strong>, lo usé en un proyecto real;{" "}
          <strong>Avanzado</strong>, puedo enseñarlo. ¿Falta una habilidad? Escríbela en el buscador y proponla.
        </p>
      </div>
    </div>
  );
}
