import Link from "next/link";
import type { SearchRow } from "@/lib/types";
import { AVAILABILITY_LABEL, MODALITY_LABEL, SKILL_LEVEL, freshness } from "@/lib/labels";

export function ResultCard({ row, href, highlight = [] }: { row: SearchRow; href: string; highlight?: number[] }) {
  const fresh = freshness(row.last_confirmed_at);
  const skills = [...row.skills].sort((a, b) => Number(highlight.includes(b.id)) - Number(highlight.includes(a.id)));

  return (
    <Link href={href} className="card flex flex-col gap-3 transition hover:border-azul hover:shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-suave">{row.program_name}</p>
        <p className="mt-1 font-bold text-azul-oscuro">{row.full_name ?? row.headline ?? "Perfil sin titular"}</p>
        {row.full_name && row.headline && <p className="text-sm text-suave">{row.headline}</p>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 6).map((s) => (
          <span key={s.id} className={`chip ${highlight.includes(s.id) ? "chip-verde" : ""}`}>
            {s.name} · {SKILL_LEVEL[s.level]}
          </span>
        ))}
        {skills.length > 6 && <span className="chip">+{skills.length - 6}</span>}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-suave">
        <span className={fresh.tone === "good" ? "text-verde-tinta" : fresh.tone === "warn" ? "text-amarillo-tinta" : ""}>
          {AVAILABILITY_LABEL[row.availability]} · {fresh.text}
        </span>
        {row.practice_period && <span>Periodo {row.practice_period}</span>}
        {row.modalities.length > 0 && <span>{row.modalities.map((m) => MODALITY_LABEL[m]).join(", ")}</span>}
        {row.city && <span>{row.city}</span>}
        {highlight.length > 0 && <span className="font-bold text-azul">{row.match_count} de {highlight.length} habilidades</span>}
      </div>
    </Link>
  );
}
