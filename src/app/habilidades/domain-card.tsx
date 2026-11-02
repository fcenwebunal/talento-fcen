"use client";

import { useState } from "react";
import type { Skill } from "@/lib/types";
import { SkillIcon } from "@/components/ui/skill-icon";

// Skills of one group as chips; picking one shows its description inside the same card
export function DomainSkills({ skills, counts }: { skills: Skill[]; counts: Record<string, number> }) {
  const [open, setOpen] = useState<number | null>(null);
  const current = skills.find((s) => s.id === open);

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={open === s.id}
            onClick={() => setOpen(open === s.id ? null : s.id)}
            className={`chip ${counts[s.name] ? "chip-verde" : ""} ${open === s.id ? "[--chip-line:var(--azul)]" : ""}`}
          >
            <SkillIcon path={s.icon_path} />
            {s.name}
            {counts[s.name] ? <strong>· {counts[s.name]}</strong> : null}
          </button>
        ))}
      </div>
      {current && (
        <div className="mt-4 flex gap-3 rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] bg-celeste p-3" style={{ animation: "fade-up 0.25s var(--ease-out) both" }}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <SkillIcon path={current.icon_path} className="h-6 w-6" />
          </span>
          <div className="text-sm">
            <p className="font-black text-azul-oscuro">{current.name}</p>
            <p className="mt-0.5 text-suave">{current.description ?? "Sin descripción por ahora."}</p>
          </div>
        </div>
      )}
    </>
  );
}
