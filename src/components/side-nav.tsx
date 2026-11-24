"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Building2, CircleUserRound, Download, Eye, History, KeyRound, LayoutDashboard, Lightbulb, ListChecks, Megaphone, Route, Search, Send, Star, UserRoundPen, Users, type LucideIcon,
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
  idea: Lightbulb,
  download: Download,
  account: CircleUserRound,
  megaphone: Megaphone,
  send: Send,
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
              {badge > 0 && <span className={`chip px-2 py-0 text-xs font-black text-azul-noche [--chip-line:transparent] ${active ? "[--chip-bg:var(--verde)]" : "[--chip-bg:var(--amarillo)]"}`}>{badge}</span>}
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
  const tabs = items.filter((i) => !i.external);
  const ref = useRef<HTMLElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  const activeHref = tabs.find(isActive)?.href;

  useEffect(() => {
    const el = ref.current;
    const current = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && current) el.scrollLeft = current.offsetLeft - (el.clientWidth - current.offsetWidth) / 2;
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [activeHref, updateEdges]);

  return (
    <div className={`mobile-tabs fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden ${edges.start ? "fade-start" : ""} ${edges.end ? "fade-end" : ""}`}>
      <nav ref={ref} onScroll={updateEdges} className="mobile-tabs-track flex overflow-x-auto" aria-label="Mi espacio">
        {tabs.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active = isActive(item);
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-w-[5.25rem] flex-1 shrink-0 flex-col items-center gap-1 px-2 py-2 text-[0.6875rem] font-black ${active ? "text-azul" : "text-suave"}`}>
              {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-verde" />}
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="whitespace-nowrap">{item.label}</span>
              {badge > 0 && <span className="absolute right-[calc(50%-1.25rem)] top-1 h-2 w-2 rounded-full bg-amarillo" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
