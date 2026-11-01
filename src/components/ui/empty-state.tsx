import type { LucideIcon } from "lucide-react";
import { Rings } from "./decor";

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card relative overflow-hidden py-12 text-center">
      <Rings className="absolute left-1/2 top-1/2 w-72 -translate-x-1/2 -translate-y-1/2 text-azul" />
      <div className="relative">
        <span className="icon-tile mx-auto h-14 w-14" style={{ animation: "pop 0.5s var(--ease-out) both" }}>
          <Icon />
        </span>
        <p className="display mt-4 text-xl text-azul-oscuro">{title}</p>
        {text && <p className="mx-auto mt-1 max-w-sm text-sm text-suave">{text}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}
