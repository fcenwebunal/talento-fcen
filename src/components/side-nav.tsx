"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Building2, Eye, History, KeyRound, LayoutDashboard, ListChecks, Route, Search, Star, UserRoundPen, Users, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  userPen: UserRoundPen,
  eye: Eye,
  route: Route,
  search: Search,
  star: Star,
  building: Building2,
  users: Users,
  list: ListChecks,
  history: History,
  key: KeyRound,
};

export type SideItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONS | string;
  exact?: boolean;
  external?: boolean;
  badgeKey?: string;
  children?: { href: string; label: string; param: string }[];
};

function useActive() {
  const pathname = usePathname();
  return (item: SideItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));
}

export function SideNav({ items, badges }: { items: SideItem[]; badges: Record<string, number> }) {
  const isActive = useActive();
  const params = useSearchParams();
  const section = params.get("seccion") ?? "personales";

  const main = items.filter((i) => !i.external);
  const extra = items.filter((i) => i.external);

  return (
    <nav aria-label="Mi espacio" className="space-y-1">
      {main.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        const active = isActive(item);
        const badge = item.badgeKey ? badges[item.badgeKey] : 0;
        return (
          <div key={item.href}>
            <Link href={item.href} className="side-link" aria-current={active ? "page" : undefined}>
              <Icon aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && <span className={`rounded-full px-2 text-xs ${active ? "bg-verde text-azul-noche" : "bg-amarillo text-azul-noche"}`}>{badge}</span>}
            </Link>
            {item.children && active && (
              <div className="mt-1 space-y-0.5" style={{ animation: "fade-in 0.25s both" }}>
                {item.children.map((c) => (
                  <Link key={c.href} href={c.href} className="side-sub" aria-current={section === c.param ? "true" : undefined}>
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {extra.length > 0 && (
        <>
          <p className="px-3 pb-1 pt-5 text-[0.6875rem] font-black uppercase tracking-widest text-suave">Ayuda</p>
          {extra.map((item) => {
            const Icon = ICONS[item.icon] ?? Route;
            return (
              <Link key={item.href} href={item.href} className="side-link">
                <Icon aria-hidden="true" /> {item.label}
              </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}

export function MobileTabs({ items, badges }: { items: SideItem[]; badges: Record<string, number> }) {
  const isActive = useActive();
  const tabs = items.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid border-t border-borde bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }} aria-label="Mi espacio">
      {tabs.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        const active = isActive(item);
        const badge = item.badgeKey ? badges[item.badgeKey] : 0;
        return (
          <Link key={item.href} href={item.href} className={`relative flex flex-col items-center gap-1 py-2 text-[0.6875rem] font-black ${active ? "text-azul" : "text-suave"}`}>
            {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-verde" />}
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
            {badge > 0 && <span className="absolute right-[calc(50%-1.25rem)] top-1 h-2 w-2 rounded-full bg-amarillo" />}
          </Link>
        );
      })}
    </nav>
  );
}
