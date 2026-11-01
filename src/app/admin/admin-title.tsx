import type { LucideIcon } from "lucide-react";

export function AdminTitle({ icon: Icon, title, description, actions }: { icon: LucideIcon; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="icon-tile h-12 w-12">
          <Icon />
        </span>
        <div>
          <h1 className="display text-3xl text-azul-oscuro">{title}</h1>
          {description && <p className="text-sm text-suave">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}
