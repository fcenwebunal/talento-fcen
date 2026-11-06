"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ListTree } from "lucide-react";
import { getParentViewport, isEmbedded, subscribeParentViewport, type ParentViewport } from "@/lib/embed-viewport";

const STICKY_TOP = 96;
const ACTIVE_LINE = 0.3;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function GuideToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const [progress, setProgress] = useState(0);
  const [shift, setShift] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const viewport = useSyncExternalStore(subscribeParentViewport, getParentViewport, () => null);

  useEffect(() => {
    if (isEmbedded()) return;
    const sections = items.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [items]);

  // Embedded: the frame does not scroll, so position, active section and progress follow the host page's viewport.
  useEffect(() => {
    if (!viewport) return;
    const next = embeddedState(viewport, items, navRef.current);
    setActive(next.active);
    setProgress(next.progress);
    setShift(next.shift);
  }, [viewport, items]);

  return (
    <nav
      ref={navRef}
      className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto lg:block"
      style={viewport ? { transform: `translateY(${shift}px)`, maxHeight: Math.max(240, viewport.height - 112) } : undefined}
      aria-label="En esta guía"
    >
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-suave">
        <ListTree className="h-4 w-4" aria-hidden="true" /> En esta guía
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-superficie-2">
        <div className="h-full rounded-full bg-verde transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
      <ul className="mt-4 space-y-0.5 border-l border-borde text-sm">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={on ? "location" : undefined}
                className={`-ml-px block border-l-2 py-1.5 pl-3 transition-colors ${on ? "border-verde font-black text-azul-oscuro" : "border-transparent text-suave hover:border-borde hover:text-azul-oscuro"}`}
              >
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function embeddedState(viewport: ParentViewport, items: { id: string }[], nav: HTMLElement | null) {
  const line = viewport.top + viewport.height * ACTIVE_LINE;
  let active = items[0]?.id;
  for (const it of items) {
    const el = document.getElementById(it.id);
    if (el && el.getBoundingClientRect().top + window.scrollY <= line) active = it.id;
  }

  const max = document.body.getBoundingClientRect().height - viewport.height;
  const progress = max > 0 ? clamp((viewport.top / max) * 100, 0, 100) : 0;

  let shift = 0;
  const column = nav?.parentElement;
  if (nav && column) {
    const columnTop = column.getBoundingClientRect().top + window.scrollY;
    shift = clamp(viewport.top + STICKY_TOP - columnTop, 0, Math.max(0, column.offsetHeight - nav.offsetHeight));
  }
  return { active, progress, shift };
}
