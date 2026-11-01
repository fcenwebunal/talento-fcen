import type { LucideIcon } from "lucide-react";
import { Constellation, Plus, StepDivider } from "./decor";

export function PageHeader({
  kicker,
  title,
  description,
  icon: Icon,
  actions,
  children,
}: {
  kicker?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-hero relative overflow-hidden text-white">
      <div className="bg-dots-light mask-fade-b absolute inset-0" />
      <Constellation className="animate-float-slow absolute -right-8 top-4 hidden w-80 text-verde md:block" />
      <Plus className="absolute left-[46%] top-8 hidden w-4 text-white/30 md:block" />
      <div className="wrap relative pb-14 pt-10 md:pb-16 md:pt-12">
        <div className="page-in flex flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 items-start gap-4">
            {Icon && (
              <span className="icon-tile icon-tile-dark hidden h-14 w-14 sm:inline-flex">
                <Icon />
              </span>
            )}
            <div className="min-w-0">
              {kicker && <p className="kicker kicker-light">{kicker}</p>}
              <h1 className="display mt-2 text-3xl md:text-4xl">{title}</h1>
              {description && <div className="mt-2 max-w-2xl text-white/80">{description}</div>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </div>
      <StepDivider className="absolute inset-x-0 bottom-0" />
    </section>
  );
}
