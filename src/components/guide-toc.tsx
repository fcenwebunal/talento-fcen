"use client";

import { useEffect, useState } from "react";
import { ListTree } from "lucide-react";

export function GuideToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
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

  return (
    <nav className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto lg:block" aria-label="En esta guía">
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
