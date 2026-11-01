"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import type { NavItem } from "./nav-items";
import { Icon } from "./icon";

const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CommandPalette({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return q ? items.filter((i) => normalize(`${i.label} ${i.group} ${i.keywords ?? ""}`).includes(q)) : items;
  }, [items, query]);

  function go(item: NavItem | undefined) {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }

  if (!open) return null;

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-azul-noche/50 p-4 pt-[12vh] backdrop-blur-sm" style={{ animation: "fade-in 0.15s both" }} onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-label="Ir a"
        className="w-full max-w-xl overflow-hidden rounded-[1.25rem_1.25rem_1.25rem_0.25rem] bg-white shadow-2xl"
        style={{ animation: "scale-in 0.2s var(--ease-out) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-borde px-4">
          <Search className="h-5 w-5 text-suave" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter") {
                go(results[active]);
              }
            }}
            placeholder="¿A dónde quieres ir? Ej.: habilidades, ARL, favoritos…"
            className="h-14 flex-1 bg-transparent text-base outline-none"
          />
          <button onClick={() => setOpen(false)} className="rounded-md p-1 text-suave hover:bg-superficie" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-suave">Sin resultados para «{query}»</li>}
          {results.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <li key={item.href + item.label}>
                {header && <p className="px-3 pb-1 pt-3 text-[0.6875rem] font-black uppercase tracking-widest text-suave">{header}</p>}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-3 rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] px-3 py-2.5 text-left text-sm ${i === active ? "bg-celeste text-azul-oscuro" : "text-texto"}`}
                >
                  <span className={`icon-tile h-8 w-8 ${i === active ? "bg-white" : ""}`}>
                    <Icon name={item.icon} className="!h-4 !w-4" />
                  </span>
                  <span className="flex-1 font-black">{item.label}</span>
                  
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
