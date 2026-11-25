"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, EyeOff, Info, Loader2, Lock, RotateCcw, Save, TriangleAlert } from "lucide-react";
import { PROFILE_SECTIONS, type RequirementConfig } from "@/lib/requirements";
import { saveRequirements } from "./actions";

export type MatrixRow = { student_id: string; base_listed: boolean; vals: Record<string, number> | null };

type Draft = Record<string, { required: boolean; min: number | null }>;

const toDraft = (config: RequirementConfig[]): Draft =>
  Object.fromEntries(config.map((c) => [c.key, { required: c.required, min: c.min_count }]));

const meets = (vals: Record<string, number> | null, key: string, min: number | null) => (vals?.[key] ?? 0) >= (min ?? 1);

function completeCount(matrix: MatrixRow[], draft: Draft, onlyListed: boolean) {
  const required = Object.entries(draft).filter(([, d]) => d.required);
  return matrix.filter((m) => (!onlyListed || m.base_listed) && required.every(([key, d]) => meets(m.vals, key, d.min))).length;
}

export function RequirementsForm({
  config,
  matrix,
  canEdit,
  lastChange,
}: {
  config: RequirementConfig[];
  matrix: MatrixRow[];
  canEdit: boolean;
  lastChange: string | null;
}) {
  const router = useRouter();
  const saved = useMemo(() => toDraft(config), [config]);
  const [draft, setDraft] = useState<Draft>(saved);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const dirty = config.some((c) => draft[c.key].required !== c.required || (draft[c.key].required && draft[c.key].min !== c.min_count));
  const total = matrix.length;
  const completeDraft = completeCount(matrix, draft, false);
  const listedNow = completeCount(matrix, saved, true);
  const listedDraft = completeCount(matrix, draft, true);
  const requiredCount = Object.values(draft).filter((d) => d.required).length;

  const set = (key: string, patch: Partial<Draft[string]>) => {
    setResult(null);
    setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };
  const setSection = (section: string, required: boolean) => {
    setResult(null);
    setDraft((prev) => {
      const next = { ...prev };
      for (const c of config.filter((x) => x.section === section)) next[c.key] = { ...next[c.key], required };
      return next;
    });
  };

  function save() {
    const items = config
      .filter((c) => draft[c.key].required !== c.required || draft[c.key].min !== c.min_count)
      .map((c) => ({ key: c.key, required: draft[c.key].required, min: draft[c.key].min }));
    startTransition(async () => {
      const r = await saveRequirements(items);
      setResult(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="card flex gap-3 text-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-azul" aria-hidden="true" />
        <div className="space-y-1.5">
          <p>
            <strong className="text-azul-oscuro">Lo que pasa con un dato obligatorio.</strong> El estudiante lo ve marcado con{" "}
            <span className="font-black text-naranja">*</span> en su perfil, junto con un aviso de lo que le falta en cada sección. Mientras le falte algo
            obligatorio, su hoja de vida <strong>no aparece ante las empresas</strong> (búsqueda, exportaciones y Recoger datos) y{" "}
            <strong>no puede postularse a convocatorias</strong>. Puede seguir guardando su avance aunque esté incompleta.
          </p>
          <p className="text-suave">
            En las listas, «al menos» es el número mínimo de entradas. Los números de cada dato cuentan a los {total} estudiantes con rol de estudiante.
            {lastChange && ` ${lastChange}`}
          </p>
          {!canEdit && (
            <p className="flex items-center gap-1.5 font-black text-amarillo-tinta">
              <Lock className="h-4 w-4" aria-hidden="true" /> Solo un administrador puede cambiar esta configuración.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {PROFILE_SECTIONS.map((sec) => {
          const items = config.filter((c) => c.section === sec.id);
          const on = items.filter((c) => draft[c.key].required).length;
          return (
            <section key={sec.id} className="card p-0">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-5 py-4">
                <div>
                  <h2 className="font-black text-azul-oscuro">{sec.label}</h2>
                  <p className="text-xs text-suave">
                    {on === 0 ? "Nada obligatorio" : `${on} de ${items.length} obligatorios`}
                  </p>
                </div>
                <SectionToggle
                  checked={on === items.length}
                  mixed={on > 0 && on < items.length}
                  disabled={!canEdit}
                  onChange={(v) => setSection(sec.id, v)}
                />
              </header>
              <ul className="divide-y divide-borde">
                {items.map((c) => {
                  const d = draft[c.key];
                  const have = matrix.filter((m) => meets(m.vals, c.key, d.min)).length;
                  const changed = d.required !== c.required || (d.required && d.min !== c.min_count);
                  return (
                    <li key={c.key} className={`flex flex-wrap items-center gap-3 px-5 py-2.5 ${changed ? "bg-amarillo/10" : ""}`}>
                      <label className={`flex min-w-0 flex-1 items-center gap-3 text-sm ${canEdit ? "cursor-pointer" : ""}`}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 accent-[var(--azul)]"
                          checked={d.required}
                          disabled={!canEdit}
                          onChange={(e) => set(c.key, { required: e.target.checked })}
                        />
                        <span className={d.required ? "font-black text-azul-oscuro" : "text-texto"}>{c.label}</span>
                      </label>
                      {c.max_count !== null && (
                        <label className="flex items-center gap-1.5 text-xs text-suave">
                          al menos
                          <input
                            type="number"
                            className="input w-16 px-2 py-1 text-sm"
                            min={1}
                            max={c.max_count}
                            value={d.min ?? 1}
                            disabled={!canEdit || !d.required}
                            onChange={(e) => {
                              const n = Math.round(Number(e.target.value));
                              if (Number.isFinite(n)) set(c.key, { min: Math.min(c.max_count!, Math.max(1, n)) });
                            }}
                            aria-label={`Mínimo de ${c.label}`}
                          />
                        </label>
                      )}
                      <span className="w-28 text-right text-xs text-suave" title="Estudiantes que ya lo cumplen">
                        {have} de {total} lo tienen
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-[0.875rem_0.875rem_0.875rem_0.1875rem] border border-borde bg-white/95 p-3 shadow-lg backdrop-blur">
        <div className="min-w-0 flex-1 text-sm">
          <p>
            <strong className="text-azul-oscuro">{requiredCount} datos obligatorios.</strong> Con esta configuración,{" "}
            <strong>{completeDraft} de {total}</strong> estudiantes tienen la hoja de vida completa y{" "}
            <strong>{listedDraft}</strong> {listedDraft === 1 ? "aparece" : "aparecen"} ante las empresas{dirty ? ` (hoy ${listedNow})` : ""}.
          </p>
          {dirty && listedDraft < listedNow && (
            <p className="flex items-center gap-1.5 text-xs font-black text-amarillo-tinta">
              <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              Al guardar, {listedNow - listedDraft === 1 ? "1 hoja de vida que hoy ven las empresas deja" : `${listedNow - listedDraft} hojas de vida que hoy ven las empresas dejan`} de
              aparecer hasta que se complete.
            </p>
          )}
        </div>
        {result && (
          <p className={`flex items-center gap-1.5 text-sm font-black ${result.ok ? "text-verde-tinta" : "text-naranja"}`} role="status">
            {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
            {result.message}
          </p>
        )}
        {canEdit && (
          <>
            <button type="button" className="btn btn-ghost" disabled={!dirty || pending} onClick={() => { setDraft(saved); setResult(null); }}>
              <RotateCcw /> Deshacer
            </button>
            <button type="button" className="btn btn-primary" disabled={!dirty || pending} onClick={save}>
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SectionToggle({ checked, mixed, disabled, onChange }: { checked: boolean; mixed: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  return (
    <label className={`flex items-center gap-2 text-xs font-black text-azul ${disabled ? "" : "cursor-pointer"}`}>
      <input ref={ref} type="checkbox" className="h-4 w-4 accent-[var(--azul)]" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      Toda la sección obligatoria
    </label>
  );
}
