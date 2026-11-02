"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, GitMerge, Loader2, Trash2 } from "lucide-react";
import type { Skill, SkillDomain } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/labels";
import { uploadSkillIcon } from "../skill-icon-upload";

export type Proposal = Skill & { created_at: string; proposer: { full_name: string | null; email: string } | null; students: number };

export function ReviewCard({ proposal, domains, approved }: { proposal: Proposal; domains: SkillDomain[]; approved: Skill[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: proposal.name, domain_id: proposal.domain_id, description: proposal.description ?? "" });
  const [icon, setIcon] = useState<File | null>(null);
  const [target, setTarget] = useState<number | "">("");
  const [busy, setBusy] = useState<"approve" | "merge" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(action: "approve" | "merge" | "reject") {
    if (action === "merge" && target === "") {
      setError("Elija la habilidad del catálogo con la que se une.");
      return;
    }
    if (action === "reject" && !window.confirm(`¿Rechazar «${proposal.name}»? Se quitará del perfil de ${proposal.students} estudiante(s).`)) return;
    setBusy(action);
    setError(null);
    const { error: e } = await createClient().rpc("review_skill", {
      p_skill: proposal.id,
      p_action: action,
      p_name: form.name.trim(),
      p_domain: form.domain_id,
      p_description: form.description.trim() || null,
      p_target: target === "" ? null : target,
    });
    let message = e ? (e.code === "23505" ? "Ya existe una habilidad con ese nombre: únala con ella." : e.message.replace(/^[A-Z_]+: /, "")) : null;
    if (!message && action === "approve" && icon) message = await uploadSkillIcon(proposal.id, icon);
    setBusy(null);
    if (message) {
      setError(message);
      return;
    }
    router.refresh();
  }

  const domainName = (id: number) => domains.find((d) => d.id === id)?.name ?? "";

  return (
    <article className="card space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-lg text-azul-oscuro">{proposal.name}</h2>
          <p className="text-sm text-suave">
            Propuesta por {proposal.proposer?.full_name ?? proposal.proposer?.email ?? "un estudiante"} · {formatDate(proposal.created_at)} · {domainName(proposal.domain_id)}
          </p>
        </div>
        <span className="chip chip-amarillo chip-pending">
          {proposal.students} {proposal.students === 1 ? "estudiante la usa" : "estudiantes la usan"}
        </span>
      </header>

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
        <textarea className="input min-h-20" maxLength={280} value={form.description} placeholder="Una frase sobre en qué consiste." onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      <label className="field">
        <span>Ícono (SVG recomendado, máximo 256 KB)</span>
        <input className="input" type="file" accept="image/svg+xml,image/png,image/webp" onChange={(e) => setIcon(e.target.files?.[0] ?? null)} />
      </label>

      {error && <p className="text-sm text-naranja">{error}</p>}

      <div className="flex flex-wrap items-end gap-3 border-t border-borde pt-4">
        <button type="button" onClick={() => review("approve")} disabled={busy !== null || form.name.trim().length < 2} className="btn btn-primary btn-sm">
          {busy === "approve" ? <Loader2 className="animate-spin" /> : <Check />} Aprobar
        </button>
        <span className="flex flex-wrap items-center gap-2">
          <select className="input w-auto min-w-56 py-1.5 text-sm" value={target} onChange={(e) => setTarget(e.target.value ? Number(e.target.value) : "")} aria-label="Habilidad con la que se une">
            <option value="">Unir con…</option>
            {domains.map((d) => (
              <optgroup key={d.id} label={d.name}>
                {approved
                  .filter((s) => s.domain_id === d.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <button type="button" onClick={() => review("merge")} disabled={busy !== null} className="btn btn-secondary btn-sm">
            {busy === "merge" ? <Loader2 className="animate-spin" /> : <GitMerge />} Unir
          </button>
        </span>
        <button type="button" onClick={() => review("reject")} disabled={busy !== null} className="btn btn-ghost btn-sm ml-auto text-naranja">
          {busy === "reject" ? <Loader2 className="animate-spin" /> : <Trash2 />} Rechazar
        </button>
      </div>
    </article>
  );
}
