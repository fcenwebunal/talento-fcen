"use client";

import { useEffect, useRef } from "react";

export function Reveal({
  children,
  className = "",
  index = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={`reveal ${className}`} style={{ "--i": index } as React.CSSProperties}>
      {children}
    </Tag>
  );
}
