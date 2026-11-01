import type { LucideIcon } from "lucide-react";
import { Counter } from "./counter";

export function Stat({
  icon: Icon,
  value,
  label,
  tone = "azul",
  hint,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  tone?: "azul" | "verde" | "amarillo" | "naranja";
  hint?: React.ReactNode;
}) {
  return (
    <div className="card card-hover overflow-hidden">
      <span className="accent-bar" style={{ background: `var(--${tone === "azul" ? "azul-medio" : tone})` }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="display text-3xl text-azul-oscuro">
            <Counter value={value} />
          </p>
          <p className="mt-1 text-sm text-suave">{label}</p>
        </div>
        <span className={`icon-tile ${tone === "azul" ? "" : `icon-tile-${tone}`}`}>
          <Icon />
        </span>
      </div>
      {hint && <div className="mt-3 border-t border-borde pt-3 text-xs text-suave">{hint}</div>}
    </div>
  );
}
