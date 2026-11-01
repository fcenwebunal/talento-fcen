import { FileText, Hourglass } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { GuideToc } from "./guide-toc";
import { GuideArt } from "./ui/guide-art";

export function Pending({ children = "Por confirmar con la Facultad" }: { children?: React.ReactNode }) {
  return (
    <span className="pending">
      <Hourglass className="mr-1 inline h-3 w-3 align-[-0.125rem]" aria-hidden="true" />
      {children}
    </span>
  );
}

export function GuideSection({ id, kicker, title, children }: { id: string; kicker?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} data-guide-section className="scroll-mt-24 py-12">
      <Reveal className="flex items-center justify-between gap-6">
        <div>
          {kicker && <p className="kicker">{kicker}</p>}
          <h2 className="display mt-2 text-2xl text-azul-oscuro md:text-3xl">{title}</h2>
        </div>
        <GuideArt id={id} className="hidden sm:block" />
      </Reveal>
      <Reveal className="prose-fcen mt-5">{children}</Reveal>
    </section>
  );
}

export function Timeline({ steps }: { steps: { title: string; you: string; others?: string; docs?: string[]; pending?: string }[] }) {
  return (
    <ol className="relative mt-8 ml-5 space-y-5 border-l-2 border-dashed border-azul/25 pl-9">
      {steps.map((s, i) => (
        <Reveal as="li" key={s.title} index={i} className="relative">
          <span className="display absolute -left-[3.6rem] top-3 flex h-10 w-10 items-center justify-center rounded-[0.75rem_0.75rem_0.75rem_0.1875rem] bg-azul text-white shadow-md ring-4 ring-[var(--fondo)]">
            {i + 1}
          </span>
          <div className="card card-hover">
            <h3 className="text-lg font-black text-azul-oscuro">{s.title}</h3>
            <p className="mt-1">{s.you}</p>
            {s.others && <p className="mt-2 border-l-2 border-verde pl-3 text-sm text-suave">{s.others}</p>}
            {s.docs && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {s.docs.map((d) => (
                  <span key={d} className="chip chip-azul">
                    <FileText /> {d}
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
        </Reveal>
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
  return <GuideToc items={items} />;
}
