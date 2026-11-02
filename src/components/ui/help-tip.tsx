"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";

const GAP = 6;
const MARGIN = 8;

export function HelpTip({ children, label = "Ayuda", align = "left" }: { children: React.ReactNode; label?: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);

  // Rendered in a portal with fixed coordinates so cards with overflow hidden can't clip it; kept inside the viewport.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = buttonRef.current?.getBoundingClientRect();
      // offset sizes ignore the scale-in animation, which would make the popup look smaller than it ends up
      const el = popRef.current;
      if (!button || !el) return;
      const pop = { width: el.offsetWidth, height: el.offsetHeight };
      const vw = document.documentElement.clientWidth;
      const preferred = align === "right" ? button.right - pop.width : button.left;
      const left = Math.min(Math.max(preferred, MARGIN), vw - pop.width - MARGIN);
      const below = button.bottom + GAP;
      const top = below + pop.height > window.innerHeight - MARGIN && button.top - GAP - pop.height > MARGIN ? button.top - GAP - pop.height : below;
      setPos({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !popRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <span className="relative inline-flex align-middle">
      <button
        ref={buttonRef}
        type="button"
        className="help-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPos(null);
          setOpen(!open);
        }}
      >
        <CircleHelp aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <span
            ref={popRef}
            id={id}
            role="tooltip"
            className="help-pop"
            style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, zIndex: 60, visibility: pos ? "visible" : "hidden" }}
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  );
}
