"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Save, X } from "lucide-react";
import type { Skill, SkillDomain } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { SkillIcon } from "@/components/ui/skill-icon";
import { toggleSkill } from "../actions";
import { uploadSkillIcon } from "../skill-icon-upload";

export function SkillRow({ skill, domains, count, active }: { skill: Skill; domains: SkillDomain[]; count: number; active: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: skill.name, domain_id: skill.domain_id, description: skill.description ?? "" });
  const [icon, setIcon] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const { error: e } = await createClient()
      .from("skills")
      .update({ name: form.name.trim(), domain_id: form.domain_id, description: form.description.trim() || null })
      .eq("id", skill.id);
    let message = e ? (e.code === "23505" ? "Ya existe una habilidad con ese nombre." : "No se pudo guardar.") : null;
    if (!message && icon) message = await uploadSkillIcon(skill.id, icon);
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    setEditing(false);
    setIcon(null);
    router.refresh();
  }

  if (!editing) {
    return (
      <li className="flex items-start gap-3 py-2">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-superficie">
          <SkillIcon path={skill.icon_path} className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={active ? "font-black text-azul-oscuro" : "font-black text-suave line-through"}>{skill.name}</span>{" "}
          <span className="text-xs text-suave">({count})</span>
          <span className="block text-xs text-suave">{skill.description ?? "Sin descripción"}</span>
        </span>
        <button type="button" onClick={() => setEditing(true)} className="rounded-md p-1.5 text-azul-medio hover:bg-celeste" title="Editar" aria-label={`Editar ${skill.name}`}>
          <Pencil className="h-4 w-4" />
        </button>
        <form action={toggleSkill}>
          <input type="hidden" name="skill_id" value={skill.id} />
          <input type="hidden" name="active" value={String(active)} />
          <button className="mt-1 text-xs text-azul-medio hover:underline">{active ? "Desactivar" : "Activar"}</button>
        </form>
      </li>
    );
  }

  return (
    <li className="my-2 space-y-3 rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] bg-celeste p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span>Nombre</span>
          <input className="input" value={form.name} maxLength={60} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Grupo</span>
          <select className="input" value={form.domain_id} onChange={(e) => setForm({ ...form, domain_id: Number(e.target.value) })}>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Descripción</span>
        <textarea className="input min-h-20" maxLength={280} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      <label className="field">
        <span>Ícono (SVG recomendado, máximo 256 KB)</span>
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white">
            {icon ? <span className="text-[0.625rem] text-suave">nuevo</span> : <SkillIcon path={skill.icon_path} className="h-5 w-5" />}
          </span>
          <input className="input" type="file" accept="image/svg+xml,image/png,image/webp" onChange={(e) => setIcon(e.target.files?.[0] ?? null)} />
        </span>
      </label>
      {error && <p className="text-sm text-naranja">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy || form.name.trim().length < 2} className="btn btn-primary btn-sm">
          {busy ? <Loader2 className="animate-spin" /> : <Save />} Guardar
        </button>
        <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
          <X /> Cancelar
        </button>
      </div>
    </li>
  );
}
