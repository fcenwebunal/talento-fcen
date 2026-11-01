export function Pending({ children = "Por confirmar con la Facultad" }: { children?: React.ReactNode }) {
  return <span className="pending">⏳ {children}</span>;
}

export function GuideSection({ id, kicker, title, children }: { id: string; kicker?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-10">
      {kicker && <p className="text-sm font-bold uppercase tracking-wider text-verde-tinta">{kicker}</p>}
      <h2 className="display mt-1 text-2xl text-azul-oscuro md:text-3xl">{title}</h2>
      <div className="prose-fcen mt-4">{children}</div>
    </section>
  );
}

export function Timeline({ steps }: { steps: { title: string; you: string; others?: string; docs?: string[]; pending?: string }[] }) {
  return (
    <ol className="relative mt-6 ml-5 space-y-6 border-l-2 border-azul/20 pl-8">
      {steps.map((s, i) => (
        <li key={s.title} className="relative">
          <span className="display absolute -left-[3.125rem] flex h-9 w-9 items-center justify-center rounded-full bg-azul text-white">{i + 1}</span>
          <div className="card">
            <h3 className="text-lg font-bold text-azul-oscuro">{s.title}</h3>
            <p className="mt-1">{s.you}</p>
            {s.others && <p className="mt-2 text-sm text-suave">{s.others}</p>}
            {s.docs && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.docs.map((d) => (
                  <span key={d} className="chip chip-azul">
                    📄 {d}
                  </span>
                ))}
              </div>
            )}
            {s.pending && (
              <p className="mt-3 text-sm">
                <Pending>{s.pending}</Pending>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="mt-2">
      {items.map((it) => (
        <details key={it.q} className="faq">
          <summary>{it.q}</summary>
          <div className="mt-2 text-suave">{it.a}</div>
        </details>
      ))}
    </div>
  );
}

export function Toc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav className="sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-y-auto lg:block" aria-label="En esta guía">
      <p className="text-xs font-bold uppercase tracking-wider text-suave">En esta guía</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className="text-azul-oscuro hover:text-azul-medio">
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
