import Link from "next/link";
import { ArrowUpRight, CalendarDays, Compass, GraduationCap, MapPin } from "lucide-react";
import type { SearchRow } from "@/lib/types";
import { AVAILABILITY_LABEL, MODALITY_LABEL, freshness } from "@/lib/labels";
import { Avatar } from "./ui/avatar";
import { SkillIcon } from "./ui/skill-icon";
import { LevelDots } from "./student-detail";

export function ResultCard({ row, href, highlight = [], index = 0, photoUrl = null }: { row: SearchRow; href: string; highlight?: number[]; index?: number; photoUrl?: string | null }) {
  const fresh = freshness(row.last_confirmed_at);
  const skills = [...row.skills].sort((a, b) => Number(highlight.includes(b.id)) - Number(highlight.includes(a.id)) || b.level - a.level);
  const match = highlight.length ? Math.round((row.match_count / highlight.length) * 100) : null;

  return (
    <Link
      href={href}
      className="card card-hover group flex flex-col gap-4"
      style={{ animation: `fade-up 0.6s ${Math.min(index, 8) * 60}ms var(--ease-out) both` }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={row.full_name ?? row.program_name} seed={row.student_id} src={row.contact_visible ? photoUrl : null} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[0.6875rem] font-black uppercase tracking-widest text-suave">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{row.program_name}</span>
          </p>
          <p className="mt-0.5 font-black leading-snug text-azul-oscuro">{row.full_name ?? row.headline ?? "Perfil sin titular"}</p>
          {row.full_name && row.headline && <p className="mt-0.5 line-clamp-2 text-sm text-suave">{row.headline}</p>}
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-suave transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-azul" />
      </div>

      {match !== null && (
        <div>
          <div className="flex justify-between text-xs">
            <span className="text-suave">Coincidencia</span>
            <span className="font-black text-azul">
              {row.match_count} de {highlight.length}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-superficie-2">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--azul-medio),var(--verde))]" style={{ width: `${match}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, 5).map((s) => (
          <span key={s.id} className={`chip ${highlight.includes(s.id) ? "chip-verde" : ""} ${s.pending ? "chip-pending" : ""}`} title={s.pending ? "Propuesta por el estudiante, en revisión" : undefined}>
            <SkillIcon path={s.icon} />
            {s.name} <LevelDots level={s.level} />
          </span>
        ))}
        {skills.length > 5 && <span className="chip">+{skills.length - 5}</span>}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-borde pt-3 text-xs text-suave">
        <span className={`flex items-center gap-1.5 font-black ${fresh.tone === "good" ? "text-verde-tinta" : fresh.tone === "warn" ? "text-amarillo-tinta" : ""}`}>
          <span className={`status-dot ${row.availability === "disponible" && fresh.tone === "good" ? "live" : ""}`} />
          {AVAILABILITY_LABEL[row.availability]}
        </span>
        <span>{fresh.text}</span>
        {row.practice_period && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {row.practice_period}
          </span>
        )}
        {row.modalities.length > 0 && (
          <span className="flex items-center gap-1">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" /> {row.modalities.map((m) => MODALITY_LABEL[m]).join(", ")}
          </span>
        )}
        {row.city && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {row.city}
          </span>
        )}
      </div>
    </Link>
  );
}
