import type { LucideIcon } from "lucide-react";

export function PageHeader({
  kicker,
  title,
  description,
  icon: Icon,
  actions,
  art,
  children,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  art?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-head wrap page-in pb-6 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {Icon && (
            <span className="icon-tile h-12 w-12">
              <Icon />
            </span>
          )}
          <div className="min-w-0">
            {kicker && <p className="text-xs font-black uppercase tracking-widest text-suave">{kicker}</p>}
            <h1 className="display text-2xl text-azul-oscuro md:text-3xl">{title}</h1>
            {description && <div className="mt-0.5 max-w-3xl text-sm text-suave">{description}</div>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {art && <div className="hidden xl:block">{art}</div>}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
      {children}
    </header>
  );
}
